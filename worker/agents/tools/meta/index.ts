/**
 * Meta Tools
 *
 * Tools for querying canvas metadata, status, and cross-thread context.
 */

import { getVentureProfileTool } from './get-venture-profile';
import { getCompletionStatusTool } from './get-completion-status';
import { getThreadContextTool } from './get-thread-context';
import type { ToolDefinition } from '../types';

export const metaTools: ToolDefinition[] = [
  getVentureProfileTool,
  getCompletionStatusTool,
  getThreadContextTool,
];

export { getVentureProfileTool, getCompletionStatusTool, getThreadContextTool };
