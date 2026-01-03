/**
 * Canvas-related type definitions
 *
 * The Social Lean Canvas has 11 sections organized into 3 conceptual models.
 * Programs define how users progress through sections - order is program-dependent.
 *
 * Storage:
 * - Standard sections: Stored in canvas_section table (simple string content)
 * - Impact section: Stored in impact_model table (7-field causality chain)
 *
 * The Impact Model's final 'impact' field IS the impact section's content - they stay in sync.
 */

/**
 * The 11 canvas sections (semantic names, not numbered)
 */
export type CanvasSectionId =
  | 'purpose'           // standalone
  | 'customers'         // Customer Model
  | 'jobsToBeDone'      // Customer Model
  | 'valueProposition'  // Customer Model
  | 'solution'          // Customer Model
  | 'channels'          // Economic Model
  | 'revenue'           // Economic Model
  | 'costs'             // Economic Model
  | 'keyMetrics'        // standalone
  | 'advantage'         // Economic Model
  | 'impact';           // Impact Model (nested)

/**
 * All section keys for iteration
 */
export const CANVAS_SECTIONS: CanvasSectionId[] = [
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
];

/**
 * Human-readable labels for canvas sections
 */
export const CANVAS_SECTION_LABELS: Record<CanvasSectionId, string> = {
  purpose: 'Purpose',
  customers: 'Customers',
  jobsToBeDone: 'Jobs To Be Done',
  valueProposition: 'Value Proposition',
  solution: 'Solution',
  channels: 'Channels',
  revenue: 'Revenue',
  costs: 'Costs',
  keyMetrics: 'Key Metrics',
  advantage: 'Advantage',
  impact: 'Impact',
};

/**
 * Section numbers for display in the canvas UI
 */
export const CANVAS_SECTION_NUMBER: Record<CanvasSectionId, number> = {
  purpose: 1,
  customers: 2,
  jobsToBeDone: 3,
  valueProposition: 4,
  solution: 5,
  channels: 6,
  revenue: 7,
  costs: 8,
  keyMetrics: 9,
  advantage: 10,
  impact: 11,
};

/**
 * Model groupings (for retrieval/filtering, not storage)
 *
 * Models are conceptual lenses that group related sections:
 * - Customer Model: How the venture creates value for customers
 * - Economic Model: How value translates to financial sustainability
 * - Impact Model: How the venture creates social/environmental change
 */
export type Model = 'customer' | 'economic' | 'impact';

export const SECTION_TO_MODEL: Record<CanvasSectionId, Model | null> = {
  purpose: null,           // Standalone
  customers: 'customer',
  jobsToBeDone: 'customer',
  valueProposition: 'customer',
  solution: 'customer',
  channels: 'economic',
  revenue: 'economic',
  costs: 'economic',
  keyMetrics: null,        // Standalone (cross-model metrics)
  advantage: 'economic',
  impact: 'impact',
};

export const MODEL_SECTIONS: Record<Model, CanvasSectionId[]> = {
  customer: ['customers', 'jobsToBeDone', 'valueProposition', 'solution'],
  economic: ['channels', 'revenue', 'costs', 'advantage'],
  impact: ['impact'],
};

/**
 * A single canvas section (all except impact)
 *
 * Note: Impact section is stored as ImpactModel, not CanvasSection.
 * Code that writes to DB should route 'impact' to the impact_model table.
 */
export interface CanvasSection {
  sessionId: string;
  sectionKey: CanvasSectionId;
  content: string;
  isComplete: boolean;
  updatedAt: string;
}

/**
 * Impact Model - causality chain that IS the impact section
 *
 * The Impact Model is unique among the 3 models because:
 * 1. It contains only aspects of impact which compose a complete whole
 * 2. It does not span multiple sections - it maps 1:1 with the impact section
 * 3. It nests entirely within the canvas's impact section
 *
 * The 'impact' field (final field) IS the impact section's content.
 * They are the same data and stay in sync.
 */
export interface ImpactModel {
  sessionId: string;

  /** The social/environmental issue being addressed (aka "Situation") */
  issue: string;

  /** Who experiences the issue / stakeholders involved */
  participants: string;

  /** What the venture does (interventions/programs) */
  activities: string;

  /** Short-term changes (0-1 year): awareness, skills, access */
  shortTermOutcomes: string;

  /** Medium-term changes (1-3 years): behavior, practice, decisions */
  mediumTermOutcomes: string;

  /** Long-term changes (3+ years): sustained improvements, systemic shifts */
  longTermOutcomes: string;

  /**
   * Ultimate social/environmental change
   * THIS IS THE IMPACT SECTION'S CONTENT - they stay in sync
   */
  impact: string;

  isComplete: boolean;
  updatedAt: string;
}

/**
 * Impact Model field names for iteration
 */
export const IMPACT_MODEL_FIELDS = [
  'issue',
  'participants',
  'activities',
  'shortTermOutcomes',
  'mediumTermOutcomes',
  'longTermOutcomes',
  'impact',
] as const;

export type ImpactModelField = (typeof IMPACT_MODEL_FIELDS)[number];

/**
 * Human-readable labels for Impact Model fields
 */
export const IMPACT_MODEL_LABELS: Record<ImpactModelField, string> = {
  issue: 'Issue',
  participants: 'Participants',
  activities: 'Activities',
  shortTermOutcomes: 'Short-term Outcomes',
  mediumTermOutcomes: 'Medium-term Outcomes',
  longTermOutcomes: 'Long-term Outcomes',
  impact: 'Impact',
};

/**
 * Full canvas state returned by API
 */
export interface CanvasState {
  sessionId: string;

  /** All sections except impact (simple string content) */
  sections: CanvasSection[];

  /** Impact section (full causality chain) */
  impactModel: ImpactModel;

  /** User's current section (by key), null if not started */
  currentSection: CanvasSectionId | null;

  /** Percentage of sections marked complete */
  completionPercentage: number;

  createdAt: string;
  updatedAt: string;
}

/**
 * Create empty sections for a new session (excludes impact)
 */
export function createEmptySections(sessionId: string): CanvasSection[] {
  const now = new Date().toISOString();
  return CANVAS_SECTIONS
    .filter((id) => id !== 'impact')
    .map((sectionKey) => ({
      sessionId,
      sectionKey,
      content: '',
      isComplete: false,
      updatedAt: now,
    }));
}

/**
 * Create empty Impact Model for a new session
 */
export function createEmptyImpactModel(sessionId: string): ImpactModel {
  const now = new Date().toISOString();
  return {
    sessionId,
    issue: '',
    participants: '',
    activities: '',
    shortTermOutcomes: '',
    mediumTermOutcomes: '',
    longTermOutcomes: '',
    impact: '',
    isComplete: false,
    updatedAt: now,
  };
}

/**
 * Calculate completion percentage from sections and impact model
 */
export function calculateCompletion(
  sections: CanvasSection[],
  impactModel: ImpactModel
): number {
  const sectionComplete = sections.filter((s) => s.isComplete).length;
  const impactComplete = impactModel.isComplete ? 1 : 0;
  const total = sections.length + 1; // 10 sections + 1 impact model = 11
  return Math.round(((sectionComplete + impactComplete) / total) * 100);
}

/**
 * Check if a section belongs to a specific model
 */
export function isInModel(sectionKey: CanvasSectionId, model: Model): boolean {
  return SECTION_TO_MODEL[sectionKey] === model;
}
