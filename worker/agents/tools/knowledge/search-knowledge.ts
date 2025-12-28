/**
 * Search Knowledge Base Tool
 *
 * General semantic search across the entire knowledge base.
 */

import { z } from 'zod';
import type { ToolDefinition } from '../types';
import { searchForTools } from '../../../retrieval/vector-search';

export const searchKnowledgeSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  contentType: z
    .enum(['methodology', 'example', 'reference', 'all'])
    .optional()
    .describe('Filter by content type (default: all)'),
  limit: z.number().min(1).max(20).optional(),
});

export const searchKnowledgeTool: ToolDefinition<typeof searchKnowledgeSchema> = {
  name: 'search_knowledge_base',
  description:
    'General semantic search across the entire knowledge base including methodology docs, examples, and reference materials.',
  schema: searchKnowledgeSchema,
  modifiesCanvas: false,
  execute: async (ctx, input) => {
    ctx.setStatus('searching', 'Searching knowledge base...');
    // 'all' or undefined → no filter (search everything)
    const contentType = input.contentType === 'all' ? undefined : input.contentType;
    return await searchForTools(
      ctx.env,
      {
        query: input.query,
        contentType,
        limit: input.limit ?? 5,
      },
      ctx.canvasId
    );
  },
};
