/**
 * Anthropic-format tool definitions for SLCAgent
 *
 * Converts our tool definitions to Anthropic's expected format
 * and provides execution handlers.
 */

import type Anthropic from '@anthropic-ai/sdk';
import type { CanvasDO } from '../durable-objects/CanvasDO';
import type { AgentState } from './SLCAgent';

/**
 * Context interface for tool execution
 */
export interface ToolContext {
  name: string; // Agent instance name = canvasId
  state: AgentState; // Property getter from AIChatAgent
  setState(state: AgentState): void;
  getCanvasStub(canvasId: string): DurableObjectStub<CanvasDO>;
}

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
];

/**
 * Execute a tool and return the result
 */
export async function executeTool(
  ctx: ToolContext,
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<unknown> {
  const canvasId = ctx.name;
  if (!canvasId) {
    throw new Error('No canvas selected. Please create or select a canvas first.');
  }

  const stub = ctx.getCanvasStub(canvasId);

  const setStatus = (status: AgentState['status'], message: string) => {
    ctx.setState({ ...ctx.state, status, statusMessage: message });
  };

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

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
