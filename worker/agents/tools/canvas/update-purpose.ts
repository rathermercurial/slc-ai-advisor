/**
 * Update Purpose Tool
 *
 * Updates the Purpose section of the canvas.
 */

import { z } from 'zod';
import type { ToolDefinition } from '../types';

export const updatePurposeSchema = z.object({
  content: z.string().min(1, 'Purpose content is required'),
});

export const updatePurposeTool: ToolDefinition<typeof updatePurposeSchema> = {
  name: 'update_purpose',
  description:
    'Update the Purpose section of the canvas. Purpose should explain why the venture exists and what problem it solves.',
  schema: updatePurposeSchema,
  modifiesCanvas: true,
  execute: async (ctx, input) => {
    ctx.setStatus('updating', 'Updating purpose...');
    return await ctx.canvasStub.updateSection('purpose', input.content);
  },
};
