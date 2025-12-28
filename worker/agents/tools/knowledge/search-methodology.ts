/**
 * Search Methodology Tool
 *
 * Search the Social Lean Canvas methodology documentation.
 */

import { z } from 'zod';
import type { ToolDefinition } from '../types';
import { searchForTools } from '../../../retrieval/vector-search';

export const searchMethodologySchema = z.object({
  query: z.string().min(1, 'Query is required'),
  limit: z.number().min(1).max(10).optional(),
});

export const searchMethodologyTool: ToolDefinition<typeof searchMethodologySchema> = {
  name: 'search_methodology',
  description:
    'Search the Social Lean Canvas methodology documentation. Use this to find guidance on how to fill canvas sections, best practices, and conceptual explanations.',
  schema: searchMethodologySchema,
  modifiesCanvas: false,
  execute: async (ctx, input) => {
    ctx.setStatus('searching', 'Searching methodology...');
    return await searchForTools(
      ctx.env,
      {
        query: input.query,
        contentType: 'methodology',
        limit: input.limit ?? 5,
      },
      ctx.canvasId
    );
  },
};
