/**
 * ChatAgent - AI Chat Agent for SLC Advisor
 *
 * Extends AIChatAgent from Cloudflare Agents SDK to provide:
 * - WebSocket-based real-time chat
 * - RAG retrieval from Vectorize knowledge base
 * - Claude via AI Gateway
 * - Built-in message persistence via SQLite
 */

import { AIChatAgent } from 'agents';
import type { StreamTextOnFinishCallback } from 'agents';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import type { ToolSet } from 'ai';
import {
  searchKnowledgeBase,
  buildRAGContext,
  parseQueryIntent,
} from '../retrieval/vector-search';
import { buildSystemPrompt } from '../llm/prompts';

/**
 * Chat Agent for the SLC AI Advisor
 *
 * Handles chat messages with RAG-enhanced responses from Claude.
 */
export class ChatAgent extends AIChatAgent<Env> {
  /**
   * Handle incoming chat messages
   *
   * This method is called by the Agents SDK when a new message arrives.
   * It performs RAG retrieval and streams a response from Claude.
   */
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    options?: { abortSignal?: AbortSignal }
  ) {
    // Get Anthropic client, optionally through AI Gateway
    const anthropic = createAnthropic({
      apiKey: this.env.ANTHROPIC_API_KEY,
      baseURL:
        this.env.CF_ACCOUNT_ID && this.env.CF_GATEWAY_ID
          ? `https://gateway.ai.cloudflare.com/v1/${this.env.CF_ACCOUNT_ID}/${this.env.CF_GATEWAY_ID}/anthropic`
          : undefined,
    });

    // Get the last user message for RAG query
    const lastMessage = this.messages.findLast((m) => m.role === 'user');
    const query =
      typeof lastMessage?.content === 'string'
        ? lastMessage.content
        : lastMessage?.content?.toString() || '';

    // Parse query intent for better retrieval
    const intent = parseQueryIntent(query);

    // Search knowledge base with Selection Matrix filtering
    // TODO: Get program and dimensions from session state
    const documents = await searchKnowledgeBase(
      this.env,
      query,
      'generic', // Default program
      {}, // No dimension filtering for now
      {
        canvasSection: intent.targetSection || null,
        model: intent.targetModel || null,
      }
    );

    // Build RAG context from retrieved documents
    const ragContext = buildRAGContext(documents);

    // Build system prompt with RAG context
    const systemPrompt = buildSystemPrompt(ragContext);

    // Stream response from Claude
    return streamText({
      model: anthropic('claude-sonnet-4-5-20250514'),
      system: systemPrompt,
      messages: this.messages,
      maxSteps: 5,
      abortSignal: options?.abortSignal,
      onFinish,
    });
  }
}
