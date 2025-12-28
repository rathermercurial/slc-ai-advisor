/**
 * Update Economic Section Tool
 *
 * Updates an Economic Model section: channels, revenue, costs, or advantage.
 */

import { z } from 'zod';
import type { ToolDefinition } from '../types';

export const updateEconomicSectionSchema = z.object({
  section: z.enum(['channels', 'revenue', 'costs', 'advantage'], {
    description: 'Which economic model section to update',
  }),
  content: z.string().min(1, 'Content is required'),
});

export const updateEconomicSectionTool: ToolDefinition<typeof updateEconomicSectionSchema> = {
  name: 'update_economic_section',
  description:
    'Update an Economic Model section: channels (how you reach customers), revenue (how you make money), costs (major expenses), or advantage (competitive moat).',
  schema: updateEconomicSectionSchema,
  modifiesCanvas: true,
  execute: async (ctx, input) => {
    ctx.setStatus('updating', `Updating ${input.section}...`);
    return await ctx.canvasStub.updateSection(input.section, input.content);
  },
};
