/**
 * Vectorize Search with Selection Matrix Filtering
 *
 * The Selection Matrix uses venture dimensions AND model/section context:
 * - Venture Dimensions (from profile) → Filter by stage, impact area, industry
 * - Target Model (from query intent) → Filter examples by model grouping
 * - Target Section (from query intent) → Filter methodology by section
 *
 * Demo Filtering Strategy (3 stages):
 * 1. Program Filter (namespace) - Strict filter on user's program
 * 2. Model/Section Filter (metadata) - Filter by conceptual grouping OR section
 * 3. Semantic Search - Natural language similarity within filtered results
 */

import type { CanvasSectionId, Model } from '../../src/types/canvas';
import type { VentureProperties } from '../../src/types/venture';
import { createLogger, createMetrics } from '../observability';

/**
 * Represents the user's query intent
 */
export interface QueryIntent {
  /** Type of content being sought */
  type: 'methodology' | 'examples' | 'reference' | 'general';
  /** Specific section user is working on (most specific filter) */
  targetSection?: CanvasSectionId;
  /** Conceptual grouping for broader context */
  targetModel?: Model;
}

/**
 * Retrieved document from Vectorize
 */
export interface RetrievedDocument {
  id: string;
  score: number;
  content: string;
  metadata: {
    title?: string;
    content_type?: string;
    canvas_section?: string;
    venture_model?: string;
    venture_stage?: string;
    tags?: string;
    [key: string]: unknown;
  };
}

/**
 * Build range filter for prefix matching on tags field
 */
function buildTagRangeFilter(tag: string): { $gte: string; $lte: string } {
  return { $gte: tag, $lte: tag + '\uffff' };
}

/**
 * Build Vectorize query options with Selection Matrix filters
 *
 * Uses namespace for program filtering (not metadata field).
 * Uses range queries for tag-based filtering.
 */
export function buildVectorizeQuery(
  program: string,
  properties: Partial<VentureProperties>,
  intent: QueryIntent
): {
  topK: number;
  returnMetadata: 'all' | 'indexed' | 'none';
  namespace?: string;
  filter?: Record<string, unknown>;
} {
  const filter: Record<string, unknown> = {};

  // Content type filter based on intent
  // Note: indexed as 'example' not 'canvas-example'
  if (intent.type === 'examples') {
    filter.content_type = 'example';
  } else if (intent.type === 'methodology') {
    filter.content_type = 'methodology';
  } else if (intent.type === 'reference') {
    filter.content_type = 'reference';
  }

  // Section-specific filter (most specific)
  if (intent.targetSection) {
    filter.canvas_section = intent.targetSection;
  }
  // Model grouping filter (broader context)
  else if (intent.targetModel) {
    filter.venture_model = intent.targetModel;
  }

  // Venture property filters
  // Stage is the only dimension - exact match
  if (properties.ventureStage) {
    filter.venture_stage = properties.ventureStage;
  }

  // Range query for tags field (prefix matching)
  // Note: Only one range filter per query - prioritize by specificity
  // Order: impactAreas > industries > others
  if (properties.impactAreas && properties.impactAreas.length > 0) {
    filter.tags = buildTagRangeFilter(properties.impactAreas[0]);
  } else if (properties.industries && properties.industries.length > 0) {
    filter.tags = buildTagRangeFilter(properties.industries[0]);
  }

  // Use namespace for program filtering (not metadata field)
  // "generic" is the default namespace
  const namespace = program && program !== 'generic' ? program : undefined;

  return {
    topK: 5,
    returnMetadata: 'all',
    namespace,
    filter: Object.keys(filter).length > 0 ? filter : undefined,
  };
}

/**
 * Parse query intent from user message
 * Demo implementation - can be enhanced with LLM in B6
 */
