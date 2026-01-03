/**
 * Model Manager Interface
 *
 * Common interface for all Model Managers (Customer, Economic, Impact).
 * Encapsulates business logic for validation, completion tracking, and export.
 *
 * Works for:
 * - TypeScript class operating on shared SQLite (MVP)
 * - Durable Object with its own storage (future architecture)
 */

/**
 * Data structure for a model's sections
 */
export type ModelData = Record<string, string>;

/**
 * Result of a section update operation
 */
export interface UpdateResult {
  /** Whether the update succeeded */
  success: boolean;

  /** Error messages if update failed */
  errors?: string[];

  /** The section that was updated (if successful) */
  updatedSection?: string;

  /** Current completion state after update */
  completion: ModelCompletion;

  /** Other fields affected by this update (for sync operations) */
  affectedFields?: string[];
}

/**
 * Model completion tracking
 */
export interface ModelCompletion {
  /** Completion percentage (0-100) */
  percentage: number;

  /** Sections that have content meeting minimum requirements */
  completedSections: string[];

  /** Sections that still need content */
  missingSections: string[];

  /** Suggested next steps for the user */
  suggestions: string[];
}

/**
 * Result of model validation
 */
export interface ValidationResult {
  /** Whether the model passes all validation rules */
  valid: boolean;

  /** Blocking validation errors */
  errors: ValidationError[];

  /** Non-blocking warnings */
  warnings: ValidationWarning[];
}

/**
 * A validation error that blocks completion
 */
export interface ValidationError {
  /** The section with the error */
  section: string;

  /** Human-readable error message */
  message: string;
}

/**
 * A validation warning (non-blocking)
 */
export interface ValidationWarning {
  /** The section with the warning */
  section: string;

  /** Human-readable warning message */
  message: string;
}

/**
 * Configuration for section validation rules
 */
export interface SectionRule {
  /** Whether this section is required for model completion */
  required: boolean;

  /** Minimum content length in characters */
  minLength: number;

  /** Sections that must be completed before this one */
  dependsOn: string[];

  /** Prompts to help user complete this section */
  prompts: string[];
}

/**
 * Common interface for all Model Managers
 * @template T - The specific model data type
 */
export interface IModelManager<T extends ModelData = ModelData> {
  /**
   * Get all sections/fields for this model
   */
  getModel(): T;

  /**
   * Update a section's content
   *
   * @param section - The section key to update
   * @param content - The new content
   * @returns Result including success status and updated completion
   */
  updateSection(section: string, content: string): UpdateResult;

  /**
   * Validate the model against all rules
   *
   * @returns Validation result with errors and warnings
   */
  validate(): ValidationResult;

  /**
   * Get current completion status
   *
   * @returns Completion info with percentage and suggestions
   */
  getCompletion(): ModelCompletion;

  /**
   * Export the model in specified format
   *
   * @param format - Output format ('json' or 'md')
   * @returns Formatted string representation
   */
  export(format: 'json' | 'md'): string;
}

/**
 * Customer Model section keys
 */
export type CustomerSectionId = 'customers' | 'jobsToBeDone' | 'valueProposition' | 'solution';

/**
 * Economic Model section keys
 */
export type EconomicSectionId = 'channels' | 'revenue' | 'costs' | 'advantage';

/**
 * Customer Model data structure
 */
export interface CustomerModelData extends ModelData {
  customers: string;
  jobsToBeDone: string;
  valueProposition: string;
  solution: string;
}

/**
 * Economic Model data structure
 */
export interface EconomicModelData extends ModelData {
  channels: string;
  revenue: string;
  costs: string;
  advantage: string;
}

/**
 * Impact Model data structure (7-field causality chain)
 */
export interface ImpactModelData extends ModelData {
  issue: string;
  participants: string;
  activities: string;
  shortTermOutcomes: string;
  mediumTermOutcomes: string;
  longTermOutcomes: string;
  impact: string;
}
