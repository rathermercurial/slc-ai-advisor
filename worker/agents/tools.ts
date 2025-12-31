/**
 * Tool definitions for SLCAgent using Vercel AI SDK format
 *
 * Uses Zod schemas for type-safe tool parameters.
 * Converted from Anthropic format for SDK-native streaming.
 *
 * @see https://github.com/rathermercurial/slc/issues/38 - Canvas tools
 * @see https://github.com/rathermercurial/slc/issues/39 - Knowledge tools
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { CanvasDO } from '../durable-objects/CanvasDO';
import type { AgentState } from './SLCAgent';
import { searchForTools } from '../retrieval/vector-search';

/**
 * Context interface for tool execution
 */
export interface ToolContext {
  name: string; // Agent instance name = canvasId--threadId
  state: AgentState;
  setState(state: AgentState): void;
  getCanvasStub(canvasId: string): DurableObjectStub<CanvasDO>;
  env: Env; // For Vectorize and AI bindings
  /** Callback to broadcast canvas state after modification */
  broadcastCanvasUpdate(): Promise<void>;
}

/**
 * Helper to set agent status
 */
function createSetStatus(ctx: ToolContext) {
  return (status: AgentState['status'], message: string) => {
    ctx.setState({ ...ctx.state, status, statusMessage: message });
  };
}

/**
 * Extract canvasId from agent name (format: canvasId or canvasId--threadId)
 */
function getCanvasId(ctx: ToolContext): string {
  const canvasId = ctx.name?.split('--')[0];
  if (!canvasId) {
    throw new Error('No canvas selected. Please create or select a canvas first.');
  }
  return canvasId;
}

/**
 * Create all tools with the given context
 *
 * Tools are created as a factory function so they have access to the
 * agent context (canvas stub, env bindings, state management).
 */
