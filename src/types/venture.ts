/**
 * Venture-related type definitions
 *
 * These types define the structure for venture profiles and dimensions
 * used throughout the application.
 */

/**
 * The 7 venture dimensions used for Selection Matrix filtering
 */
export interface VentureDimensions {
  /** Current stage: ideation | validation | efficiency | scale */
  ventureStage: string | null;

  /** Impact areas from taxonomy (e.g., environment, health, education) */
  impactAreas: string[];

  /** Impact mechanisms (e.g., behavior-change, market-transformation) */
  impactMechanisms: string[];

  /** Legal structure: nonprofit | for-profit | hybrid | cooperative */
  legalStructure: string | null;

  /** Revenue sources from taxonomy */
  revenueSources: string[];

  /** Funding sources from taxonomy */
  fundingSources: string[];

  /** Industry verticals from taxonomy */
  industries: string[];
}

/**
 * Confidence scores for each dimension (0-1)
 */
export interface DimensionConfidence {
  ventureStage: number;
  impactAreas: number;
  impactMechanisms: number;
  legalStructure: number;
  revenueSources: number;
  fundingSources: number;
  industries: number;
}

/**
 * Tracks which dimensions have been explicitly confirmed by the user
 */
export interface DimensionConfirmed {
  ventureStage: boolean;
  impactAreas: boolean;
  impactMechanisms: boolean;
  legalStructure: boolean;
  revenueSources: boolean;
  fundingSources: boolean;
  industries: boolean;
}

/**
 * Full venture profile with dimensions, confidence, and confirmation status
 */
export interface VentureProfile {
  id: string;
  sessionId: string;
  dimensions: VentureDimensions;
  confidence: DimensionConfidence;
  confirmed: DimensionConfirmed;
  createdAt: string;
  updatedAt: string;
}

/**
 * Default empty venture dimensions
 */
export function createEmptyDimensions(): VentureDimensions {
  return {
    ventureStage: null,
    impactAreas: [],
    impactMechanisms: [],
    legalStructure: null,
    revenueSources: [],
    fundingSources: [],
    industries: [],
  };
}

/**
 * Default zero confidence scores
 */
export function createEmptyConfidence(): DimensionConfidence {
  return {
    ventureStage: 0,
    impactAreas: 0,
    impactMechanisms: 0,
    legalStructure: 0,
    revenueSources: 0,
    fundingSources: 0,
    industries: 0,
  };
}

/**
 * Default unconfirmed status
 */
export function createEmptyConfirmed(): DimensionConfirmed {
  return {
    ventureStage: false,
    impactAreas: false,
    impactMechanisms: false,
    legalStructure: false,
    revenueSources: false,
    fundingSources: false,
    industries: false,
  };
}
