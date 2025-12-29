/**
 * Anthropic-format tool definitions for SLCAgent
 *
 * Unified tool definitions combining:
 * - Canvas tools: Update/read canvas sections
 * - Knowledge tools: Search methodology, examples, knowledge base
 *
 * @see https://github.com/rathermercurial/slc/issues/38 - Canvas tools
 * @see https://github.com/rathermercurial/slc/issues/39 - Knowledge tools
 */

import type Anthropic from '@anthropic-ai/sdk';
import type { CanvasDO } from '../durable-objects/CanvasDO';
import type { AgentState } from './SLCAgent';
import { searchForTools } from '../retrieval/vector-search';

/**
 * Context interface for tool execution
 */
export interface ToolContext {
  name: string; // Agent instance name = canvasId
  state: AgentState;
  setState(state: AgentState): void;
  getCanvasStub(canvasId: string): DurableObjectStub<CanvasDO>;
  env: Env; // For Vectorize and AI bindings
  /** Callback to broadcast canvas state after modification */
  broadcastCanvasUpdate(): Promise<void>;
}

/**
 * Tools that modify canvas state and require broadcasting
 */
const CANVAS_MODIFYING_TOOLS = new Set([
  'update_purpose',
  'update_customer_section',
  'update_economic_section',
  'update_impact_field',
  'update_key_metrics',
]);

/**
 * Tool definitions in Anthropic format
 */
