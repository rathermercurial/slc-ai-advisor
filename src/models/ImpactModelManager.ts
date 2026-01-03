/**
 * Impact Model Manager
 *
 * Manages the 7-field causality chain of the Impact Model:
 * issue → participants → activities →
 * shortTermOutcomes → mediumTermOutcomes → longTermOutcomes → impact
 *
 * Key features:
 * - Strict chain order validation (can't skip ahead)
 * - Uses impact_model table (not canvas_section)
 * - The 'impact' field IS the impact section's content - they stay in sync
 */

import type {
  IModelManager,
  UpdateResult,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ModelCompletion,
  ImpactModelData,
} from './IModelManager';
import type { SqlStorage } from '../types/sql';
import {
  IMPACT_MODEL_FIELDS,
  IMPACT_MODEL_LABELS,
  type ImpactModelField,
} from '../types/canvas';

/**
 * Minimum content length for each field
 */
const MIN_FIELD_LENGTH = 10;

/**
 * Prompts for each field to help users complete them
 */
const FIELD_PROMPTS: Record<ImpactModelField, string[]> = {
  issue: [
    'What specific social or environmental problem are you addressing?',
    'What is the current situation that needs to change?',
    'Who is affected and how?',
  ],
  participants: [
    'Who are the key stakeholders affected by this issue?',
    'Who will participate in or benefit from your activities?',
    'What communities or groups are involved?',
  ],
  activities: [
    'What specific actions or interventions will you implement?',
    'What programs or services will you deliver?',
    'How will you engage participants?',
  ],
  shortTermOutcomes: [
    'What immediate changes will occur (0-1 year)?',
    'What awareness, knowledge, or skills will participants gain?',
    'What access or resources will improve?',
  ],
  mediumTermOutcomes: [
    'What changes will emerge over 1-3 years?',
    'What behavior or practice changes do you expect?',
    'What decisions or actions will participants take differently?',
  ],
  longTermOutcomes: [
    'What sustained changes happen over 3+ years?',
    'What systemic or structural shifts do you aim for?',
    'What lasting improvements will result?',
  ],
  impact: [
    'What is the ultimate state of change you seek?',
    'How will the world be different because of your work?',
    'What is your vision of success?',
  ],
};


/**
 * Impact Model Manager implementation
 */
export class ImpactModelManager implements IModelManager<ImpactModelData> {
  constructor(private sql: SqlStorage) {}

  /**
   * Get all fields for the Impact Model
   */
  getModel(): ImpactModelData {
    const row = this.sql
      .exec<{
        issue: string;
        participants: string;
        activities: string;
        short_term_outcomes: string;
        medium_term_outcomes: string;
        long_term_outcomes: string;
        impact: string;
      }>(`SELECT * FROM impact_model WHERE id = 'impact'`)
      .one();

    if (!row) {
      // Return empty model if not initialized
      return {
        issue: '',
        participants: '',
        activities: '',
        shortTermOutcomes: '',
        mediumTermOutcomes: '',
        longTermOutcomes: '',
        impact: '',
      };
    }

    return {
      issue: row.issue ?? '',
      participants: row.participants ?? '',
      activities: row.activities ?? '',
      shortTermOutcomes: row.short_term_outcomes ?? '',
      mediumTermOutcomes: row.medium_term_outcomes ?? '',
      longTermOutcomes: row.long_term_outcomes ?? '',
      impact: row.impact ?? '',
    };
  }

  /**
   * Update a field's content with chain order validation
   *
   * Note: Use this for Impact Model fields. The 'section' parameter
   * corresponds to field names like 'issue', 'participants', etc.
   */
  updateSection(section: string, content: string): UpdateResult {
    // Validate field name
    if (!IMPACT_MODEL_FIELDS.includes(section as ImpactModelField)) {
      return {
        success: false,
        errors: [
          `Invalid field: ${section}. Valid fields: ${IMPACT_MODEL_FIELDS.join(', ')}`,
        ],
        completion: this.getCompletion(),
      };
    }

    const field = section as ImpactModelField;

    // Check chain order - can't skip ahead
    const deps = this.getFieldDependencies(field);
    const model = this.getModel();

    for (const dep of deps) {
      const depContent = model[dep];
      if (!depContent || depContent.length < MIN_FIELD_LENGTH) {
        return {
          success: false,
          errors: [
            `Complete "${IMPACT_MODEL_LABELS[dep]}" before "${IMPACT_MODEL_LABELS[field]}" (chain of causality)`,
          ],
          completion: this.getCompletion(),
        };
      }
    }

    // Validate content length
    if (content.length < MIN_FIELD_LENGTH) {
      return {
        success: false,
        errors: [
          `"${IMPACT_MODEL_LABELS[field]}" needs more detail (minimum ${MIN_FIELD_LENGTH} characters)`,
        ],
        completion: this.getCompletion(),
      };
    }

    // Save to database using explicit column updates (no string interpolation)
    const now = new Date().toISOString();

    switch (field) {
      case 'issue':
        this.sql.exec(`UPDATE impact_model SET issue = ?, updated_at = ? WHERE id = 'impact'`, content, now);
        break;
      case 'participants':
        this.sql.exec(`UPDATE impact_model SET participants = ?, updated_at = ? WHERE id = 'impact'`, content, now);
        break;
      case 'activities':
        this.sql.exec(`UPDATE impact_model SET activities = ?, updated_at = ? WHERE id = 'impact'`, content, now);
        break;
      case 'shortTermOutcomes':
        this.sql.exec(`UPDATE impact_model SET short_term_outcomes = ?, updated_at = ? WHERE id = 'impact'`, content, now);
        break;
      case 'mediumTermOutcomes':
        this.sql.exec(`UPDATE impact_model SET medium_term_outcomes = ?, updated_at = ? WHERE id = 'impact'`, content, now);
        break;
      case 'longTermOutcomes':
        this.sql.exec(`UPDATE impact_model SET long_term_outcomes = ?, updated_at = ? WHERE id = 'impact'`, content, now);
        break;
      case 'impact':
        this.sql.exec(`UPDATE impact_model SET impact = ?, updated_at = ? WHERE id = 'impact'`, content, now);
        break;
    }

    // Calculate affected fields
    const affectedFields: string[] = [];

    // Note: The 'impact' field IS the impact section's content
    // CanvasDO handles any necessary sync, but we flag it here
    if (field === 'impact') {
      affectedFields.push('canvas.impact');
    }

    return {
      success: true,
      updatedSection: field,
      completion: this.getCompletion(),
      affectedFields,
    };
  }

