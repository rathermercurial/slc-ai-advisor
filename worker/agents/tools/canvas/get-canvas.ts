/**
 * Get Canvas Tool
 *
 * Retrieves the current canvas state.
 */

import { z } from 'zod';
import type { ToolDefinition } from '../types';

export const getCanvasSchema = z.object({});

export const getCanvasTool: ToolDefinition<typeof getCanvasSchema> = {
  name: 'get_canvas',
  description:
    'Get the current canvas state to understand what has been filled in and what is missing.',
  schema: getCanvasSchema,
  modifiesCanvas: false,
  execute: async (ctx) => {
    ctx.setStatus('searching', 'Loading canvas...');
    return await ctx.canvasStub.getFullCanvas();
  },
};
