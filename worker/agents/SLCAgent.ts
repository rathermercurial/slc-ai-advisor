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
import { formatCanvasContext, buildSystemPrompt } from './prompts';
import {
  ANTHROPIC_TOOLS,
  ALL_TOOLS,
  executeToolWithBroadcast,
  type ExecutorContext,
} from './tools';
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
  /** Canvas ID this thread belongs to (extracted from connection URL) */
  canvasId: string | null;
  /** Thread ID (this.name) */
  threadId: string | null;
}

/**
 * SLC Agent implementation
 *
 * In the multi-thread architecture:
 * - this.name = threadId (unique per conversation)
 * - canvasId is extracted from ?canvasId query param on WebSocket connect
 * - For backward compatibility, if no canvasId param, use this.name as canvasId
 */
export class SLCAgent extends AIChatAgent<Env, AgentState> {
  initialState: AgentState = {
    status: 'idle',
    statusMessage: '',
    canvas: null,
    canvasUpdatedAt: null,
    canvasId: null,
    threadId: null,
  };

  /**
   * Handle WebSocket connection
   * Extracts canvasId from URL query parameter
   */
  async onConnect(connection: Connection, ctx: { request: Request }): Promise<void> {
    const logger = this.getLogger();
    const url = new URL(ctx.request.url);

    // Extract canvasId from query param, fallback to this.name for backward compatibility
    const canvasId = url.searchParams.get('canvasId') || this.name;
    const threadId = this.name;

    logger.info('Agent connected', { threadId, canvasId, url: url.pathname });

    // Store in state for access during chat
    this.setState({
      ...this.state,
      canvasId,
      threadId,
    });

    // Touch thread to update last_message_at (only if we have a different canvasId)
    if (canvasId && canvasId !== threadId) {
      try {
        const stub = this.getCanvasStub(canvasId);
        await stub.touchThread(threadId);
      } catch (error) {
        logger.warn('Failed to touch thread', { error });
      }
    }
  }

  /**
   * Get the canvas ID for this thread
   * Falls back to this.name for backward compatibility
   */
  private getCanvasId(): string {
    return this.state.canvasId || this.name || '';
  }

  /**
   * Get the thread ID (this.name)
   */
  private getThreadId(): string {
    return this.name || '';
  }

  /**
   * Get logger for this agent instance
   * Uses threadId as request ID for correlation
   */
  private getLogger(): Logger {
    return createLogger('SLCAgent', this.getThreadId() || 'unknown');
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
   * Get recent messages from this thread (for cross-thread context sharing)
   * This is an RPC method that can be called by sibling agents
   *
   * @param limit - Maximum number of messages to return
   * @returns Array of simplified messages (role + text content)
   */
  async getRecentMessages(limit = 10): Promise<Array<{ role: string; content: string }>> {
    // this.messages is provided by AIChatAgent from the SDK
    const messages = this.messages.slice(-limit);

    return messages.map((msg) => ({
      role: msg.role,
      content: this.getMessageText(msg),
    }));
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
    const canvasId = this.getCanvasId();
    const threadId = this.getThreadId();
    const sessionId = threadId || 'unknown';

    logger.info('Chat message received', {
      threadId,
      canvasId,
      messageCount: this.messages.length,
      hasAccountId: !!this.env.CF_ACCOUNT_ID,
      hasGatewayId: !!this.env.CF_GATEWAY_ID,
      hasApiKey: !!this.env.ANTHROPIC_API_KEY,
    });

    metrics.trackEvent('message_received', { sessionId });

    this.setStatus('thinking', 'Processing your message...');

    try {
      // Get canvas context and thread summaries for cross-thread context
      this.setStatus('searching', 'Gathering context...');
      const canvasContext = await this.getCanvasContext();

      // Fetch thread summaries for cross-thread context sharing
      const canvasId = this.getCanvasId();
      const threadId = this.getThreadId();
      let threadSummaries: Array<{ id: string; title: string | null; summary: string | null }> = [];

      if (canvasId) {
        try {
          const stub = this.getCanvasStub(canvasId);
          threadSummaries = await stub.getThreadSummaries();
        } catch (error) {
          logger.warn('Failed to fetch thread summaries', { error });
        }
      }

      const systemPrompt = buildSystemPrompt(canvasContext, threadSummaries, threadId);

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
      const textPartId = crypto.randomUUID();
      const messageTimer = metrics.startTimer('message_sent', { sessionId });

      // Create executor context for tool execution
      const executorContext: ExecutorContext = {
        canvasId,
        canvasStub: this.getCanvasStub(canvasId),
        env: this.env,
        logger,
        setStatus: (status, message) => this.setStatus(status, message),
      };

      const uiStream = createUIMessageStream({
        execute: async ({ writer }) => {
          try {
            let currentMessages = [...anthropicMessages];
            let continueLoop = true;
            const maxSteps = 5;
            let step = 0;

            while (continueLoop && step < maxSteps) {
              step++;
              logger.info('Processing step', { step, maxSteps });

              // Create streaming response with tools
              const stream = client.messages.stream({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4096,
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
                    writer.write({ type: 'text-start', id: textPartId });
                    hasStartedText = true;
                  }
                } else if (event.type === 'content_block_delta') {
                  if (event.delta.type === 'text_delta') {
                    const text = event.delta.text;
                    fullText += text;
                    writer.write({ type: 'text-delta', id: textPartId, delta: text });
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
                writer.write({ type: 'text-end', id: textPartId });
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
                  const toolTimer = logger.startTimer(`tool:${toolBlock.name}`);
                  try {
                    const result = await executeToolWithBroadcast(
                      ALL_TOOLS,
                      toolBlock.name,
                      toolBlock.input,
                      executorContext,
                      () => this.broadcastCanvasUpdate()
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
