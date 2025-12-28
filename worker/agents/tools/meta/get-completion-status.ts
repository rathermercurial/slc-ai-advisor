/**
 * Get Completion Status Tool
 *
 * Returns the current canvas completion status with progress details.
 */

import { z } from 'zod';
import type { ToolDefinition } from '../types';

export const getCompletionStatusSchema = z.object({});

export const getCompletionStatusTool: ToolDefinition<typeof getCompletionStatusSchema> = {
  name: 'get_completion_status',
  description:
    'Get the current canvas completion status including percentage, completed sections, incomplete sections, and suggested next section to work on.',
  schema: getCompletionStatusSchema,
  modifiesCanvas: false,
  execute: async (ctx) => {
    ctx.setStatus('searching', 'Getting completion status...');
    const completion = await ctx.canvasStub.getOverallCompletion();

    // Transform to the expected output format per issue #64
    return {
      completionPercentage: completion.percentage,
      completedSections: completion.completedSections,
      incompleteSections: completion.missingSections,
      impactModelComplete: completion.completedSections.includes('impact'),
      suggestedNextSection: completion.missingSections[0] || null,
    };
  },
};
