/**
 * Chat Handler with RAG and Canvas Editing
 *
 * Implements the chat endpoint with:
 * 1. Session retrieval from Durable Object
 * 2. Query intent parsing
 * 3. Vectorize search with Selection Matrix filters
 * 4. Claude call with tools for canvas editing
 * 5. Tool execution for canvas updates
 * 6. Message storage
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  searchKnowledgeBase,
  parseQueryIntent,
  buildRAGContext,
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
 * Canvas update that was made
 */
interface CanvasUpdate {
  section: string;
  content: string;
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
  canvasUpdates?: CanvasUpdate[];
}

/**
 * Tool definitions for canvas editing
 */
const CANVAS_TOOLS: Anthropic.Tool[] = [
  {
    name: 'update_canvas_section',
    description: `Update a section of the user's Social Lean Canvas. Use this when the user asks you to update, set, change, or save content to their canvas. Always confirm with the user what content they want before updating.

Available sections:
- purpose: Why the venture exists
- customers: Who the venture serves
- jobsToBeDone: Problems/tasks customers need to accomplish
- valueProposition: Why customers choose this solution
- solution: What the venture provides
- channels: How customers are reached
- revenue: How income is generated
- costs: Major ongoing expenses
- keyMetrics: How success is measured
- advantage: What can't be easily copied
- impact: The social/environmental impact summary`,
    input_schema: {
      type: 'object' as const,
      properties: {
        section: {
          type: 'string',
          enum: [
            'purpose',
            'customers',
            'jobsToBeDone',
            'valueProposition',
            'solution',
            'channels',
            'revenue',
            'costs',
            'keyMetrics',
            'advantage',
            'impact',
          ],
          description: 'The canvas section to update',
        },
        content: {
          type: 'string',
          description: 'The new content for the section',
        },
      },
      required: ['section', 'content'],
    },
  },
];

/**
 * Handle chat request
 */
export async function handleChat(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    // Parse request
    const body = (await request.json()) as ChatRequest;
    const { sessionId, message } = body;

    if (!sessionId || !message) {
      return jsonResponse({ error: 'sessionId and message are required' }, 400);
    }

    // Get Durable Object stub
    const stub = env.USER_SESSION.get(env.USER_SESSION.idFromName(sessionId));

    // Get session data
    const sessionResponse = await stub.fetch(
      new Request('http://internal/session')
    );
    const session = (await sessionResponse.json()) as {
      id: string;
      program: string;
    } | null;

    if (!session?.id) {
      return jsonResponse({ error: 'Session not found' }, 404);
    }

    // Get venture dimensions for filtering
    const dimensionsResponse = await stub.fetch(
      new Request('http://internal/dimensions-for-filtering')
    );
    const dimensions =
      (await dimensionsResponse.json()) as Partial<VentureDimensions>;

    // Get recent messages for context
    const messagesResponse = await stub.fetch(
      new Request('http://internal/messages?limit=10')
    );
    const recentMessages =
      (await messagesResponse.json()) as ConversationMessage[];

    // Get canvas state so Claude knows what user has written
    const [canvasSectionsRes, impactModelRes] = await Promise.all([
      stub.fetch(new Request('http://internal/canvas-sections')),
      stub.fetch(new Request('http://internal/model/impact')),
    ]);
    const canvasSections = (await canvasSectionsRes.json()) as Array<{
      sectionKey: string;
      content: string;
    }>;
    const impactModel =
      (await impactModelRes.json()) as Record<string, string> | null;

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

    // Build canvas context for system prompt
    const canvasContext = buildCanvasContext(canvasSections, impactModel);

    // Build system prompt with RAG and canvas context
    const systemPrompt = buildSystemPrompt(ragContext, canvasContext);

    // Call Claude with tools
    const { response, canvasUpdates } = await callClaudeWithTools(
      env,
      stub,
      systemPrompt,
      recentMessages,
      message
    );

    // Store messages in session
    await stub.fetch(
      new Request('http://internal/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: message }),
      })
    );

    await stub.fetch(
      new Request('http://internal/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'assistant', content: response }),
      })
    );

    // Build response with sources and canvas updates
    const chatResponse: ChatResponse = {
      response,
    };

    if (documents.length > 0) {
      chatResponse.sources = documents.map((doc) => ({
        title: doc.metadata.title || 'Unknown',
        type: doc.metadata.content_type || 'unknown',
      }));
    }

    if (canvasUpdates.length > 0) {
      chatResponse.canvasUpdates = canvasUpdates;
    }

    return jsonResponse(chatResponse);
  } catch (error) {
    console.error('Chat handler error:', error);
    return jsonResponse({ error: 'Failed to process chat' }, 500);
  }
}

