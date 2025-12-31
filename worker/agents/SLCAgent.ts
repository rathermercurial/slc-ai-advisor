/**
 * SLC Agent - AI Conversation Orchestrator
 *
 * Extends AIChatAgent to handle AI conversations with tool execution.
 * Uses Vercel AI SDK with @ai-sdk/anthropic for SDK-native streaming.
 */

import { AIChatAgent } from 'agents/ai-chat-agent';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import type { StreamTextOnFinishCallback, ToolSet } from 'ai';
import type { CanvasDO } from '../durable-objects/CanvasDO';
import type { Connection } from 'agents';
import { formatCanvasContext, buildSystemPrompt, type ToneProfileId, DEFAULT_TONE_PROFILE } from './prompts';
import { createTools } from './tools';
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

  /** Counter for tracking duplicate onChatMessage invocations */
  private chatInvocationCount = 0;

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
   * Overrides base class method which has overloaded signatures:
   * - onError(connection: Connection, error: unknown): void | Promise<void>
   * - onError(error: unknown): void | Promise<void>
   */
  onError(connectionOrError: Connection | unknown, error?: unknown): void {
    const logger = this.getLogger();
    const metrics = this.getMetrics();

    // Handle both overload signatures
    let theError: unknown;
    let connectionId: string | undefined;

    if (error !== undefined) {
      // Called with (connection, error)
      theError = error;
      connectionId = (connectionOrError as Connection).id;
    } else {
      // Called with (error) only
      theError = connectionOrError;
    }

    const errorMessage = theError instanceof Error ? theError.message : String(theError);
    const errorName = theError instanceof Error ? theError.name : 'Unknown';

    logger.error('Agent error', theError, { connectionId });
    metrics.trackEvent('error', {
      sessionId: this.name,
      errorType: errorName,
      success: false,
    });
    this.setStatus('error', errorMessage);
  }

  /**
   * Handle new WebSocket connection - broadcast canvas state
   * This ensures clients get canvas data immediately on connect
   */
  async onConnect(connection: Connection): Promise<void> {
    const logger = this.getLogger();
    logger.info('Client connected', {
      connectionId: connection.id,
      chatInvocationCount: this.chatInvocationCount,
    });

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
   * Handle incoming chat message with streaming response
   *
   * Uses Vercel AI SDK's streamText() for SDK-native streaming and
   * automatic message persistence. The SDK handles:
   * - Message history management
   * - Tool execution loop (via maxSteps)
   * - Stream formatting for UI consumption
   */
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>
  ): Promise<Response | undefined> {
    const logger = this.getLogger();
    const metrics = this.getMetrics();
    const sessionId = this.name || 'unknown';

    // Track invocation for debugging duplicate calls
    this.chatInvocationCount++;
    const invocationId = this.chatInvocationCount;
    const lastMessage = this.messages[this.messages.length - 1];

    logger.info('onChatMessage INVOKED', {
      invocationId,
      canvasId: this.name,
      messageCount: this.messages.length,
      lastMessageRole: lastMessage?.role,
      lastMessageId: lastMessage?.id,
      // Capture stack trace to see what triggered this call
      stack: new Error().stack?.split('\n').slice(1, 6).join(' | '),
    });

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

      // Create Anthropic provider via AI Gateway
      // If CF_AIG_TOKEN is set, the gateway has Authenticated Gateway enabled
      const headers: Record<string, string> = {};
      if (this.env.CF_AIG_TOKEN) {
        headers['cf-aig-authorization'] = `Bearer ${this.env.CF_AIG_TOKEN}`;
      }

      const anthropic = createAnthropic({
        apiKey: this.env.ANTHROPIC_API_KEY,
        baseURL: `https://gateway.ai.cloudflare.com/v1/${this.env.CF_ACCOUNT_ID}/${this.env.CF_GATEWAY_ID}/anthropic`,
        headers,
      });

      this.setStatus('thinking', 'Generating response...');

      // Create tool context for tool execution
      const toolContext = {
        name: this.name,
        state: this.state,
        setState: (s: AgentState) => this.setState(s),
        getCanvasStub: (id: string) => this.getCanvasStub(id),
        env: this.env,
        broadcastCanvasUpdate: () => this.broadcastCanvasUpdate(),
      };

      // Create tools with context
      const tools = createTools(toolContext);

      const messageTimer = metrics.startTimer('message_sent', { sessionId });

      // Convert UIMessages to ModelMessages using SDK's proper conversion
      // This preserves tool calls, tool results, and all message structure
      const modelMessages = await convertToModelMessages(this.messages, {
        tools,
        ignoreIncompleteToolCalls: true, // Handle in-progress tool calls gracefully
      });

      logger.info('Starting single-stream response with tools', {
        count: modelMessages.length,
        roles: modelMessages.map(m => m.role),
      });

      // Single streamText with tools - SDK handles tool loops automatically
      const result = streamText({
        model: anthropic('claude-sonnet-4-20250514'),
        maxOutputTokens: 4096,
        system: systemPrompt,
        messages: modelMessages,
        tools,
        stopWhen: stepCountIs(5),
        onStepFinish: async (stepResult) => {
          // Track tool executions and broadcast canvas updates
          if (stepResult.toolResults && stepResult.toolResults.length > 0) {
            for (const toolResult of stepResult.toolResults) {
              metrics.trackEvent('tool_executed', {
                sessionId,
                toolName: toolResult.toolName,
                success: !('error' in toolResult),
              });
            }
            await this.broadcastCanvasUpdate();
          }
        },
        onFinish: async (event) => {
          messageTimer();
          logger.info('Stream finished', {
            invocationId,
            finishReason: event.finishReason,
            usage: event.usage,
          });
          this.setStatus('idle', '');
          await onFinish(event);
        },
      });

      return result.toUIMessageStreamResponse();
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
