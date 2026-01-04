/**
 * SLC Agent - AI Conversation Orchestrator
 *
 * Extends AIChatAgent to handle AI conversations with tool execution.
 * Uses @anthropic-ai/sdk for API calls through Cloudflare AI Gateway.
 */

import { AIChatAgent } from 'agents/ai-chat-agent';
import Anthropic from '@anthropic-ai/sdk';
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
} from 'ai';
import type { StreamTextOnFinishCallback, ToolSet, UIMessage } from 'ai';
import type { CanvasDO } from '../durable-objects/CanvasDO';
import type { Connection } from 'agents';
import { formatCanvasContext, buildSystemPrompt, type ToneProfileId, DEFAULT_TONE_PROFILE } from './prompts';
import { ANTHROPIC_TOOLS, executeToolWithBroadcast } from './anthropic-tools';
import { createLogger, createMetrics, type Logger, type Metrics } from '../observability';

/**
 * Agent state that syncs to connected clients
 *
 * Includes canvas state for real-time sync when AI updates sections via tools.
 * This leverages the Agents SDK's built-in WebSocket state sync rather than
 * requiring a separate SSE endpoint or polling.
 */
export interface AgentState {
  status: 'idle' | 'thinking' | 'searching' | 'updating' | 'error';
  statusMessage: string;
  /** Canvas state - synced after tool execution */
  canvas: import('../../src/types/canvas').CanvasState | null;
  /** Timestamp of last canvas update for change detection */
  canvasUpdatedAt: string | null;
  /** Tone profile for AI communication style */
  toneProfile: ToneProfileId;
}

/**
 * SLC Agent implementation
 */
export class SLCAgent extends AIChatAgent<Env, AgentState> {
  initialState: AgentState = {
    status: 'idle',
    statusMessage: '',
    canvas: null,
    canvasUpdatedAt: null,
    toneProfile: DEFAULT_TONE_PROFILE,
  };

  /**
   * Get logger for this agent instance
   * Uses canvasId (this.name) as request ID for correlation
   */
  private getLogger(): Logger {
    return createLogger('SLCAgent', this.name || 'unknown');
  }

  /**
   * Get metrics tracker for this agent instance
   */
  private getMetrics(): Metrics {
    return createMetrics(this.env.SLC_ANALYTICS);
  }

  /**
   * Handle errors - logs and updates state
   */
  onError(connection: Connection, error: Error): void {
    const logger = this.getLogger();
    const metrics = this.getMetrics();
    logger.error('Agent error', error, { connectionId: connection.id });
    metrics.trackEvent('error', {
      sessionId: this.name,
      errorType: error.name,
      success: false,
    });
    this.setStatus('error', error.message);
  }

  /**
   * Handle new WebSocket connection - broadcast canvas state
   * This ensures clients get canvas data immediately on connect
   */
  async onConnect(connection: Connection): Promise<void> {
    const logger = this.getLogger();
    logger.info('Client connected', { connectionId: connection.id });

    // Broadcast canvas state so the client gets it immediately
    await this.broadcastCanvasUpdate();
  }

  /**
   * Get a stub for a CanvasDO instance
   */
  getCanvasStub(canvasId: string): DurableObjectStub<CanvasDO> {
    return this.env.CANVAS.get(
      this.env.CANVAS.idFromName(canvasId)
    ) as DurableObjectStub<CanvasDO>;
  }

  /**
   * Update agent status (syncs to connected clients)
   * Preserves existing canvas state
   */
  setStatus(status: AgentState['status'], message = ''): void {
    this.setState({
      ...this.state,
      status,
      statusMessage: message,
    });
  }

  /**
   * Extract canvasId from agent name (format: canvasId or canvasId--threadId)
   * Using -- separator to avoid PartySocket routing issues with /
   */
  private getCanvasId(): string | null {
    if (!this.name) return null;
    return this.name.split('--')[0];
  }

  /**
   * Broadcast canvas state to all connected clients
   * Called after tool execution modifies the canvas
   */
  async broadcastCanvasUpdate(): Promise<void> {
    const canvasId = this.getCanvasId();
    if (!canvasId) return;

    const logger = this.getLogger();
    try {
      const stub = this.getCanvasStub(canvasId);
      const canvas = await stub.getFullCanvas();
      this.setState({
        ...this.state,
        canvas,
        canvasUpdatedAt: canvas.updatedAt,
      });
      logger.info('Canvas state broadcasted to clients');
    } catch (error) {
      logger.error('Failed to broadcast canvas', error);
    }
  }

