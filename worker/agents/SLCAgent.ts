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
import { ANTHROPIC_TOOLS, executeToolWithBroadcast } from './anthropic-tools';

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
  };

  /**
   * Handle errors - logs and updates state
   */
  onError(connection: Connection, error: Error): void {
    console.error('[SLCAgent] onError:', error.message);
    console.error('[SLCAgent] onError stack:', error.stack);
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
    const canvasId = this.name;
    if (!canvasId) return;

    try {
      const stub = this.getCanvasStub(canvasId);
      const canvas = await stub.getFullCanvas();
      this.setState({
        ...this.state,
        canvas,
        canvasUpdatedAt: canvas.updatedAt,
      });
      console.log('[SLCAgent] Canvas state broadcasted to clients');
    } catch (error) {
      console.error('[SLCAgent] Failed to broadcast canvas:', error);
    }
  }

  /**
   * Get canvas context for system prompt
   * Also broadcasts canvas state to clients for initial sync
   */
  private async getCanvasContext(): Promise<string> {
    const canvasId = this.name;
    if (!canvasId) {
      console.error('[SLCAgent] No canvas ID available');
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
      console.error('[SLCAgent] Failed to get canvas context:', error);
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
    console.log('[SLCAgent] onChatMessage called');
    console.log('[SLCAgent] Agent name (canvasId):', this.name);
    console.log('[SLCAgent] Message count:', this.messages.length);
    console.log('[SLCAgent] CF_ACCOUNT_ID:', this.env.CF_ACCOUNT_ID ? 'set' : 'NOT SET');
    console.log('[SLCAgent] CF_GATEWAY_ID:', this.env.CF_GATEWAY_ID ? 'set' : 'NOT SET');
    console.log('[SLCAgent] ANTHROPIC_API_KEY:', this.env.ANTHROPIC_API_KEY ? 'set' : 'NOT SET');

    this.setStatus('thinking', 'Processing your message...');

    try {
      // Get canvas context
      this.setStatus('searching', 'Gathering context...');
      const canvasContext = await this.getCanvasContext();
      const systemPrompt = buildSystemPrompt(canvasContext);

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

      console.log('[SLCAgent] Sending', anthropicMessages.length, 'messages to Anthropic');

      // Use Vercel AI SDK utilities to create UI message stream
      const textPartId = crypto.randomUUID();
      const toolContext = this; // For tool execution

      const uiStream = createUIMessageStream({
        execute: async ({ writer }) => {
          try {
            let currentMessages = [...anthropicMessages];
            let continueLoop = true;
            const maxSteps = 5;
            let step = 0;

            while (continueLoop && step < maxSteps) {
              step++;
              console.log(`[SLCAgent] Step ${step}/${maxSteps}`);

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
                    console.log('[SLCAgent] Tool use detected');
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
                console.log(`[SLCAgent] Executing ${toolUseBlocks.length} tool(s)`);

                // Build tool results
                const toolResults: Anthropic.ToolResultBlockParam[] = [];

                for (const toolBlock of toolUseBlocks) {
                  console.log(`[SLCAgent] Executing tool: ${toolBlock.name}`);
                  try {
                    const result = await executeToolWithBroadcast(
                      {
                        ...toolContext,
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
                    console.log(`[SLCAgent] Tool ${toolBlock.name} succeeded`);
                  } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                    console.error(`[SLCAgent] Tool ${toolBlock.name} failed:`, errorMsg);
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

              console.log(`[SLCAgent] Step ${step} complete, text length: ${fullText.length}`);
            }

            // Note: Don't manually write 'finish' - createUIMessageStream handles it
            // when the execute function completes successfully
            console.log('[SLCAgent] Stream finished');
            this.setStatus('idle', '');
          } catch (error) {
            console.error('[SLCAgent] Stream error:', error);
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
      console.error('[SLCAgent] Chat error:', error);
      console.error('[SLCAgent] Error stack:', error instanceof Error ? error.stack : 'no stack');
      this.setStatus('error', errorMessage);
      throw error;
    }
  }
}