export function parseQueryIntent(message: string): QueryIntent {
  const lower = message.toLowerCase();

  // Check for example requests
  const exampleKeywords = ['example', 'show me', 'case study', 'how did', 'ventures like'];
  const isExampleRequest = exampleKeywords.some((kw) => lower.includes(kw));

  // Check for methodology questions
  const methodologyKeywords = ['how do i', 'how to', 'what is', 'explain', 'help me understand'];
  const isMethodologyRequest = methodologyKeywords.some((kw) => lower.includes(kw));

  // Detect target section from message
  const sectionKeywords: Record<CanvasSectionId, string[]> = {
    purpose: ['purpose', 'mission', 'why'],
    customers: ['customer', 'target audience', 'who'],
    jobsToBeDone: ['job', 'jobs to be done', 'jtbd', 'task', 'problem'],
    valueProposition: ['value proposition', 'uvp', 'unique value', 'why choose'],
    solution: ['solution', 'product', 'service', 'offering'],
    channels: ['channel', 'distribution', 'reach', 'marketing'],
    revenue: ['revenue', 'pricing', 'monetization', 'income', 'business model'],
    costs: ['cost', 'expense', 'budget', 'overhead'],
    keyMetrics: ['metric', 'kpi', 'measure', 'track', 'success'],
    advantage: ['advantage', 'moat', 'competitive', 'differentiation'],
    impact: ['impact', 'outcome', 'change', 'social', 'environmental'],
  };

  let targetSection: CanvasSectionId | undefined;
  for (const [section, keywords] of Object.entries(sectionKeywords)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      targetSection = section as CanvasSectionId;
      break;
    }
  }

  // Detect target model from section or keywords
  let targetModel: Model | undefined;
  if (targetSection) {
    const sectionToModel: Record<CanvasSectionId, Model | undefined> = {
      purpose: undefined,
      customers: 'customer',
      jobsToBeDone: 'customer',
      valueProposition: 'customer',
      solution: 'customer',
      channels: 'economic',
      revenue: 'economic',
      costs: 'economic',
      keyMetrics: undefined,
      advantage: 'economic',
      impact: 'impact',
    };
    targetModel = sectionToModel[targetSection];
  }

  // Model keywords
  if (!targetModel) {
    if (lower.includes('customer model')) targetModel = 'customer';
    else if (lower.includes('economic model') || lower.includes('business model')) targetModel = 'economic';
    else if (lower.includes('impact model') || lower.includes('theory of change')) targetModel = 'impact';
  }

  return {
    type: isExampleRequest ? 'examples' : isMethodologyRequest ? 'methodology' : 'general',
    targetSection,
    targetModel,
  };
}

/**
 * Search the knowledge base with Selection Matrix filtering
 */
export async function searchKnowledgeBase(
  env: Env,
  query: string,
  program: string,
  properties: Partial<VentureProperties>,
  intent: QueryIntent,
  sessionId?: string
): Promise<RetrievedDocument[]> {
  const logger = createLogger('vector-search', sessionId);
  const metrics = createMetrics(env.SLC_ANALYTICS);
  const queryTimer = logger.startTimer('rag-query');

  // Check if required bindings are available
  if (!env.AI || !env.VECTORIZE) {
    logger.warn('AI or VECTORIZE bindings not available, skipping RAG');
    return [];
  }

  let vector: number[];

  // Step 1: Generate embedding
  const embeddingTimer = logger.startTimer('embedding-generation');
  try {
    const embeddingResult = await env.AI.run('@cf/baai/bge-m3', {
      text: [query],
    });

    vector = embeddingResult.data[0];
    if (!vector || !Array.isArray(vector)) {
      embeddingTimer.end({ success: false });
      logger.error('Invalid embedding result', undefined, { result: typeof embeddingResult });
      return [];
    }
    embeddingTimer.end({ success: true });
  } catch (error) {
    embeddingTimer.end({ success: false });
    logger.warn('Embedding generation failed', { error: String(error) });
    metrics.trackEvent('rag_query', { sessionId, success: false, resultCount: 0 });
    return [];
  }

  // Step 2: Query Vectorize
  const vectorizeTimer = logger.startTimer('vectorize-query');
  try {
    const options = buildVectorizeQuery(program, properties, intent);
    const results = await env.VECTORIZE.query(vector, options);

    if (!results.matches || results.matches.length === 0) {
      vectorizeTimer.end({ resultCount: 0, usedFallback: true });

      // Try without property filters (fallback)
      const fallbackTimer = logger.startTimer('vectorize-fallback');
      const fallbackOptions = buildVectorizeQuery(program, {}, intent);
      const fallbackResults = await env.VECTORIZE.query(vector, fallbackOptions);
      const fallbackCount = fallbackResults.matches?.length || 0;
      fallbackTimer.end({ resultCount: fallbackCount });

      const totalDuration = queryTimer.end({ resultCount: fallbackCount, usedFallback: true });
      metrics.trackEvent('rag_query', {
        sessionId,
        resultCount: fallbackCount,
        success: fallbackCount > 0,
        durationMs: totalDuration,
      });

      if (!fallbackResults.matches) {
        return [];
      }

      return fallbackResults.matches.map(formatMatch);
    }

    const resultCount = results.matches.length;
    vectorizeTimer.end({ resultCount, usedFallback: false });
    const totalDuration = queryTimer.end({ resultCount, usedFallback: false });
    metrics.trackEvent('rag_query', {
      sessionId,
      resultCount,
      success: true,
      durationMs: totalDuration,
    });

    return results.matches.map(formatMatch);
  } catch (error) {
    vectorizeTimer.end({ success: false });
    queryTimer.end({ success: false });
    logger.warn('Vectorize query failed (index may not exist)', { error: String(error) });
    metrics.trackEvent('rag_query', { sessionId, success: false, resultCount: 0 });
    return [];
  }
}

