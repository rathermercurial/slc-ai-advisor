/**
 * Canvas-related type definitions
 *
 * These types define the structure for the Social Lean Canvas sections
 * and Impact Model.
 */

/**
 * The 10 business model sections of the Social Lean Canvas
 */
export type CanvasSectionId =
  | 'problem'
  | 'solution'
  | 'unique-value'
  | 'unfair-advantage'
  | 'beneficiaries'
  | 'channels'
  | 'key-metrics'
  | 'cost-structure'
  | 'revenue-streams'
  | 'impact';

/**
 * A single canvas section with content and metadata
 */
export interface CanvasSection {
  id: CanvasSectionId;
  sessionId: string;
  content: string;
  isComplete: boolean;
  updatedAt: string;
}

/**
 * The 8-field Impact Model (causality chain)
 */
export interface ImpactModel {
  id: string;
  sessionId: string;

  /** The social/environmental issue being addressed */
  issue: string;

  /** Who experiences the issue */
  participants: string;

  /** What the venture does */
  activities: string;

  /** Direct deliverables */
  outputs: string;

  /** Short-term changes for participants */
  shortTermOutcomes: string;

  /** Medium-term changes */
  mediumTermOutcomes: string;

  /** Long-term changes */
  longTermOutcomes: string;

  /** Ultimate systemic change */
  impact: string;

  updatedAt: string;
}

/**
 * Full canvas state including all sections and impact model
 */
export interface CanvasState {
  sessionId: string;
  sections: CanvasSection[];
  impactModel: ImpactModel | null;
  completionPercentage: number;
}

/**
 * All canvas section IDs in display order
 */
export const CANVAS_SECTION_IDS: CanvasSectionId[] = [
  'problem',
  'solution',
  'unique-value',
  'unfair-advantage',
  'beneficiaries',
  'channels',
  'key-metrics',
  'cost-structure',
  'revenue-streams',
  'impact',
];

/**
 * Human-readable labels for canvas sections
 */
export const CANVAS_SECTION_LABELS: Record<CanvasSectionId, string> = {
  problem: 'Problem',
  solution: 'Solution',
  'unique-value': 'Unique Value Proposition',
  'unfair-advantage': 'Unfair Advantage',
  beneficiaries: 'Beneficiaries',
  channels: 'Channels',
  'key-metrics': 'Key Metrics',
  'cost-structure': 'Cost Structure',
  'revenue-streams': 'Revenue Streams',
  impact: 'Impact',
};

/**
 * Create empty canvas sections for a new session
 */
export function createEmptySections(sessionId: string): CanvasSection[] {
  const now = new Date().toISOString();
  return CANVAS_SECTION_IDS.map((id) => ({
    id,
    sessionId,
    content: '',
    isComplete: false,
    updatedAt: now,
  }));
}

/**
 * Create empty impact model for a new session
 */
export function createEmptyImpactModel(sessionId: string): ImpactModel {
  return {
    id: crypto.randomUUID(),
    sessionId,
    issue: '',
    participants: '',
    activities: '',
    outputs: '',
    shortTermOutcomes: '',
    mediumTermOutcomes: '',
    longTermOutcomes: '',
    impact: '',
    updatedAt: new Date().toISOString(),
  };
}