  /**
   * Validate all fields in the model
   */
  validate(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const model = this.getModel();

    // Check each field in order
    let chainBroken = false;
    for (const field of IMPACT_MODEL_FIELDS) {
      const content = model[field];
      const hasContent = content && content.length >= MIN_FIELD_LENGTH;

      if (!hasContent) {
        if (!chainBroken) {
          // First missing field in chain
          errors.push({
            section: field,
            message: `"${IMPACT_MODEL_LABELS[field]}" is required to complete the causality chain`,
          });
          chainBroken = true;
        } else {
          // Subsequent missing fields are informational
          warnings.push({
            section: field,
            message: `"${IMPACT_MODEL_LABELS[field]}" will need to be completed`,
          });
        }
      } else if (chainBroken) {
        // Field is filled but chain was already broken - out of order
        warnings.push({
          section: field,
          message: `"${IMPACT_MODEL_LABELS[field]}" was completed out of order`,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get completion status for the Impact Model
   */
  getCompletion(): ModelCompletion {
    const model = this.getModel();

    const completedSections: string[] = [];
    const missingSections: string[] = [];

    // Check each field in chain order
    for (const field of IMPACT_MODEL_FIELDS) {
      const content = model[field];
      if (content && content.length >= MIN_FIELD_LENGTH) {
        completedSections.push(field);
      } else {
        missingSections.push(field);
      }
    }

    // Find the next field in the chain (first incomplete)
    const nextField = missingSections[0] as ImpactModelField | undefined;

    const suggestions: string[] = [];
    if (nextField) {
      suggestions.push(...FIELD_PROMPTS[nextField]);
    } else {
      suggestions.push(
        'Impact Model complete! Your theory of change is documented.'
      );
    }

    return {
      percentage: Math.round(
        (completedSections.length / IMPACT_MODEL_FIELDS.length) * 100
      ),
      completedSections,
      missingSections,
      suggestions,
    };
  }

  /**
   * Export the Impact Model in specified format
   */
  export(format: 'json' | 'md'): string {
    const model = this.getModel();

    if (format === 'json') {
      return JSON.stringify(model, null, 2);
    }

    // Markdown format - Theory of Change style
    return `# Impact Model (Theory of Change)

## ${IMPACT_MODEL_LABELS.issue}
${model.issue || '_Not yet defined_'}

## ${IMPACT_MODEL_LABELS.participants}
${model.participants || '_Not yet defined_'}

## ${IMPACT_MODEL_LABELS.activities}
${model.activities || '_Not yet defined_'}

## ${IMPACT_MODEL_LABELS.shortTermOutcomes}
${model.shortTermOutcomes || '_Not yet defined_'}

## ${IMPACT_MODEL_LABELS.mediumTermOutcomes}
${model.mediumTermOutcomes || '_Not yet defined_'}

## ${IMPACT_MODEL_LABELS.longTermOutcomes}
${model.longTermOutcomes || '_Not yet defined_'}

## ${IMPACT_MODEL_LABELS.impact}
${model.impact || '_Not yet defined_'}
`;
  }

  /**
   * Get dependencies for a field (all previous fields in the chain)
   */
  private getFieldDependencies(field: ImpactModelField): ImpactModelField[] {
    const index = IMPACT_MODEL_FIELDS.indexOf(field);
    if (index <= 0) return [];
    return IMPACT_MODEL_FIELDS.slice(0, index) as ImpactModelField[];
  }
}
