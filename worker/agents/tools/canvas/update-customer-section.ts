/**
 * Update Customer Section Tool
 *
 * Updates a Customer Model section: customers, jobsToBeDone, valueProposition, or solution.
 */

import { z } from 'zod';
import type { ToolDefinition } from '../types';

export const updateCustomerSectionSchema = z.object({
  section: z.enum(['customers', 'jobsToBeDone', 'valueProposition', 'solution'], {
    description: 'Which customer model section to update',
  }),
  content: z.string().min(1, 'Content is required'),
});

export const updateCustomerSectionTool: ToolDefinition<typeof updateCustomerSectionSchema> = {
  name: 'update_customer_section',
  description:
    'Update a Customer Model section: customers (who you serve), jobsToBeDone (their problems), valueProposition (your unique solution), or solution (your product/service).',
  schema: updateCustomerSectionSchema,
  modifiesCanvas: true,
  execute: async (ctx, input) => {
    ctx.setStatus('updating', `Updating ${input.section}...`);
    return await ctx.canvasStub.updateSection(input.section, input.content);
  },
};