  /**
   * Get canvas context for system prompt
   * Also broadcasts canvas state to clients for initial sync
   */
  private async getCanvasContext(): Promise<string> {
    const canvasId = this.getCanvasId();
    const logger = this.getLogger();

    if (!canvasId) {
      logger.warn('No canvas ID available');
      return formatCanvasContext(null);
    }

    try {
      const stub = this.getCanvasStub(canvasId);
      const canvas = await stub.getFullCanvas();

      // Sync canvas state to connected clients
      // This ensures frontend has canvas on first message
      this.setState({
        ...this.state,
        canvas,
        canvasUpdatedAt: canvas.updatedAt,
      });

      return formatCanvasContext({
        purpose: canvas.sections.find(s => s.sectionKey === 'purpose')?.content,
        customers: canvas.sections.find(s => s.sectionKey === 'customers')?.content,
        jobsToBeDone: canvas.sections.find(s => s.sectionKey === 'jobsToBeDone')?.content,
        valueProposition: canvas.sections.find(s => s.sectionKey === 'valueProposition')?.content,
        solution: canvas.sections.find(s => s.sectionKey === 'solution')?.content,
        channels: canvas.sections.find(s => s.sectionKey === 'channels')?.content,
        revenue: canvas.sections.find(s => s.sectionKey === 'revenue')?.content,
        costs: canvas.sections.find(s => s.sectionKey === 'costs')?.content,
        advantage: canvas.sections.find(s => s.sectionKey === 'advantage')?.content,
        keyMetrics: canvas.sections.find(s => s.sectionKey === 'keyMetrics')?.content,
        impactModel: canvas.impactModel,
      });
    } catch (error) {
      logger.error('Failed to get canvas context', error);
      return formatCanvasContext(null);
    }
  }

  /**
   * Extract text content from a UIMessage
   */
  private getMessageText(message: UIMessage): string {
    if (!message.parts) return '';
    return message.parts
      .filter((part): part is { type: 'text'; text: string } =>
        part.type === 'text' && 'text' in part
      )
      .map((part) => part.text)
      .join('');
  }

