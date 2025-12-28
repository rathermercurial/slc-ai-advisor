/**
 * Meta Tools
 *
 * Tools for querying canvas metadata and status.
 */

import { getVentureProfileTool } from './get-venture-profile';
import { getCompletionStatusTool } from './get-completion-status';
import type { ToolDefinition } from '../types';

export const metaTools: ToolDefinition[] = [getVentureProfileTool, getCompletionStatusTool];

export { getVentureProfileTool, getCompletionStatusTool };
