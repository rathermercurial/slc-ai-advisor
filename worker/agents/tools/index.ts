/**
 * Tool System Entry Point
 *
 * Aggregates all tools and exports them in both modular and Anthropic formats.
 */

import { toAnthropicTool, type ToolDefinition, type ExecutorContext } from './types';
import { executeTool, executeToolWithBroadcast } from './executor';
import { canvasTools } from './canvas';
import { knowledgeTools } from './knowledge';
import { metaTools } from './meta';

/**
 * All available tools
 */
export const ALL_TOOLS: ToolDefinition[] = [...canvasTools, ...knowledgeTools, ...metaTools];

/**
 * Tools in Anthropic API format
 * Used directly in API calls to Claude
 */
export const ANTHROPIC_TOOLS = ALL_TOOLS.map(toAnthropicTool);

// Re-export executor functions
export { executeTool, executeToolWithBroadcast };

// Re-export types
export type { ToolDefinition, ExecutorContext };
export { toAnthropicTool } from './types';

// Re-export tool categories for direct access
export { canvasTools } from './canvas';
export { knowledgeTools } from './knowledge';
export { metaTools } from './meta';
