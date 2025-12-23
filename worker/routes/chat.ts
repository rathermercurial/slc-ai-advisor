/**
 * Chat Handler with RAG
 *
 * Implements the chat endpoint with:
 * 1. Session retrieval from Durable Object
 * 2. Query intent parsing
 * 3. Vectorize search with Selection Matrix filters
 * 4. Claude call via AI Gateway
 * 5. Message storage
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  searchKnowledgeBase,
  parseQueryIntent,
  buildRAGContext,
  type RetrievedDocument,
} from '../retrieval/vector-search';
import { buildSystemPrompt } from '../llm/prompts';
import type { VentureDimensions } from '../../src/types/venture';
import type { ConversationMessage } from '../../src/types/message';

/**
 * Chat request body
 */
interface ChatRequest {
  sessionId: string;
  message: string;
}

/**
 * Chat response
 */
interface ChatResponse {
  response: string;
  sources?: Array<{
    title: string;
    type: string;
  }>;
}

/**
 * Handle chat request
 */
export async function handleChat(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    // Parse request
    const body = await request.json() as ChatRequest;
    const { sessionId, message } = body;

    if (!sessionId || !message) {
      return jsonResponse({ error: 'sessionId and message are required' }, 400);
    }

    // Get Durable Object stub
    const stub = env.USER_SESSION.get(
      env.USER_SESSION.idFromName(sessionId)
    );

    // Get session data
    const sessionResponse = await stub.fetch(new Request('http://internal/session'));
    const session = await sessionResponse.json() as { id: string; program: string } | null;

    if (!session?.id) {
      return jsonResponse({ error: 'Session not found' }, 404);
    }

    // Get venture dimensions for filtering
    const dimensionsResponse = await stub.fetch(
      new Request('http://internal/dimensions-for-filtering')
    );
    const dimensions = await dimensionsResponse.json() as Partial<VentureDimensions>;

    // Get recent messages for context
    const messagesResponse = await stub.fetch(
      new Request('http://internal/messages?limit=10')
    );
    const recentMessages = await messagesResponse.json() as ConversationMessage[];

    // Parse query intent
    const intent = parseQueryIntent(message);

    // Search knowledge base with Selection Matrix
    const documents = await searchKnowledgeBase(
      env,
      message,
      session.program,
      dimensions,
      intent
    );

    // Build RAG context
    const ragContext = buildRAGContext(documents);

    // Build system prompt
    const systemPrompt = buildSystemPrompt(ragContext);

    // Call Claude via AI Gateway
    const response = await callClaude(
      env,
      systemPrompt,
      recentMessages,
      message
    );

    // Store messages in session
    await stub.fetch(new Request('http://internal/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'user', content: message }),
    }));

    await stub.fetch(new Request('http://internal/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'assistant', content: response }),
    }));

    // Build response with sources
    const chatResponse: ChatResponse = {
      response,
    };

    if (documents.length > 0) {
      chatResponse.sources = documents.map((doc) => ({
        title: doc.metadata.title || 'Unknown',
        type: doc.metadata.content_type || 'unknown',
      }));
    }

    return jsonResponse(chatResponse);
  } catch (error) {
    console.error('Chat handler error:', error);
    return jsonResponse({ error: 'Failed to process chat' }, 500);
  }
}

/**
 * Call Claude via AI Gateway
 */
async function callClaude(
  env: Env,
  systemPrompt: string,
  recentMessages: ConversationMessage[],
  currentMessage: string
): Promise<string> {
  // Check for required environment variables
  if (!env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set');
    return 'I apologize, but I\'m currently unable to respond. Please check the API configuration.';
  }

  // Build base URL for AI Gateway (optional)
  let baseURL: string | undefined;
  if (env.CF_ACCOUNT_ID && env.CF_GATEWAY_ID) {
    baseURL = `https://gateway.ai.cloudflare.com/v1/${env.CF_ACCOUNT_ID}/${env.CF_GATEWAY_ID}/anthropic`;
  }

  try {
    const client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
      ...(baseURL && { baseURL }),
    });

    // Build messages array
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // Add recent conversation history
    for (const msg of recentMessages) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: currentMessage,
    });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    // Extract text from response
    const textBlock = response.content.find((block) => block.type === 'text');
    if (textBlock && textBlock.type === 'text') {
      return textBlock.text;
    }

    return 'I apologize, but I was unable to generate a response.';
  } catch (error) {
    console.error('Claude API error:', error);

    // Provide fallback response
    return `I apologize, but I'm having trouble connecting to my knowledge base right now.

Here's what I can tell you about the Social Lean Canvas in general:

The Social Lean Canvas has 11 sections organized into 3 models:
- **Customer Model**: customers, jobs to be done, value proposition, solution
- **Economic Model**: channels, revenue, costs, advantage
- **Impact Model**: the 8-field causality chain from issue to impact

Please try again in a moment, or let me know if you have a specific methodology question I can help with.`;
  }
}

/**
 * Helper for JSON responses
 */
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
