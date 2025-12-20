/**
 * Canvas-related type definitions
 *
 * The Social Lean Canvas has 11 sections worked through sequentially.
 * Sections are grouped into 3 conceptual Models for organization.
 *
 * Storage:
 * - Sections 1-10: Stored in canvas_section table (simple string content)
 * - Section 11 (Impact): Stored in impact_model table (8-field causality chain)
 *
 * The Impact Model's final 'impact' field IS section 11's content - they stay in sync.
 */

/**
 * The 11 canvas sections in curriculum order
 */
export type CanvasSectionId =
  | 'purpose'              // 1 - standalone
  | 'customerSegments'     // 2 - Customer Model
  | 'problem'              // 3 - Customer Model
  | 'uniqueValueProposition' // 4 - Customer Model
  | 'solution'             // 5 - Customer Model
  | 'channels'             // 6 - Economic Model
  | 'revenue'              // 7 - Economic Model
  | 'costStructure'        // 8 - Economic Model
  | 'keyMetrics'           // 9 - standalone
  | 'unfairAdvantage'      // 10 - Economic Model
  | 'impact';              // 11 - Impact Model (nested)

/**
 * Section order for curriculum progression (1-11)
 */
export const CANVAS_SECTION_ORDER: CanvasSectionId[] = [
  'purpose',
  'customerSegments',
  'problem',
  'uniqueValueProposition',
  'solution',
  'channels',
  'revenue',
  'costStructure',
  'keyMetrics',
  'unfairAdvantage',
  'impact',
];

/**
 * Section number (1-11) for curriculum tracking
 */
export const CANVAS_SECTION_NUMBER: Record<CanvasSectionId, number> = {
  purpose: 1,
  customerSegments: 2,
  problem: 3,
  uniqueValueProposition: 4,
  solution: 5,
  channels: 6,
  revenue: 7,
  costStructure: 8,
  keyMetrics: 9,
  unfairAdvantage: 10,
  impact: 11,
};

/**
 * Human-readable labels for canvas sections
 */
export const CANVAS_SECTION_LABELS: Record<CanvasSectionId, string> = {
  purpose: 'Purpose',
  customerSegments: 'Customer Segments',
  problem: 'Problem',
  uniqueValueProposition: 'Unique Value Proposition',
  solution: 'Solution',
  channels: 'Channels',
  revenue: 'Revenue',
  costStructure: 'Cost Structure',
  keyMetrics: 'Key Metrics',
  unfairAdvantage: 'Unfair Advantage',
  impact: 'Impact',
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
  customerSegments: 'customer',
  problem: 'customer',
  uniqueValueProposition: 'customer',
  solution: 'customer',
  channels: 'economic',
  revenue: 'economic',
  costStructure: 'economic',
  keyMetrics: null,        // Standalone (cross-model metrics)
  unfairAdvantage: 'economic',
  impact: 'impact',
};

export const MODEL_SECTIONS: Record<Model, CanvasSectionId[]> = {
  customer: ['customerSegments', 'problem', 'uniqueValueProposition', 'solution'],
  economic: ['channels', 'revenue', 'costStructure', 'unfairAdvantage'],
  impact: ['impact'],
};

/**
 * A single canvas section (sections 1-10)
 *
 * Note: Section 11 (impact) is stored as ImpactModel, not CanvasSection.
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
 * Impact Model - causality chain that IS section 11
 *
 * The Impact Model is unique among the 3 models because:
 * 1. It contains only aspects of impact which compose a complete whole
 * 2. It does not span multiple sections - it maps 1:1 with section 11
 * 3. It nests entirely within the canvas's impact section
 *
 * The 'impact' field (final field) IS section 11's content.
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

  /** Direct deliverables (products, services, events) */
  outputs: string;

  /** Short-term changes (0-1 year): awareness, skills, access */
  shortTermOutcomes: string;

  /** Medium-term changes (1-3 years): behavior, practice, decisions */
  mediumTermOutcomes: string;

  /** Long-term changes (3+ years): sustained improvements, systemic shifts */
  longTermOutcomes: string;

  /**
   * Ultimate social/environmental change
   * THIS IS SECTION 11's CONTENT - they stay in sync
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
  'outputs',
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
  outputs: 'Outputs',
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

  /** Sections 1-10 (simple string content) */
  sections: CanvasSection[];

  /** Section 11 (full causality chain) */
  impactModel: ImpactModel;

  /** User's curriculum progress (1-11), null if not started */
  currentSection: number | null;

  /** Percentage of sections marked complete */
  completionPercentage: number;

  createdAt: string;
  updatedAt: string;
}

/**
 * Create empty sections for a new session (sections 1-10, excludes impact)
 */
export function createEmptySections(sessionId: string): CanvasSection[] {
  const now = new Date().toISOString();
  return CANVAS_SECTION_ORDER
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
 * Create empty Impact Model for a new session (section 11)
 */
export function createEmptyImpactModel(sessionId: string): ImpactModel {
  const now = new Date().toISOString();
  return {
    sessionId,
    issue: '',
    participants: '',
    activities: '',
    outputs: '',
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
 * Get section number from section key
 */
export function getSectionNumber(sectionKey: CanvasSectionId): number {
  return CANVAS_SECTION_NUMBER[sectionKey];
}

/**
 * Get section key from section number
 */
export function getSectionKey(sectionNumber: number): CanvasSectionId | null {
  const entry = Object.entries(CANVAS_SECTION_NUMBER).find(
    ([, num]) => num === sectionNumber
  );
  return entry ? (entry[0] as CanvasSectionId) : null;
}

/**
 * Check if a section belongs to a specific model
 */
export function isInModel(sectionKey: CanvasSectionId, model: Model): boolean {
  return SECTION_TO_MODEL[sectionKey] === model;
}
