/**
 * Search Examples Tool
 *
 * Search venture examples with Selection Matrix dimension filters.
 */

import { z } from 'zod';
import type { ToolDefinition } from '../types';
import { searchForTools } from '../../../retrieval/vector-search';

export const searchExamplesSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  filters: z
    .object({
      stage: z
        .enum(['idea', 'validation', 'growth', 'scale'])
        .optional()
        .describe('Venture development stage'),
      impactArea: z.string().optional().describe('Primary impact area (e.g., health, education, environment)'),
      mechanism: z
        .enum(['product', 'service', 'platform', 'hybrid'])
        .optional()
        .describe('How impact is delivered'),
      legalStructure: z
        .enum(['nonprofit', 'forprofit', 'hybrid', 'cooperative'])
        .optional()
        .describe('Legal/organizational structure'),
      revenueSource: z
        .enum(['earned', 'grants', 'donations', 'mixed'])
        .optional()
        .describe('Primary revenue source'),
      fundingSource: z
        .enum(['bootstrapped', 'angel', 'vc', 'grants', 'crowdfunding'])
        .optional()
        .describe('Primary funding source'),
      industry: z.string().optional().describe('Industry vertical'),
    })
    .optional()
    .describe('Selection Matrix dimension filters'),
  limit: z.number().min(1).max(10).optional(),
});

export const searchExamplesTool: ToolDefinition<typeof searchExamplesSchema> = {
  name: 'search_examples',
  description:
    'Search venture examples from the knowledge base. Use Selection Matrix dimensions to filter for relevant examples matching the current venture profile.',
  schema: searchExamplesSchema,
  modifiesCanvas: false,
  execute: async (ctx, input) => {
    ctx.setStatus('searching', 'Searching examples...');
    return await searchForTools(
      ctx.env,
      {
        query: input.query,
        contentType: 'example',
        filters: input.filters,
        limit: input.limit ?? 3,
      },
      ctx.canvasId
    );
  },
};
