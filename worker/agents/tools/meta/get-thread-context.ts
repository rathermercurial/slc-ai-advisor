/**
 * Get Thread Context Tool
 *
 * Enables cross-thread context sharing within the same canvas.
 * Can retrieve summaries of sibling threads or fetch recent messages
 * from a specific sibling thread.
 */

import { z } from 'zod';
import type { ToolDefinition } from '../types';
import type { SLCAgent } from '../../SLCAgent';

export const getThreadContextSchema = z.object({
  mode: z
    .enum(['summaries', 'messages'])
    .describe(
      'Mode: "summaries" returns all sibling thread summaries, "messages" fetches recent messages from a specific thread'
    ),
  threadId: z
    .string()
    .uuid()
    .optional()
    .describe('Required when mode is "messages": The ID of the sibling thread to fetch messages from'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .describe('Maximum number of messages to return (only for "messages" mode, default: 10)'),
});

export const getThreadContextTool: ToolDefinition<typeof getThreadContextSchema> = {
  name: 'get_thread_context',
  description: `Get context from sibling threads within the same canvas.

Use this tool when:
- You need to reference previous discussions the user had in other threads
- The user mentions something discussed "earlier" or "before" that isn't in this thread
- You want to understand the full context of the user's venture exploration

Modes:
- "summaries": Get summaries of all sibling threads (quick overview)
- "messages": Fetch recent messages from a specific thread (detailed context)

Note: Only works for threads belonging to the same canvas (same user/venture).`,
  schema: getThreadContextSchema,
  modifiesCanvas: false,
  execute: async (ctx, input) => {
    ctx.setStatus('searching', 'Getting thread context...');

    if (input.mode === 'summaries') {
      // Get all thread summaries from this canvas
      const summaries = await ctx.canvasStub.getThreadSummaries();
      return {
        mode: 'summaries',
        threadCount: summaries.length,
        threads: summaries.map((t) => ({
          id: t.id,
          title: t.title || 'Untitled',
          summary: t.summary || 'No summary available',
        })),
      };
    }

    // Mode is 'messages' - fetch from sibling thread
    if (!input.threadId) {
      return {
        error: 'threadId is required when mode is "messages"',
      };
    }

    // Verify the thread belongs to this canvas
    const thread = await ctx.canvasStub.getThread(input.threadId);
    if (!thread) {
      return {
        error: 'Thread not found or does not belong to this canvas',
      };
    }

    if (thread.archived) {
      return {
        error: 'Thread is archived',
      };
    }

    // Get the sibling agent's messages via RPC
    // Each thread has its own SLCAgent DO instance
    try {
      const siblingAgentId = ctx.env.SLC_AGENT.idFromName(input.threadId);
      const siblingAgent = ctx.env.SLC_AGENT.get(siblingAgentId) as DurableObjectStub<SLCAgent>;

      // Call the getRecentMessages RPC method on the sibling agent
      const messages = await siblingAgent.getRecentMessages(input.limit || 10);

      return {
        mode: 'messages',
        threadId: input.threadId,
        threadTitle: thread.title || 'Untitled',
        messages,
      };
    } catch (error) {
      ctx.logger.error('Failed to fetch sibling thread messages', error);
      return {
        error: 'Failed to access sibling thread',
      };
    }
  },
};