  /**
   * Handle incoming chat message with streaming response
   */
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>
  ): Promise<Response | undefined> {
    const logger = this.getLogger();
    const metrics = this.getMetrics();
    const sessionId = this.name || 'unknown';

    logger.info('Chat message received', {
      canvasId: this.name,
      messageCount: this.messages.length,
      hasAccountId: !!this.env.CF_ACCOUNT_ID,
      hasGatewayId: !!this.env.CF_GATEWAY_ID,
      hasApiKey: !!this.env.ANTHROPIC_API_KEY,
    });

    metrics.trackEvent('message_received', { sessionId });

    this.setStatus('thinking', 'Processing your message...');

    try {
      // Get canvas context
      this.setStatus('searching', 'Gathering context...');
      const canvasContext = await this.getCanvasContext();
      const systemPrompt = buildSystemPrompt(canvasContext, this.state.toneProfile);

      // Create Anthropic client via AI Gateway (per design.md specification)
      // If CF_AIG_TOKEN is set, the gateway has Authenticated Gateway enabled
      const defaultHeaders: Record<string, string> = {};
      if (this.env.CF_AIG_TOKEN) {
        defaultHeaders['cf-aig-authorization'] = `Bearer ${this.env.CF_AIG_TOKEN}`;
      }

      const client = new Anthropic({
        apiKey: this.env.ANTHROPIC_API_KEY,
        baseURL: `https://gateway.ai.cloudflare.com/v1/${this.env.CF_ACCOUNT_ID}/${this.env.CF_GATEWAY_ID}/anthropic`,
        defaultHeaders,
      });

      this.setStatus('thinking', 'Generating response...');

      // Convert UIMessages to Anthropic message format
      const anthropicMessages: Anthropic.MessageParam[] = this.messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: this.getMessageText(m),
        }));

      logger.info('Sending messages to Anthropic', { messageCount: anthropicMessages.length });

      // Use Vercel AI SDK utilities to create UI message stream
      const toolContext = this; // For tool execution
      const messageTimer = metrics.startTimer('message_sent', { sessionId });

      const uiStream = createUIMessageStream({
        execute: async ({ writer }) => {
          try {
            let currentMessages = [...anthropicMessages];
            let continueLoop = true;
            const maxSteps = 25; // Enough for full canvas population (~20 tool calls)
            let step = 0;

            while (continueLoop && step < maxSteps) {
              step++;
              logger.info('Processing step', { step, maxSteps });

              // Generate unique ID for this step's text part
              // Each agentic step needs its own ID to avoid confusing the AI SDK
              const stepTextPartId = crypto.randomUUID();

              // Create streaming response with tools
              const stream = client.messages.stream({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 8192,
                system: systemPrompt,
                messages: currentMessages,
                tools: ANTHROPIC_TOOLS,
              });

              let fullText = '';
              let hasStartedText = false;
              const toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];

              // Process stream events
              for await (const event of stream) {
                if (event.type === 'content_block_start') {
                  if (event.content_block.type === 'text' && !hasStartedText) {
                    writer.write({ type: 'text-start', id: stepTextPartId });
                    hasStartedText = true;
                  }
                } else if (event.type === 'content_block_delta') {
                  if (event.delta.type === 'text_delta') {
                    const text = event.delta.text;
                    fullText += text;
                    writer.write({ type: 'text-delta', id: stepTextPartId, delta: text });
                  } else if (event.delta.type === 'input_json_delta') {
                    // Tool input is being streamed - we'll get full input at end
                  }
                } else if (event.type === 'content_block_stop') {
                  // Content block finished
                } else if (event.type === 'message_delta') {
                  // Check stop reason
                  if (event.delta.stop_reason === 'tool_use') {
                    logger.info('Tool use detected');
                  }
                }
              }

              // Get final message to extract tool calls
              const finalMessage = await stream.finalMessage();

              // Close text if we started it
              if (hasStartedText) {
                writer.write({ type: 'text-end', id: stepTextPartId });
              }

              // Check for tool use
              const toolUseBlocks = finalMessage.content.filter(
                (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
              );

              if (toolUseBlocks.length > 0) {
                logger.info('Executing tools', { count: toolUseBlocks.length });

                // Build tool results
                const toolResults: Anthropic.ToolResultBlockParam[] = [];

                for (const toolBlock of toolUseBlocks) {
                  console.log(`[SLCAgent] Executing tool: ${toolBlock.name}`);
                  console.log(`[SLCAgent] Tool context name: ${toolContext.name}`);
                  const toolTimer = logger.startTimer(`tool:${toolBlock.name}`);
                  try {
                    const result = await executeToolWithBroadcast(
                      {
                        name: toolContext.name, // Explicitly pass name (not copied by spread)
                        state: toolContext.state,
                        setState: (s) => toolContext.setState(s),
                        getCanvasStub: (id) => toolContext.getCanvasStub(id),
                        env: toolContext.env,
                        broadcastCanvasUpdate: () => toolContext.broadcastCanvasUpdate(),
                      },
                      toolBlock.name,
                      toolBlock.input as Record<string, unknown>
                    );
                    toolResults.push({
                      type: 'tool_result',
                      tool_use_id: toolBlock.id,
                      content: JSON.stringify(result),
                    });
                    const durationMs = toolTimer.end({ success: true });
                    metrics.trackEvent('tool_executed', {
                      sessionId,
                      toolName: toolBlock.name,
                      success: true,
                      durationMs,
                    });
                  } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                    const durationMs = toolTimer.end({ success: false, error: errorMsg });
                    logger.error(`Tool ${toolBlock.name} failed`, error);
                    metrics.trackEvent('tool_executed', {
                      sessionId,
                      toolName: toolBlock.name,
                      success: false,
                      durationMs,
                    });
                    toolResults.push({
                      type: 'tool_result',
                      tool_use_id: toolBlock.id,
                      content: `Error: ${errorMsg}`,
                      is_error: true,
                    });
                  }
                }

                // Add assistant message and tool results to continue conversation
                currentMessages.push({
                  role: 'assistant',
                  content: finalMessage.content,
                });
                currentMessages.push({
                  role: 'user',
                  content: toolResults,
                });

                // Continue loop to get Claude's response after tool execution
                continueLoop = true;
              } else {
                // No tool use, we're done
                continueLoop = false;
              }

              logger.info('Step complete', { step, textLength: fullText.length });
            }

            // Note: Don't manually write 'finish' - createUIMessageStream handles it
            // when the execute function completes successfully
            messageTimer(); // End message_sent timer
            logger.info('Stream finished');

            // Persist messages - required when using custom streaming
            // The SDK auto-persists with streamText().toUIMessageStreamResponse(),
            // but with createUIMessageStream we need to save explicitly
            try {
              await this.saveMessages(this.messages);
              logger.info('Messages persisted', { count: this.messages.length });
            } catch (saveError) {
              logger.error('Failed to persist messages', saveError);
            }

            this.setStatus('idle', '');
          } catch (error) {
            logger.error('Stream error', error);
            metrics.trackEvent('error', {
              sessionId,
              errorType: 'StreamError',
              success: false,
            });
            writer.write({
              type: 'error',
              errorText: error instanceof Error ? error.message : 'Unknown error',
            });
            this.setStatus('error', 'Stream failed');
          }
        },
      });

      // Return as UI message stream response
      return createUIMessageStreamResponse({ stream: uiStream });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Chat error', error);
      metrics.trackEvent('error', {
        sessionId,
        errorType: error instanceof Error ? error.name : 'Unknown',
        success: false,
      });
      this.setStatus('error', errorMessage);
      throw error;
    }
  }
}
