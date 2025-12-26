/**
 * Anthropic Tool Definitions for SLC Agent
 *
 * This module defines tools that Claude can use during conversation:
 * - Knowledge base search tools (methodology, examples)
 * - Canvas tools (defined separately, referenced here for completeness)
 *
 * Tool execution happens in the SLCAgent via the Anthropic SDK.
 */

import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type { CanvasSectionId, Model } from '../../src/types/canvas';
import type { VentureDimensions } from '../../src/types/venture';
import type { CanvasDO } from '../durable-objects/CanvasDO';
import {
  searchKnowledgeBase,
  parseQueryIntent,
  buildRAGContext,
  type QueryIntent,
} from '../retrieval/vector-search';

// ============================================
// Tool Definitions (Anthropic Format)
// ============================================

/**
 * Knowledge base tool definitions
 */
export const knowledgeTools: Tool[] = [
  {
    name: 'search_methodology',
    description: `Search the Social Lean Canvas knowledge base for methodology content.
Use this tool to find:
- Explanations of canvas sections (purpose, customers, impact, etc.)
- How to complete specific parts of the canvas
- Best practices and frameworks for social entrepreneurs
- Theory of Change and Impact Model guidance

The search uses the Selection Matrix to filter results based on the user's venture profile.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'The search query describing what methodology content the user needs',
        },
        target_section: {
          type: 'string',
          enum: [
            'purpose',
            'customers',
            'jobsToBeDone',
            'valueProposition',
            'solution',
            'channels',
            'revenue',
            'costs',
            'keyMetrics',
            'advantage',
            'impact',
          ],
          description: 'Optional: Filter results to a specific canvas section',
        },
        target_model: {
          type: 'string',
          enum: ['customer', 'economic', 'impact'],
          description: 'Optional: Filter results to a specific model grouping',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_examples',
    description: `Search the knowledge base for real-world venture examples.
Use this tool to find:
- Case studies of social enterprises at similar stages
- Examples of completed canvas sections
- Ventures in similar impact areas or industries
- Reference implementations of business models

Results are filtered by the user's venture profile (stage, impact area, industry).
Use this when the user asks "show me an example" or wants to see how others did something.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'The search query describing what examples the user needs',
        },
        target_section: {
          type: 'string',
          enum: [
            'purpose',
            'customers',
            'jobsToBeDone',
            'valueProposition',
            'solution',
            'channels',
            'revenue',
            'costs',
            'keyMetrics',
            'advantage',
            'impact',
          ],
          description: 'Optional: Filter examples to those with strong content in this section',
        },
        venture_stage: {
          type: 'string',
          enum: ['idea', 'early', 'growth', 'scale'],
          description: 'Optional: Override venture stage filter',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_knowledge_base',
    description: `General search across the entire knowledge base.
Use this tool when:
- The query doesn't fit neatly into methodology or examples
- You need to search for concepts, definitions, or general information
- The user has a broad question about social entrepreneurship

This searches both methodology and example content with smart filtering.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'The search query',
        },
        content_type: {
          type: 'string',
          enum: ['methodology', 'examples', 'general'],
          description: 'Optional: Filter by content type. Defaults to general (searches all).',
        },
        target_section: {
          type: 'string',
          enum: [
            'purpose',
            'customers',
            'jobsToBeDone',
            'valueProposition',
            'solution',
            'channels',
            'revenue',
            'costs',
            'keyMetrics',
            'advantage',
            'impact',
          ],
          description: 'Optional: Filter to a specific canvas section',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_venture_profile',
    description: `Get the current venture profile and dimensions.
Use this tool to:
- Understand what is known about the user's venture
- Check which dimensions have been inferred or confirmed
- Provide context-aware recommendations

Returns the 7 venture dimensions with confidence scores.`,
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
];

// ============================================
// Tool Input Types
// ============================================

export interface SearchMethodologyInput {
  query: string;
  target_section?: CanvasSectionId;
  target_model?: Model;
}

export interface SearchExamplesInput {
  query: string;
  target_section?: CanvasSectionId;
  venture_stage?: string;
}

export interface SearchKnowledgeBaseInput {
  query: string;
  content_type?: 'methodology' | 'examples' | 'general';
  target_section?: CanvasSectionId;
}

export interface GetVentureProfileInput {
  // No inputs required
}

// Union type for all tool inputs
export type KnowledgeToolInput =
  | SearchMethodologyInput
  | SearchExamplesInput
  | SearchKnowledgeBaseInput
  | GetVentureProfileInput;

// ============================================
// Input Validation
// ============================================

/**
 * Validate that a query string is present and non-empty
 */
function validateQuery(input: unknown): string {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid input: expected an object');
  }
  const obj = input as Record<string, unknown>;
  if (typeof obj.query !== 'string' || obj.query.trim().length === 0) {
    throw new Error('Invalid input: query is required and must be a non-empty string');
  }
  return obj.query.trim();
}

/**
 * Validate optional section parameter
 */
function validateSection(section: unknown): CanvasSectionId | undefined {
  if (section === undefined || section === null) return undefined;
  const validSections = [
    'purpose', 'customers', 'jobsToBeDone', 'valueProposition', 'solution',
    'channels', 'revenue', 'costs', 'keyMetrics', 'advantage', 'impact',
  ];
  if (typeof section !== 'string' || !validSections.includes(section)) {
    return undefined; // Ignore invalid section, don't error
  }
  return section as CanvasSectionId;
}

/**
 * Validate optional model parameter
 */
function validateModel(model: unknown): Model | undefined {
  if (model === undefined || model === null) return undefined;
  const validModels = ['customer', 'economic', 'impact'];
  if (typeof model !== 'string' || !validModels.includes(model)) {
    return undefined; // Ignore invalid model, don't error
  }
  return model as Model;
}

/**
 * Validate optional venture stage parameter
 */
function validateStage(stage: unknown): string | undefined {
  if (stage === undefined || stage === null) return undefined;
  const validStages = ['idea', 'early', 'growth', 'scale'];
  if (typeof stage !== 'string' || !validStages.includes(stage)) {
    return undefined; // Ignore invalid stage, don't error
  }
  return stage;
}

// ============================================
// Tool Result Types
// ============================================

export interface SearchResult {
  documents: Array<{
    id: string;
    title: string;
    content: string;
    contentType: string;
    section?: string;
    stage?: string;
    impactArea?: string;
    score: number;
  }>;
  context: string;
  filtersApplied: {
    contentType?: string;
    section?: string;
    model?: string;
    stage?: string;
  };
  resultCount: number;
}

export interface VentureProfileResult {
  dimensions: VentureDimensions;
  confidence: Record<string, number>;
  confirmed: Record<string, boolean>;
  readyForFiltering: Partial<VentureDimensions>;
}

export interface ToolError {
  error: string;
  code: 'VALIDATION_ERROR' | 'SEARCH_ERROR' | 'PROFILE_ERROR' | 'UNKNOWN_TOOL';
}

// ============================================
// Tool Execution Context
// ============================================

export interface ToolContext {
  env: Env;
  canvasStub: DurableObjectStub<CanvasDO>;
  program: string;
}

// ============================================
// Tool Handlers
// ============================================

/**
 * Execute the search_methodology tool
 */
export async function handleSearchMethodology(
  input: unknown,
  ctx: ToolContext
): Promise<SearchResult | ToolError> {
  try {
    // Validate input
    const query = validateQuery(input);
    const inputObj = input as Record<string, unknown>;
    const targetSection = validateSection(inputObj.target_section);
    const targetModel = validateModel(inputObj.target_model);

    // Get venture dimensions for filtering
    const dimensions = await ctx.canvasStub.getDimensionsForFiltering();

    // Build query intent
    const intent: QueryIntent = {
      type: 'methodology',
      targetSection,
      targetModel,
    };

    // Search knowledge base
    const documents = await searchKnowledgeBase(
      ctx.env,
      query,
      ctx.program,
      dimensions,
      intent
    );

    // Build context for response
    const context = buildRAGContext(documents);

    return {
      documents: documents.map((doc) => ({
        id: doc.id,
        title: doc.metadata.title || 'Untitled',
        content: doc.content,
        contentType: doc.metadata.content_type || 'methodology',
        section: doc.metadata.canvas_section,
        stage: doc.metadata.venture_stage,
        impactArea: doc.metadata.primary_impact_area,
        score: doc.score,
      })),
      context,
      filtersApplied: {
        contentType: 'methodology',
        section: targetSection,
        model: targetModel,
      },
      resultCount: documents.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.startsWith('Invalid input')) {
      return { error: message, code: 'VALIDATION_ERROR' };
    }
    return { error: `Search failed: ${message}`, code: 'SEARCH_ERROR' };
  }
}

/**
 * Execute the search_examples tool
 */
export async function handleSearchExamples(
  input: unknown,
  ctx: ToolContext
): Promise<SearchResult | ToolError> {
  try {
    // Validate input
    const query = validateQuery(input);
    const inputObj = input as Record<string, unknown>;
    const targetSection = validateSection(inputObj.target_section);
    const ventureStage = validateStage(inputObj.venture_stage);

    // Get venture dimensions for filtering (copy to avoid mutation)
    const baseDimensions = await ctx.canvasStub.getDimensionsForFiltering();
    const dimensions: Partial<VentureDimensions> = {
      ...baseDimensions,
      // Override venture stage if provided
      ...(ventureStage ? { ventureStage } : {}),
    };

    // Build query intent
    const intent: QueryIntent = {
      type: 'examples',
      targetSection,
    };

    // Search knowledge base
    const documents = await searchKnowledgeBase(
      ctx.env,
      query,
      ctx.program,
      dimensions,
      intent
    );

    // Build context for response
    const context = buildRAGContext(documents);

    return {
      documents: documents.map((doc) => ({
        id: doc.id,
        title: doc.metadata.title || 'Untitled',
        content: doc.content,
        contentType: doc.metadata.content_type || 'example',
        section: doc.metadata.canvas_section,
        stage: doc.metadata.venture_stage,
        impactArea: doc.metadata.primary_impact_area,
        score: doc.score,
      })),
      context,
      filtersApplied: {
        contentType: 'examples',
        section: targetSection,
        stage: ventureStage || baseDimensions.ventureStage || undefined,
      },
      resultCount: documents.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.startsWith('Invalid input')) {
      return { error: message, code: 'VALIDATION_ERROR' };
    }
    return { error: `Search failed: ${message}`, code: 'SEARCH_ERROR' };
  }
}

/**
 * Execute the search_knowledge_base tool
 */
export async function handleSearchKnowledgeBase(
  input: unknown,
  ctx: ToolContext
): Promise<SearchResult | ToolError> {
  try {
    // Validate input
    const query = validateQuery(input);
    const inputObj = input as Record<string, unknown>;
    const targetSection = validateSection(inputObj.target_section);

    // Validate content type
    let contentType: 'methodology' | 'examples' | 'general' | undefined;
    if (inputObj.content_type === 'methodology' || inputObj.content_type === 'examples' || inputObj.content_type === 'general') {
      contentType = inputObj.content_type;
    }

    // Get venture dimensions for filtering
    const dimensions = await ctx.canvasStub.getDimensionsForFiltering();

    // Determine content type from input or parse from query
    let intentType: 'methodology' | 'examples' | 'general' = 'general';
    if (contentType === 'methodology') {
      intentType = 'methodology';
    } else if (contentType === 'examples') {
      intentType = 'examples';
    } else if (!contentType) {
      // Auto-detect from query
      const parsed = parseQueryIntent(query);
      intentType = parsed.type;
    }

    // Build query intent
    const intent: QueryIntent = {
      type: intentType,
      targetSection,
    };

    // Search knowledge base
    const documents = await searchKnowledgeBase(
      ctx.env,
      query,
      ctx.program,
      dimensions,
      intent
    );

    // Build context for response
    const context = buildRAGContext(documents);

    return {
      documents: documents.map((doc) => ({
        id: doc.id,
        title: doc.metadata.title || 'Untitled',
        content: doc.content,
        contentType: doc.metadata.content_type || 'unknown',
        section: doc.metadata.canvas_section,
        stage: doc.metadata.venture_stage,
        impactArea: doc.metadata.primary_impact_area,
        score: doc.score,
      })),
      context,
      filtersApplied: {
        contentType: intentType !== 'general' ? intentType : undefined,
        section: targetSection,
      },
      resultCount: documents.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.startsWith('Invalid input')) {
      return { error: message, code: 'VALIDATION_ERROR' };
    }
    return { error: `Search failed: ${message}`, code: 'SEARCH_ERROR' };
  }
}

/**
 * Execute the get_venture_profile tool
 */
export async function handleGetVentureProfile(
  _input: unknown,
  ctx: ToolContext
): Promise<VentureProfileResult | ToolError> {
  try {
    const profile = await ctx.canvasStub.getVentureProfile();
    const readyForFiltering = await ctx.canvasStub.getDimensionsForFiltering();

    return {
      dimensions: profile.dimensions,
      confidence: profile.confidence,
      confirmed: profile.confirmed,
      readyForFiltering,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { error: `Failed to get venture profile: ${message}`, code: 'PROFILE_ERROR' };
  }
}

// ============================================
// Tool Dispatcher
// ============================================

/**
 * Dispatch a tool call to the appropriate handler
 */
export async function executeKnowledgeTool(
  toolName: string,
  input: unknown,
  ctx: ToolContext
): Promise<SearchResult | VentureProfileResult | ToolError> {
  switch (toolName) {
    case 'search_methodology':
      return handleSearchMethodology(input, ctx);

    case 'search_examples':
      return handleSearchExamples(input, ctx);

    case 'search_knowledge_base':
      return handleSearchKnowledgeBase(input, ctx);

    case 'get_venture_profile':
      return handleGetVentureProfile(input, ctx);

    default:
      return { error: `Unknown tool: ${toolName}`, code: 'UNKNOWN_TOOL' };
  }
}

/**
 * Check if a tool name is a knowledge tool
 */
export function isKnowledgeTool(toolName: string): boolean {
  return ['search_methodology', 'search_examples', 'search_knowledge_base', 'get_venture_profile'].includes(toolName);
}

/**
 * Type guard to check if a result is an error
 */
export function isToolError(result: SearchResult | VentureProfileResult | ToolError): result is ToolError {
  return 'error' in result && 'code' in result;
}

/**
 * Get all knowledge tool definitions
 */
export function getKnowledgeTools(): Tool[] {
  return knowledgeTools;
}
