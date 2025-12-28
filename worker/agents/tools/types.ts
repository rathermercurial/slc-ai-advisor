/**
 * Tool System Type Definitions
 *
 * Core types for the modular tool system with Zod validation.
 * Uses Zod v4's built-in z.toJSONSchema() for Anthropic API compatibility.
 */

import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import type { CanvasDO } from '../../durable-objects/CanvasDO';
import type { AgentState } from '../SLCAgent';
import type { Logger } from '../../observability';

/**
 * Context provided to tool execution
 */
export interface ExecutorContext {
  /** Canvas ID (same as agent name/session ID) */
  canvasId: string;
  /** Durable Object stub for canvas operations */
  canvasStub: DurableObjectStub<CanvasDO>;
  /** Environment bindings */
  env: Env;
  /** Logger instance for observability */
  logger: Logger;
  /** Update agent status (syncs to clients) */
  setStatus: (status: AgentState['status'], message: string) => void;
}

/**
 * Result type for tool execution (for future use)
 */
export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Tool definition with Zod schema validation
 *
 * @template TSchema - Zod schema type for input validation
 */
export interface ToolDefinition<TSchema extends z.ZodType = z.ZodType> {
  /** Tool name (snake_case, matches Anthropic tool use) */
  name: string;
  /** Description for LLM context */
  description: string;
  /** Zod schema for input validation */
  schema: TSchema;
  /** Whether this tool modifies canvas state */
  modifiesCanvas: boolean;
  /** Execute the tool with validated input */
  execute: (ctx: ExecutorContext, input: z.infer<TSchema>) => Promise<unknown>;
}

/**
 * Convert a ToolDefinition to Anthropic Tool format
 *
 * Uses Zod v4's native toJSONSchema() with draft-07 target
 * for Anthropic API compatibility.
 */
export function toAnthropicTool(tool: ToolDefinition): Anthropic.Tool {
  const jsonSchema = z.toJSONSchema(tool.schema, { target: 'draft-07' });
  return {
    name: tool.name,
    description: tool.description,
    input_schema: jsonSchema as Anthropic.Tool['input_schema'],
  };
}