export const ANTHROPIC_TOOLS: Anthropic.Tool[] = [
  {
    name: 'update_purpose',
    description:
      'Update the Purpose section of the canvas. Purpose should explain why the venture exists and what problem it solves.',
    input_schema: {
      type: 'object' as const,
      properties: {
        content: {
          type: 'string',
          description: 'The purpose content explaining why the venture exists',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'update_customer_section',
    description:
      'Update a Customer Model section: customers (who you serve), jobsToBeDone (their problems), valueProposition (your unique solution), or solution (your product/service).',
    input_schema: {
      type: 'object' as const,
      properties: {
        section: {
          type: 'string',
          enum: ['customers', 'jobsToBeDone', 'valueProposition', 'solution'],
          description: 'Which customer model section to update',
        },
        content: {
          type: 'string',
          description: 'The content for this section',
        },
      },
      required: ['section', 'content'],
    },
  },
  {
    name: 'update_economic_section',
    description:
      'Update an Economic Model section: channels (how you reach customers), revenue (how you make money), costs (major expenses), or advantage (competitive moat).',
    input_schema: {
      type: 'object' as const,
      properties: {
        section: {
          type: 'string',
          enum: ['channels', 'revenue', 'costs', 'advantage'],
          description: 'Which economic model section to update',
        },
        content: {
          type: 'string',
          description: 'The content for this section',
        },
      },
      required: ['section', 'content'],
    },
  },
  {
    name: 'update_impact_field',
    description:
      'Update an Impact Model field in the causality chain. The chain flows: issue -> participants -> activities -> outputs -> shortTermOutcomes -> mediumTermOutcomes -> longTermOutcomes -> impact.',
    input_schema: {
      type: 'object' as const,
      properties: {
        field: {
          type: 'string',
          enum: [
            'issue',
            'participants',
            'activities',
            'outputs',
            'shortTermOutcomes',
            'mediumTermOutcomes',
            'longTermOutcomes',
            'impact',
          ],
          description: 'Which impact model field to update',
        },
        content: {
          type: 'string',
          description: 'The content for this field',
        },
      },
      required: ['field', 'content'],
    },
  },
  {
    name: 'update_key_metrics',
    description:
      'Update the Key Metrics section. This should be completed last, after other sections are filled in.',
    input_schema: {
      type: 'object' as const,
      properties: {
        content: {
          type: 'string',
          description: 'The key metrics content',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'get_canvas',
    description:
      'Get the current canvas state to understand what has been filled in and what is missing.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  // Knowledge tools
  {
    name: 'search_methodology',
    description:
      'Search the Social Lean Canvas methodology documentation. Use this to find guidance on how to fill canvas sections, best practices, and conceptual explanations.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Natural language query about SLC methodology',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 5, max: 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_examples',
    description:
      'Search venture examples from the knowledge base. Use Selection Matrix dimensions to filter for relevant examples matching the current venture profile.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Natural language query about venture examples',
        },
        filters: {
          type: 'object',
          description: 'Selection Matrix dimension filters',
          properties: {
            stage: {
              type: 'string',
              enum: ['idea', 'validation', 'growth', 'scale'],
              description: 'Venture development stage',
            },
            impactArea: {
              type: 'string',
              description: 'Primary impact area (e.g., health, education, environment)',
            },
            mechanism: {
              type: 'string',
              enum: ['product', 'service', 'platform', 'hybrid'],
              description: 'How impact is delivered',
            },
            legalStructure: {
              type: 'string',
              enum: ['nonprofit', 'forprofit', 'hybrid', 'cooperative'],
              description: 'Legal/organizational structure',
            },
            revenueSource: {
              type: 'string',
              enum: ['earned', 'grants', 'donations', 'mixed'],
              description: 'Primary revenue source',
            },
            fundingSource: {
              type: 'string',
              enum: ['bootstrapped', 'angel', 'vc', 'grants', 'crowdfunding'],
              description: 'Primary funding source',
            },
            industry: {
              type: 'string',
              description: 'Industry vertical',
            },
          },
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 3, max: 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_knowledge_base',
    description:
      'General semantic search across the entire knowledge base including methodology docs, examples, and reference materials.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Natural language search query',
        },
        contentType: {
          type: 'string',
          enum: ['methodology', 'example', 'reference', 'all'],
          description: 'Filter by content type (default: all)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 5, max: 20)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_venture_profile',
    description:
      'Get the current venture dimension profile from the canvas. Returns inferred Selection Matrix dimensions based on canvas content.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
];

/**
 * Execute a tool and return the result
 *
 * For canvas-modifying tools, broadcasts the updated canvas state
 * to all connected clients via the Agent's state sync mechanism.
 */
export async function executeTool(
  ctx: ToolContext,
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<unknown> {
  // Extract canvasId from agent name (format: canvasId or canvasId--threadId)
  const canvasId = ctx.name?.split('--')[0];
  if (!canvasId) {
    throw new Error('No canvas selected. Please create or select a canvas first.');
  }

  const stub = ctx.getCanvasStub(canvasId);

  const setStatus = (status: AgentState['status'], message: string) => {
    ctx.setState({ ...ctx.state, status, statusMessage: message });
  };

  // Track if this tool modifies canvas
  const isCanvasModifying = CANVAS_MODIFYING_TOOLS.has(toolName);

  switch (toolName) {
    case 'update_purpose': {
      setStatus('updating', 'Updating purpose...');
      const result = await stub.updateSection('purpose', toolInput.content as string);
      return result;
    }

    case 'update_customer_section': {
      const section = toolInput.section as string;
      setStatus('updating', `Updating ${section}...`);
      const result = await stub.updateSection(
        section as 'customers' | 'jobsToBeDone' | 'valueProposition' | 'solution',
        toolInput.content as string
      );
      return result;
    }

    case 'update_economic_section': {
      const section = toolInput.section as string;
      setStatus('updating', `Updating ${section}...`);
      const result = await stub.updateSection(
        section as 'channels' | 'revenue' | 'costs' | 'advantage',
        toolInput.content as string
      );
      return result;
    }

    case 'update_impact_field': {
      const field = toolInput.field as string;
      setStatus('updating', `Updating impact ${field}...`);
      const result = await stub.updateImpactField(
        field as
          | 'issue'
          | 'participants'
          | 'activities'
          | 'outputs'
          | 'shortTermOutcomes'
          | 'mediumTermOutcomes'
          | 'longTermOutcomes'
          | 'impact',
        toolInput.content as string
      );
      return result;
    }

    case 'update_key_metrics': {
      setStatus('updating', 'Updating key metrics...');
      const result = await stub.updateSection('keyMetrics', toolInput.content as string);
      return result;
    }

    case 'get_canvas': {
      setStatus('searching', 'Loading canvas...');
      const canvas = await stub.getFullCanvas();
      return canvas;
    }

    // Knowledge tools - use unified search from vector-search.ts
    case 'search_methodology': {
      setStatus('searching', 'Searching methodology...');
      const result = await searchForTools(ctx.env, {
        query: toolInput.query as string,
        contentType: 'methodology',
        limit: Math.min((toolInput.limit as number) || 5, 10),
      }, canvasId);
      return result;
    }

    case 'search_examples': {
      setStatus('searching', 'Searching examples...');
      const filters = toolInput.filters as {
        stage?: string;
        impactArea?: string;
        mechanism?: string;
        legalStructure?: string;
        revenueSource?: string;
        fundingSource?: string;
        industry?: string;
      } | undefined;
      const result = await searchForTools(ctx.env, {
        query: toolInput.query as string,
        contentType: 'example',
        filters,
        limit: Math.min((toolInput.limit as number) || 3, 10),
      }, canvasId);
      return result;
    }

    case 'search_knowledge_base': {
      setStatus('searching', 'Searching knowledge base...');
      const contentType = (toolInput.contentType as string) || 'all';
      const result = await searchForTools(ctx.env, {
        query: toolInput.query as string,
        contentType: contentType === 'all' ? undefined : (contentType as 'methodology' | 'example'),
        limit: Math.min((toolInput.limit as number) || 5, 20),
      }, canvasId);
      return result;
    }

    case 'get_venture_profile': {
      setStatus('searching', 'Getting venture profile...');
      const profile = await stub.getVentureProfile();
      return profile;
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

/**
 * Execute a tool with automatic canvas broadcast for modifying tools
 *
 * Wraps executeTool and broadcasts canvas state after canvas-modifying tools.
 */
export async function executeToolWithBroadcast(
  ctx: ToolContext,
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<unknown> {
  const result = await executeTool(ctx, toolName, toolInput);

  // Broadcast canvas state if this tool modified the canvas
  if (CANVAS_MODIFYING_TOOLS.has(toolName)) {
    await ctx.broadcastCanvasUpdate();
  }

  return result;
}