/**
 * Format Vectorize match to RetrievedDocument
 */
function formatMatch(match: VectorizeMatch): RetrievedDocument {
  return {
    id: match.id,
    score: match.score,
    content: (match.metadata?.content as string) || '',
    metadata: {
      title: match.metadata?.title as string,
      content_type: match.metadata?.content_type as string,
      canvas_section: match.metadata?.canvas_section as string,
      venture_model: match.metadata?.venture_model as string,
      venture_stage: match.metadata?.venture_stage as string,
      tags: match.metadata?.tags as string,
    },
  };
}

/**
 * Search options for tool-based queries
 * Simpler interface for AI tools that don't need full Selection Matrix
 */
export interface ToolSearchOptions {
  query: string;
  contentType?: 'methodology' | 'example' | 'reference';
  filters?: {
    stage?: string;
    impactArea?: string;
    mechanism?: string;
    legalStructure?: string;
    revenueSource?: string;
    fundingSource?: string;
    industry?: string;
  };
  limit?: number;
}

/**
 * Simplified search for AI tools
 * Wraps searchKnowledgeBase with a tool-friendly interface
 */
export async function searchForTools(
  env: Env,
  options: ToolSearchOptions,
  sessionId?: string
): Promise<{ results: Array<{ content: string; metadata: Record<string, unknown>; score: number }> }> {
  const { query, contentType, filters, limit = 5 } = options;

  // Map contentType to QueryIntent
  const intent: QueryIntent = {
    type: contentType === 'methodology' ? 'methodology'
      : contentType === 'example' ? 'examples'
      : contentType === 'reference' ? 'reference'
      : 'general',
  };

  // Map filters to VentureProperties
  const properties: Partial<VentureProperties> = {};
  if (filters) {
    if (filters.stage) properties.ventureStage = filters.stage;
    if (filters.impactArea) properties.impactAreas = [filters.impactArea];
    if (filters.industry) properties.industries = [filters.industry];
    // Note: mechanism, legalStructure, revenueSource, fundingSource
    // are mapped to their VentureProperties equivalents
    if (filters.mechanism) properties.impactMechanisms = [filters.mechanism];
    if (filters.legalStructure) properties.legalStructure = filters.legalStructure;
    if (filters.revenueSource) properties.revenueSources = [filters.revenueSource];
    if (filters.fundingSource) properties.fundingSources = [filters.fundingSource];
  }

  // Call the main search function
  const docs = await searchKnowledgeBase(
    env,
    query,
    'generic', // Default program for now
    properties,
    intent,
    sessionId
  );

  // Take only the requested limit
  const limitedDocs = docs.slice(0, limit);

  // Format for tool response
  return {
    results: limitedDocs.map((doc) => ({
      content: doc.content,
      metadata: doc.metadata,
      score: doc.score,
    })),
  };
}

/**
 * Build RAG context from retrieved documents
 */
export function buildRAGContext(documents: RetrievedDocument[]): string {
  if (documents.length === 0) {
    return '';
  }

  const contextParts = documents.map((doc, i) => {
    const title = doc.metadata.title || `Document ${i + 1}`;
    const type = doc.metadata.content_type || 'unknown';
    const section = doc.metadata.canvas_section || '';
    const stage = doc.metadata.venture_stage || '';

    let header = `[${title}]`;
    if (type === 'example') {
      header += ` (Example${stage ? `, ${stage} stage` : ''})`;
    } else if (type === 'methodology') {
      header += ` (Methodology${section ? `, ${section}` : ''})`;
    }

    return `${header}\n${doc.content}`;
  });

  return contextParts.join('\n\n---\n\n');
}
