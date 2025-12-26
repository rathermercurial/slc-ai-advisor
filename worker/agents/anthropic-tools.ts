/**
 * Anthropic Tool Definitions for Canvas Operations
 *
 * These tools allow the AI to update the Social Lean Canvas through
 * the Model Managers with proper validation and dependency enforcement.
 *
 * Tool routing:
 * - update_purpose → CanvasDO.updateSection('purpose', content)
 * - update_customer_section → CanvasDO.updateSection(section, content) → CustomerModelManager
 * - update_economic_section → CanvasDO.updateSection(section, content) → EconomicModelManager
 * - update_impact_field → CanvasDO.impactManager.updateSection(field, content)
 * - update_key_metrics → CanvasDO.updateSection('keyMetrics', content)
 */

import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type { UpdateResult } from '../../src/models';
import type { CanvasDO } from '../durable-objects/CanvasDO';
import type { ImpactModelField } from '../../src/types/canvas';
import type { CustomerSectionId, EconomicSectionId } from '../../src/models';

/**
 * Tool result type for canvas operations
 */
export interface ToolResult {
  success: boolean;
  message: string;
  result?: UpdateResult;
}

/**
 * Tool call input types
 */
export interface UpdatePurposeInput {
  content: string;
}

export interface UpdateCustomerSectionInput {
  section: CustomerSectionId;
  content: string;
}

export interface UpdateEconomicSectionInput {
  section: EconomicSectionId;
  content: string;
}

export interface UpdateImpactFieldInput {
  field: ImpactModelField;
  content: string;
}

export interface UpdateKeyMetricsInput {
  content: string;
}

/**
 * All canvas tool input types
 */
export type CanvasToolInput =
  | { name: 'update_purpose'; input: UpdatePurposeInput }
  | { name: 'update_customer_section'; input: UpdateCustomerSectionInput }
  | { name: 'update_economic_section'; input: UpdateEconomicSectionInput }
  | { name: 'update_impact_field'; input: UpdateImpactFieldInput }
  | { name: 'update_key_metrics'; input: UpdateKeyMetricsInput };

/**
 * Canvas tool names for type safety
 */
export const CANVAS_TOOL_NAMES = [
  'update_purpose',
  'update_customer_section',
  'update_economic_section',
  'update_impact_field',
  'update_key_metrics',
] as const;

export type CanvasToolName = (typeof CANVAS_TOOL_NAMES)[number];

/**
 * Check if a tool name is a canvas tool
 */
export function isCanvasTool(name: string): name is CanvasToolName {
  return CANVAS_TOOL_NAMES.includes(name as CanvasToolName);
}

/**
 * Anthropic tool definitions for canvas operations
 */
