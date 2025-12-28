/**
 * Update Key Metrics Tool
 *
 * Updates the Key Metrics section of the canvas.
 */

import { z } from 'zod';
import type { ToolDefinition } from '../types';

export const updateKeyMetricsSchema = z.object({
  content: z.string().min(1, 'Key metrics content is required'),
});

export const updateKeyMetricsTool: ToolDefinition<typeof updateKeyMetricsSchema> = {
  name: 'update_key_metrics',
  description:
    'Update the Key Metrics section. This should be completed last, after other sections are filled in.',
  schema: updateKeyMetricsSchema,
  modifiesCanvas: true,
  execute: async (ctx, input) => {
    ctx.setStatus('updating', 'Updating key metrics...');
    return await ctx.canvasStub.updateSection('keyMetrics', input.content);
  },
};