/**
 * Call Claude with tools for canvas editing
 */
async function callClaudeWithTools(
  env: Env,
  stub: DurableObjectStub,
  systemPrompt: string,
  recentMessages: ConversationMessage[],
  currentMessage: string
): Promise<{ response: string; canvasUpdates: CanvasUpdate[] }> {
  const canvasUpdates: CanvasUpdate[] = [];

  // Check for required environment variables
  if (!env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set');
    return {
      response:
        "I apologize, but I'm currently unable to respond. Please check the API configuration.",
      canvasUpdates: [],
    };
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
    const messages: Anthropic.MessageParam[] = [];

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

    // First API call with tools
    let response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      tools: CANVAS_TOOLS,
    });

    // Process tool calls in a loop (with safety limit to prevent infinite loops)
    const MAX_TOOL_ITERATIONS = 10;
    let toolIterations = 0;

    while (response.stop_reason === 'tool_use' && toolIterations < MAX_TOOL_ITERATIONS) {
      toolIterations++;
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        if (toolUse.name === 'update_canvas_section') {
          const input = toolUse.input as { section: string; content: string };

          // Execute the canvas update
          try {
            const updateResponse = await stub.fetch(
              new Request(`http://internal/canvas-section/${input.section}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: input.content }),
              })
            );

            if (!updateResponse.ok) {
              const errorText = await updateResponse.text();
              throw new Error(`HTTP ${updateResponse.status}: ${errorText}`);
            }

            canvasUpdates.push({
              section: input.section,
              content: input.content,
            });

            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: `Successfully updated the ${input.section} section with: "${input.content}"`,
            });
          } catch (err) {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: `Failed to update ${input.section}: ${err}`,
              is_error: true,
            });
          }
        }
      }

      // Continue the conversation with tool results
      messages.push({
        role: 'assistant',
        content: response.content,
      });

      messages.push({
        role: 'user',
        content: toolResults,
      });

      // Get Claude's follow-up response
      response = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
        tools: CANVAS_TOOLS,
      });
    }

    // Warn if we hit the iteration limit
    if (toolIterations >= MAX_TOOL_ITERATIONS) {
      console.warn(`Tool loop hit max iterations (${MAX_TOOL_ITERATIONS})`);
    }

    // Extract final text response
    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    const finalText =
      textBlocks.map((b) => b.text).join('\n') ||
      'I apologize, but I was unable to generate a response.';

    return { response: finalText, canvasUpdates };
  } catch (error) {
    console.error('Claude API error:', error);

    return {
      response: `I apologize, but I'm having trouble connecting right now.

Here's what I can tell you about the Social Lean Canvas in general:

The Social Lean Canvas has 11 sections organized into 3 models:
- **Customer Model**: customers, jobs to be done, value proposition, solution
- **Economic Model**: channels, revenue, costs, advantage
- **Impact Model**: the 8-field causality chain from issue to impact

Please try again in a moment, or let me know if you have a specific methodology question I can help with.`,
      canvasUpdates: [],
    };
  }
}

/**
 * Build canvas context string for system prompt
 */
function buildCanvasContext(
  sections: Array<{ sectionKey: string; content: string }>,
  impactModel: Record<string, string> | null
): string {
  const filledSections = sections.filter((s) => s.content && s.content.trim());

  if (filledSections.length === 0 && !impactModel) {
    return '';
  }

  const lines: string[] = [];

  // Add filled sections
  for (const section of filledSections) {
    const label = section.sectionKey
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase());
    lines.push(`**${label}**: ${section.content}`);
  }

  // Add impact model fields if they have content
  if (impactModel) {
    const impactFields = [
      ['issue', 'Issue'],
      ['participants', 'Participants'],
      ['activities', 'Activities'],
      ['outputs', 'Outputs'],
      ['shortTermOutcomes', 'Short-term Outcomes'],
      ['mediumTermOutcomes', 'Medium-term Outcomes'],
      ['longTermOutcomes', 'Long-term Outcomes'],
      ['impact', 'Impact'],
    ];

    for (const [key, label] of impactFields) {
      if (impactModel[key] && impactModel[key].trim()) {
        lines.push(`**${label}**: ${impactModel[key]}`);
      }
    }
  }

  return lines.join('\n');
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
