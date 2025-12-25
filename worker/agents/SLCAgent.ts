/**
 * SLC Agent - AI Conversation Orchestrator
 *
 * Extends AIChatAgent to handle AI conversations with tool execution.
 * Manages its own conversation history in SQLite, references CanvasDO for canvas state.
 *
 * Phase 0: Skeleton implementation with stub onChatMessage()
 * Phase 1: Will implement streaming, tools, and AI Gateway integration
 */

import { AIChatAgent } from 'agents/ai-chat-agent';
import type { Message } from 'agents/ai-chat-agent';
import type { CanvasDO } from '../durable-objects/CanvasDO';

/**
 * Agent state that syncs to connected clients
 */
export interface AgentState {
  /** Current agent status for UI display */
  status: 'idle' | 'thinking' | 'searching' | 'updating' | 'error';

  /** Human-readable status message */
  statusMessage: string;

  /** ID of the canvas this agent is working with */
  currentCanvasId: string | null;

  /** Unique conversation ID */
  conversationId: string;
}

/**
 * SLC Agent implementation
 */
export class SLCAgent extends AIChatAgent<Env, AgentState> {
  /**
   * Initial state for new agent instances
   */
  initialState: AgentState = {
    status: 'idle',
    statusMessage: '',
    currentCanvasId: null,
    conversationId: crypto.randomUUID(),
  };

  private schemaInitialized = false;

  /**
   * Ensure conversation and message tables exist
   */
  async ensureSchema(): Promise<void> {
    if (this.schemaInitialized) return;

    const sql = this.ctx.storage.sql;

    // Conversation table
    sql.exec(`
      CREATE TABLE IF NOT EXISTS conversation (
        id TEXT PRIMARY KEY,
        canvas_id TEXT,
        title TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Message table
    sql.exec(`
      CREATE TABLE IF NOT EXISTS message (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);

    // Index for efficient message retrieval
    sql.exec(`
      CREATE INDEX IF NOT EXISTS idx_message_conversation
      ON message(conversation_id, timestamp)
    `);

    this.schemaInitialized = true;
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
   * Set the current canvas for this agent
   */
  async setCanvas(canvasId: string): Promise<void> {
    await this.ensureSchema();

    const state = this.getState();
    this.setState({
      ...state,
      currentCanvasId: canvasId,
    });

    // Create or update conversation record
    const sql = this.ctx.storage.sql;
    const now = new Date().toISOString();

    sql.exec(
      `INSERT OR REPLACE INTO conversation (id, canvas_id, created_at, updated_at)
       VALUES (?, ?, ?, ?)`,
      state.conversationId,
      canvasId,
      now,
      now
    );
  }

  /**
   * Store a message in the agent's database
   */
  async storeMessage(role: 'user' | 'assistant', content: string): Promise<void> {
    await this.ensureSchema();

    const sql = this.ctx.storage.sql;
    const state = this.getState();
    const now = new Date().toISOString();

    sql.exec(
      `INSERT INTO message (id, conversation_id, role, content, timestamp)
       VALUES (?, ?, ?, ?, ?)`,
      crypto.randomUUID(),
      state.conversationId,
      role,
      content,
      now
    );
  }

  /**
   * Get recent messages from the conversation
   */
  async getRecentMessages(limit = 50): Promise<Array<{ role: string; content: string }>> {
    await this.ensureSchema();

    const sql = this.ctx.storage.sql;
    const state = this.getState();

    const rows = sql
      .exec<{ role: string; content: string }>(
        `SELECT role, content FROM message
         WHERE conversation_id = ?
         ORDER BY timestamp DESC
         LIMIT ?`,
        state.conversationId,
        limit
      )
      .toArray();

    // Return in chronological order
    return rows.reverse();
  }

  /**
   * Update agent status (syncs to connected clients)
   */
  setStatus(status: AgentState['status'], message = ''): void {
    const state = this.getState();
    this.setState({
      ...state,
      status,
      statusMessage: message,
    });
  }

  /**
   * Handle incoming chat message
   *
   * STUB: Phase 1 will implement:
   * - Get canvas context from CanvasDO
   * - Build system prompt with canvas state
   * - Stream response via AI Gateway
   * - Execute tool calls (update canvas, search KB)
   * - Store messages
   */
  async onChatMessage(
    onFinish: (response: Message) => void
  ): Promise<Response | undefined> {
    await this.ensureSchema();

    // Update status
    this.setStatus('thinking', 'Processing your message...');

    try {
      // Phase 1 will implement actual AI chat
      // For now, return a stub response
      const stubMessage: Message = {
        role: 'assistant',
        content:
          'SLCAgent is under construction. Phase 1 will enable streaming chat with canvas tools and knowledge base search.',
      };

      // Store the response
      await this.storeMessage('assistant', stubMessage.content);

      // Reset status
      this.setStatus('idle');

      // Finish with the response
      onFinish(stubMessage);

      return undefined; // Let SDK handle response serialization
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.setStatus('error', errorMessage);

      onFinish({
        role: 'assistant',
        content: `I encountered an error: ${errorMessage}. Please try again.`,
      });

      return undefined;
    }
  }
}
