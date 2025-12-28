/**
 * Get Venture Profile Tool
 *
 * Returns the current venture dimension profile from the canvas.
 */

import { z } from 'zod';
import type { ToolDefinition } from '../types';

export const getVentureProfileSchema = z.object({});

export const getVentureProfileTool: ToolDefinition<typeof getVentureProfileSchema> = {
  name: 'get_venture_profile',
  description:
    'Get the current venture dimension profile from the canvas. Returns inferred Selection Matrix dimensions based on canvas content.',
  schema: getVentureProfileSchema,
  modifiesCanvas: false,
  execute: async (ctx) => {
    ctx.setStatus('searching', 'Getting venture profile...');
    return await ctx.canvasStub.getVentureProfile();
  },
};
