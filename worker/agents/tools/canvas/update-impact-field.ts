/**
 * Update Impact Field Tool
 *
 * Updates an Impact Model field in the causality chain.
 */

import { z } from 'zod';
import type { ToolDefinition } from '../types';

export const updateImpactFieldSchema = z.object({
  field: z.enum(
    [
      'issue',
      'participants',
      'activities',
      'outputs',
      'shortTermOutcomes',
      'mediumTermOutcomes',
      'longTermOutcomes',
      'impact',
    ],
    { description: 'Which impact model field to update' }
  ),
  content: z.string().min(1, 'Content is required'),
});

export const updateImpactFieldTool: ToolDefinition<typeof updateImpactFieldSchema> = {
  name: 'update_impact_field',
  description:
    'Update an Impact Model field in the causality chain. The chain flows: issue -> participants -> activities -> outputs -> shortTermOutcomes -> mediumTermOutcomes -> longTermOutcomes -> impact.',
  schema: updateImpactFieldSchema,
  modifiesCanvas: true,
  execute: async (ctx, input) => {
    ctx.setStatus('updating', `Updating impact ${input.field}...`);
    return await ctx.canvasStub.updateImpactField(input.field, input.content);
  },
};
