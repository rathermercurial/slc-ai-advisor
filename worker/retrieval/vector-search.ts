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
import type { VentureDimensions } from '../../src/types/venture';

/**
 * Represents the user's query intent
 */
export interface QueryIntent {
  /** Type of content being sought */
  type: 'methodology' | 'examples' | 'general';
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
    primary_impact_area?: string;
    primary_industry?: string;
    program?: string;
    [key: string]: unknown;
  };
}

/**
 * Build Vectorize query options with Selection Matrix filters
 */
export function buildVectorizeQuery(
  program: string,
  dimensions: Partial<VentureDimensions>,
  intent: QueryIntent
): {
  topK: number;
  returnMetadata: 'all' | 'indexed' | 'none';
  namespace?: string;
  filter?: Record<string, unknown>;
} {
  const filter: Record<string, unknown> = {};

  // Content type filter based on intent
  if (intent.type === 'examples') {
    filter.content_type = 'canvas-example';
  } else if (intent.type === 'methodology') {
    filter.content_type = 'methodology';
  }

  // Section-specific filter (most specific)
  if (intent.targetSection) {
    filter.canvas_section = intent.targetSection;
  }
  // Model grouping filter (broader context)
  else if (intent.targetModel) {
    filter.venture_model = intent.targetModel;
  }

  // Venture dimension filters (from profile, not canvas content)
  if (dimensions.ventureStage) {
    filter.venture_stage = dimensions.ventureStage;
  }

  // For arrays, use $in operator if Vectorize supports it
  // For Demo, we'll use the first value if present
  if (dimensions.impactAreas && dimensions.impactAreas.length > 0) {
    filter.primary_impact_area = dimensions.impactAreas[0];
  }

  if (dimensions.industries && dimensions.industries.length > 0) {
    filter.primary_industry = dimensions.industries[0];
  }

  return {
    topK: 5,
    returnMetadata: 'all',
    namespace: program,
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
  dimensions: Partial<VentureDimensions>,
  intent: QueryIntent
): Promise<RetrievedDocument[]> {
  // Check if required bindings are available
  if (!env.AI || !env.VECTORIZE) {
    console.warn('AI or VECTORIZE bindings not available, skipping RAG');
    return [];
  }

  let vector: number[];

  // Step 1: Generate embedding
  try {
    const embeddingResult = await env.AI.run('@cf/baai/bge-m3', {
      text: [query],
    });

    vector = embeddingResult.data[0];
    if (!vector || !Array.isArray(vector)) {
      console.error('Invalid embedding result:', embeddingResult);
      return [];
    }
  } catch (error) {
    console.warn('Embedding generation failed:', error);
    return [];
  }

  // Step 2: Query Vectorize
  try {
    const options = buildVectorizeQuery(program, dimensions, intent);
    const results = await env.VECTORIZE.query(vector, options);

    if (!results.matches || results.matches.length === 0) {
      // Try without dimension filters
      const fallbackOptions = buildVectorizeQuery(program, {}, intent);
      const fallbackResults = await env.VECTORIZE.query(vector, fallbackOptions);

      if (!fallbackResults.matches) {
        return [];
      }

      return fallbackResults.matches.map(formatMatch);
    }

    return results.matches.map(formatMatch);
  } catch (error) {
    console.warn('Vectorize query failed (index may not exist):', error);
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
      primary_impact_area: match.metadata?.primary_impact_area as string,
      primary_industry: match.metadata?.primary_industry as string,
      program: match.metadata?.program as string,
    },
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
    if (type === 'canvas-example') {
      header += ` (Example${stage ? `, ${stage} stage` : ''})`;
    } else if (type === 'methodology') {
      header += ` (Methodology${section ? `, ${section}` : ''})`;
    }

    return `${header}\n${doc.content}`;
  });

  return contextParts.join('\n\n---\n\n');
}