export const CANVAS_TOOLS: Tool[] = [
  {
    name: 'update_purpose',
    description: `Update the Purpose section of the Social Lean Canvas.

The Purpose is the foundational "why" behind the venture - why it exists and what drives it.
This section should articulate the core mission in 1-2 clear sentences.

IMPORTANT: Purpose is cross-cutting - it informs all other sections.
Minimum 20 characters required.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        content: {
          type: 'string',
          description: 'The purpose statement for the venture (minimum 20 characters)',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'update_customer_section',
    description: `Update a section in the Customer Model.

The Customer Model has 4 sections with a STRICT DEPENDENCY CHAIN:
1. customers (no dependency) - Who the venture serves
2. jobsToBeDone (requires customers) - The task/problem customers need to accomplish
3. valueProposition (requires customers + jobsToBeDone) - Why customers choose this solution
4. solution (requires valueProposition) - What the venture provides

IMPORTANT: You MUST complete sections in order. Attempting to update a section
before its dependencies are complete will result in an error.

Each section requires minimum 20 characters.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        section: {
          type: 'string',
          enum: ['customers', 'jobsToBeDone', 'valueProposition', 'solution'],
          description: 'The customer model section to update',
        },
        content: {
          type: 'string',
          description: 'The content for this section (minimum 20 characters)',
        },
      },
      required: ['section', 'content'],
    },
  },
  {
    name: 'update_economic_section',
    description: `Update a section in the Economic Model.

The Economic Model has 4 sections (can be completed in any order):
- channels: How customers are reached and acquired
- revenue: How income is generated (pricing model, revenue streams)
- costs: Major ongoing expenses and cost structure
- advantage: What can't be easily copied or bought (unfair advantage, moats)

Unlike the Customer Model, these sections have no strict dependencies,
but it's recommended to define revenue before finalizing advantage.

Each section requires minimum 20 characters.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        section: {
          type: 'string',
          enum: ['channels', 'revenue', 'costs', 'advantage'],
          description: 'The economic model section to update',
        },
        content: {
          type: 'string',
          description: 'The content for this section (minimum 20 characters)',
        },
      },
      required: ['section', 'content'],
    },
  },
  {
    name: 'update_impact_field',
    description: `Update a field in the Impact Model (Theory of Change).

The Impact Model is an 8-field causality chain that MUST be completed in order:
1. issue - The social/environmental problem being addressed
2. participants - Who experiences the issue / stakeholders involved
3. activities - What the venture does (interventions/programs)
4. outputs - Direct deliverables (products, services, events)
5. shortTermOutcomes - Changes in 0-1 year (awareness, skills, access)
6. mediumTermOutcomes - Changes in 1-3 years (behavior, practice, decisions)
7. longTermOutcomes - Changes in 3+ years (sustained improvements, systemic shifts)
8. impact - Ultimate social/environmental change (this IS the Impact section's content)

IMPORTANT: This is a strict causality chain. You CANNOT skip ahead.
Each field requires the previous field to be complete.

Each field requires minimum 10 characters.`,
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
          description: 'The impact model field to update (in causality chain order)',
        },
        content: {
          type: 'string',
          description: 'The content for this field (minimum 10 characters)',
        },
      },
      required: ['field', 'content'],
    },
  },
  {
    name: 'update_key_metrics',
    description: `Update the Key Metrics section of the Social Lean Canvas.

Key Metrics define how success is measured for the venture.
This section should include specific, measurable indicators.

BEST PRACTICE: Complete other sections first before defining metrics,
as metrics should measure progress toward purpose, value delivery, and impact.

Minimum 20 characters required.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        content: {
          type: 'string',
          description: 'The key metrics for the venture (minimum 20 characters)',
        },
      },
      required: ['content'],
    },
  },
];

/**
 * Execute a canvas tool call against CanvasDO
 *
 * Routes the tool call to the appropriate Model Manager through CanvasDO
 * and returns a structured result with success/error status.
 */
export async function executeCanvasTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  canvasStub: DurableObjectStub<CanvasDO>
): Promise<ToolResult> {
  try {
    let result: UpdateResult;

    switch (toolName) {
      case 'update_purpose': {
        const input = toolInput as UpdatePurposeInput;
        result = await canvasStub.updateSection('purpose', input.content);
        break;
      }

      case 'update_customer_section': {
        const input = toolInput as UpdateCustomerSectionInput;
        result = await canvasStub.updateSection(input.section, input.content);
        break;
      }

      case 'update_economic_section': {
        const input = toolInput as UpdateEconomicSectionInput;
        result = await canvasStub.updateSection(input.section, input.content);
        break;
      }

      case 'update_impact_field': {
        const input = toolInput as UpdateImpactFieldInput;
        // Impact Model fields route through dedicated updateImpactField method
        // which handles the 8-field causality chain validation
        result = await canvasStub.updateImpactField(input.field, input.content);
        break;
      }

      case 'update_key_metrics': {
        const input = toolInput as UpdateKeyMetricsInput;
        result = await canvasStub.updateSection('keyMetrics', input.content);
        break;
      }

      default:
        return {
          success: false,
          message: `Unknown tool: ${toolName}`,
        };
    }

    // Build response message
    if (result.success) {
      const completion = result.completion;
      return {
        success: true,
        message: `Successfully updated ${result.updatedSection}. Canvas completion: ${completion.percentage}%`,
        result,
      };
    } else {
      return {
        success: false,
        message: result.errors?.join('. ') ?? 'Unknown validation error',
        result,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Tool execution failed: ${message}`,
    };
  }
}
