/**
 * Tool Executor
 *
 * Handles tool lookup, validation, and execution with optional
 * canvas state broadcasting for modifying tools.
 */

import type { ToolDefinition, ExecutorContext } from './types';

/**
 * Execute a tool by name
 *
 * Looks up the tool in the provided array, validates input with Zod,
 * and executes the tool's handler.
 *
 * @param tools - Array of available tool definitions
 * @param toolName - Name of the tool to execute
 * @param toolInput - Raw input to validate and pass to the tool
 * @param ctx - Executor context with canvas stub, env, logger, etc.
 * @returns Tool execution result
 * @throws Error if tool not found or validation fails
 */
export async function executeTool(
  tools: ToolDefinition[],
  toolName: string,
  toolInput: unknown,
  ctx: ExecutorContext
): Promise<unknown> {
  // Validate canvas ID
  if (!ctx.canvasId) {
    throw new Error('No canvas selected. Please create or select a canvas first.');
  }

  // Find the tool
  const tool = tools.find((t) => t.name === toolName);
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  // Validate input with Zod schema
  const parseResult = tool.schema.safeParse(toolInput);
  if (!parseResult.success) {
    const errors = parseResult.error.issues.map((i) => i.message).join(', ');
    throw new Error(`Invalid input for ${toolName}: ${errors}`);
  }

  // Execute the tool
  ctx.logger.info(`Executing tool: ${tool.name}`);
  return await tool.execute(ctx, parseResult.data);
}

/**
 * Execute a tool with automatic canvas broadcast for modifying tools
 *
 * Wraps executeTool and broadcasts canvas state after canvas-modifying tools
 * complete successfully.
 *
 * @param tools - Array of available tool definitions
 * @param toolName - Name of the tool to execute
 * @param toolInput - Raw input to validate and pass to the tool
 * @param ctx - Executor context
 * @param broadcast - Callback to broadcast canvas state to clients
 * @returns Tool execution result
 */
export async function executeToolWithBroadcast(
  tools: ToolDefinition[],
  toolName: string,
  toolInput: unknown,
  ctx: ExecutorContext,
  broadcast: () => Promise<void>
): Promise<unknown> {
  const result = await executeTool(tools, toolName, toolInput, ctx);

  // Find the tool to check if it modifies canvas
  const tool = tools.find((t) => t.name === toolName);
  if (tool?.modifiesCanvas) {
    await broadcast();
  }

  return result;
}