export function createTools(ctx: ToolContext) {
  const setStatus = createSetStatus(ctx);

  // Note: Canvas broadcasting is handled centrally in SLCAgent.onStepFinish
  // after tool execution, not in individual tools.

  return {
    update_purpose: tool({
      description:
        'Update the Purpose section of the canvas. Purpose should explain why the venture exists and what problem it solves.',
      inputSchema: z.object({
        content: z.string().describe('The purpose content explaining why the venture exists'),
      }),
      execute: async ({ content }) => {
        setStatus('updating', 'Updating purpose...');
        const canvasId = getCanvasId(ctx);
        const stub = ctx.getCanvasStub(canvasId);
        return await stub.updateSection('purpose', content);
      },
    }),

    update_customer_section: tool({
      description:
        'Update a Customer Model section: customers (who you serve), jobsToBeDone (their problems), valueProposition (your unique solution), or solution (your product/service).',
      inputSchema: z.object({
        section: z
          .enum(['customers', 'jobsToBeDone', 'valueProposition', 'solution'])
          .describe('Which customer model section to update'),
        content: z.string().describe('The content for this section'),
      }),
      execute: async ({ section, content }) => {
        setStatus('updating', `Updating ${section}...`);
        const canvasId = getCanvasId(ctx);
        const stub = ctx.getCanvasStub(canvasId);
        return await stub.updateSection(section, content);
      },
    }),

    update_economic_section: tool({
      description:
        'Update an Economic Model section: channels (how you reach customers), revenue (how you make money), costs (major expenses), or advantage (competitive moat).',
      inputSchema: z.object({
        section: z
          .enum(['channels', 'revenue', 'costs', 'advantage'])
          .describe('Which economic model section to update'),
        content: z.string().describe('The content for this section'),
      }),
      execute: async ({ section, content }) => {
        setStatus('updating', `Updating ${section}...`);
        const canvasId = getCanvasId(ctx);
        const stub = ctx.getCanvasStub(canvasId);
        return await stub.updateSection(section, content);
      },
    }),

    update_impact_field: tool({
      description:
        'Update an Impact Model field in the causality chain. The chain flows: issue -> participants -> activities -> outputs -> shortTermOutcomes -> mediumTermOutcomes -> longTermOutcomes -> impact.',
      inputSchema: z.object({
        field: z
          .enum([
            'issue',
            'participants',
            'activities',
            'outputs',
            'shortTermOutcomes',
            'mediumTermOutcomes',
            'longTermOutcomes',
            'impact',
          ])
          .describe('Which impact model field to update'),
        content: z.string().describe('The content for this field'),
      }),
      execute: async ({ field, content }) => {
        setStatus('updating', `Updating impact ${field}...`);
        const canvasId = getCanvasId(ctx);
        const stub = ctx.getCanvasStub(canvasId);
        return await stub.updateImpactField(field, content);
      },
    }),

    update_key_metrics: tool({
      description:
        'Update the Key Metrics section. This should be completed last, after other sections are filled in.',
      inputSchema: z.object({
        content: z.string().describe('The key metrics content'),
      }),
      execute: async ({ content }) => {
        setStatus('updating', 'Updating key metrics...');
        const canvasId = getCanvasId(ctx);
        const stub = ctx.getCanvasStub(canvasId);
        return await stub.updateSection('keyMetrics', content);
      },
    }),

    get_canvas: tool({
      description:
        'Get the current canvas state to understand what has been filled in and what is missing.',
      inputSchema: z.object({
        _placeholder: z.string().optional().describe('Unused parameter'),
      }),
      execute: async () => {
        setStatus('searching', 'Loading canvas...');
        const canvasId = getCanvasId(ctx);
        const stub = ctx.getCanvasStub(canvasId);
        const canvas = await stub.getFullCanvas();
        return canvas;
      },
    }),

    search_methodology: tool({
      description:
        'Search the Social Lean Canvas methodology documentation. Use this to find guidance on how to fill canvas sections, best practices, and conceptual explanations.',
      inputSchema: z.object({
        query: z.string().describe('Natural language query about SLC methodology'),
        limit: z
          .number()
          .optional()
          .describe('Maximum number of results (default: 5, max: 10)'),
      }),
      execute: async ({ query, limit }) => {
        setStatus('searching', 'Searching methodology...');
        const canvasId = getCanvasId(ctx);
        const result = await searchForTools(
          ctx.env,
          {
            query,
            contentType: 'methodology',
            limit: Math.min(limit || 5, 10),
          },
          canvasId
        );

        // Return structured response with success/failure status
        if (result.results.length === 0) {
          return {
            success: false,
            message: 'No methodology documents found matching your query. Try rephrasing or using broader terms.',
            results: [],
          };
        }

        const hasContent = result.results.some(r => r.content && r.content.length > 0);
        if (!hasContent) {
          return {
            success: false,
            message: 'Found matching documents but content is unavailable. The knowledge base may need to be re-indexed.',
            metadata: result.results.map(r => r.metadata),
            warning: result.warning,
          };
        }

        return {
          success: true,
          results: result.results,
          totalFound: result.totalFound,
        };
      },
    }),

    search_examples: tool({
      description:
        'Search venture examples from the knowledge base. Use Selection Matrix dimensions to filter for relevant examples matching the current venture profile.',
      inputSchema: z.object({
        query: z.string().describe('Natural language query about venture examples'),
        filters: z
          .object({
            stage: z
              .enum(['idea', 'validation', 'growth', 'scale'])
              .optional()
              .describe('Venture development stage'),
            impactArea: z
              .string()
              .optional()
              .describe('Primary impact area (e.g., health, education, environment)'),
            mechanism: z
              .enum(['product', 'service', 'platform', 'hybrid'])
              .optional()
              .describe('How impact is delivered'),
            legalStructure: z
              .enum(['nonprofit', 'forprofit', 'hybrid', 'cooperative'])
              .optional()
              .describe('Legal/organizational structure'),
            revenueSource: z
              .enum(['earned', 'grants', 'donations', 'mixed'])
              .optional()
              .describe('Primary revenue source'),
            fundingSource: z
              .enum(['bootstrapped', 'angel', 'vc', 'grants', 'crowdfunding'])
              .optional()
              .describe('Primary funding source'),
            industry: z.string().optional().describe('Industry vertical'),
          })
          .optional()
          .describe('Selection Matrix dimension filters'),
        limit: z
          .number()
          .optional()
          .describe('Maximum number of results (default: 3, max: 10)'),
      }),
      execute: async ({ query, filters, limit }) => {
        setStatus('searching', 'Searching examples...');
        const canvasId = getCanvasId(ctx);
        const result = await searchForTools(
          ctx.env,
          {
            query,
            contentType: 'example',
            filters,
            limit: Math.min(limit || 3, 10),
          },
          canvasId
        );

        // Return structured response with success/failure status
        if (result.results.length === 0) {
          return {
            success: false,
            message: 'No example ventures found matching your query. Try broader search terms or fewer filters.',
            results: [],
          };
        }

        const hasContent = result.results.some(r => r.content && r.content.length > 0);
        if (!hasContent) {
          return {
            success: false,
            message: 'Found matching examples but content is unavailable. The knowledge base may need to be re-indexed.',
            metadata: result.results.map(r => r.metadata),
            warning: result.warning,
          };
        }

        return {
          success: true,
          results: result.results,
          totalFound: result.totalFound,
        };
      },
    }),

    search_knowledge_base: tool({
      description:
        'General semantic search across the entire knowledge base including methodology docs, examples, and reference materials.',
      inputSchema: z.object({
        query: z.string().describe('Natural language search query'),
        contentType: z
          .enum(['methodology', 'example', 'reference', 'all'])
          .optional()
          .describe('Filter by content type (default: all)'),
        limit: z
          .number()
          .optional()
          .describe('Maximum number of results (default: 5, max: 20)'),
      }),
      execute: async ({ query, contentType, limit }) => {
        setStatus('searching', 'Searching knowledge base...');
        const canvasId = getCanvasId(ctx);
        const result = await searchForTools(
          ctx.env,
          {
            query,
            contentType:
              contentType === 'all' || !contentType
                ? undefined
                : (contentType as 'methodology' | 'example'),
            limit: Math.min(limit || 5, 20),
          },
          canvasId
        );

        // Return structured response with success/failure status
        if (result.results.length === 0) {
          return {
            success: false,
            message: 'No documents found matching your query. Try different search terms.',
            results: [],
          };
        }

        const hasContent = result.results.some(r => r.content && r.content.length > 0);
        if (!hasContent) {
          return {
            success: false,
            message: 'Found matching documents but content is unavailable. The knowledge base may need to be re-indexed.',
            metadata: result.results.map(r => r.metadata),
            warning: result.warning,
          };
        }

        return {
          success: true,
          results: result.results,
          totalFound: result.totalFound,
        };
      },
    }),

    get_venture_profile: tool({
      description:
        'Get the current venture dimension profile from the canvas. Returns inferred Selection Matrix dimensions based on canvas content.',
      inputSchema: z.object({
        _placeholder: z.string().optional().describe('Unused parameter'),
      }),
      execute: async () => {
        setStatus('searching', 'Getting venture profile...');
        const canvasId = getCanvasId(ctx);
        const stub = ctx.getCanvasStub(canvasId);
        const profile = await stub.getVentureProfile();
        return profile;
      },
    }),
  };
}
