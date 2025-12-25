/**
 * Economic Model Manager
 *
 * Manages the 4 sections of the Economic Model:
 * - channels
 * - revenue
 * - costs
 * - advantage
 *
 * Unlike Customer Model, sections can be completed in any order
 * (no strict dependency chain).
 */

import type {
  IModelManager,
  UpdateResult,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ModelCompletion,
  SectionRule,
  EconomicModelData,
  EconomicSectionId,
} from './IModelManager';
import type { SqlStorage } from '../types/sql';
import { CANVAS_SECTION_LABELS } from '../types/canvas';

/**
 * Economic Model sections
 */
const SECTIONS: readonly EconomicSectionId[] = [
  'channels',
  'revenue',
  'costs',
  'advantage',
] as const;

/**
 * Validation rules for each section
 * Note: No strict dependencies - sections can be filled in any order
 */
const VALIDATION_RULES: Record<EconomicSectionId, SectionRule> = {
  channels: {
    required: true,
    minLength: 20,
    dependsOn: [],
    prompts: [
      'How do you reach your customers?',
      'What marketing and sales channels will you use?',
      'How will customers discover you?',
    ],
  },
  revenue: {
    required: true,
    minLength: 20,
    dependsOn: [],
    prompts: [
      'How do you generate income?',
      'What is your pricing model?',
      'What are your revenue streams?',
    ],
  },
  costs: {
    required: true,
    minLength: 20,
    dependsOn: [],
    prompts: [
      'What are your major ongoing expenses?',
      'What does it cost to deliver your solution?',
      'What are your fixed vs variable costs?',
    ],
  },
  advantage: {
    required: true,
    minLength: 20,
    dependsOn: [],
    prompts: [
      "What can't be easily copied or bought?",
      'What is your unfair advantage?',
      'What moats protect your business?',
    ],
  },
};

/**
 * Economic Model Manager implementation
 */
export class EconomicModelManager implements IModelManager<EconomicModelData> {
  constructor(private sql: SqlStorage) {}

  /**
   * Get all sections for the Economic Model
   */
  getModel(): EconomicModelData {
    const result: Partial<EconomicModelData> = {};

    for (const section of SECTIONS) {
      result[section] = this.getSection(section);
    }

    return result as EconomicModelData;
  }

  /**
   * Update a section's content
   */
  updateSection(section: string, content: string): UpdateResult {
    // Validate section name
    if (!SECTIONS.includes(section as EconomicSectionId)) {
      return {
        success: false,
        errors: [`Invalid section: ${section}. Valid sections: ${SECTIONS.join(', ')}`],
        completion: this.getCompletion(),
      };
    }

    const sectionId = section as EconomicSectionId;
    const rule = VALIDATION_RULES[sectionId];

    // Validate content length
    if (content.length < rule.minLength) {
      return {
        success: false,
        errors: [
          `"${CANVAS_SECTION_LABELS[sectionId]}" needs more detail (minimum ${rule.minLength} characters)`,
        ],
        completion: this.getCompletion(),
      };
    }

    // Save to database
    const now = new Date().toISOString();
    this.sql.exec(
      `INSERT OR REPLACE INTO canvas_section (section_key, content, is_complete, updated_at)
       VALUES (?, ?, 1, ?)`,
      sectionId,
      content,
      now
    );

    return {
      success: true,
      updatedSection: sectionId,
      completion: this.getCompletion(),
    };
  }

  /**
   * Validate all sections in the model
   */
  validate(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const model = this.getModel();

    for (const section of SECTIONS) {
      const rule = VALIDATION_RULES[section];
      const content = model[section];

      // Check required sections
      if (rule.required && (!content || content.length < rule.minLength)) {
        errors.push({
          section,
          message: `"${CANVAS_SECTION_LABELS[section]}" is required (minimum ${rule.minLength} characters)`,
        });
      }
    }

    // Add warning if advantage is filled but revenue is not
    // (often you need revenue model clarity before defining advantage)
    const hasAdvantage =
      model.advantage && model.advantage.length >= VALIDATION_RULES.advantage.minLength;
    const hasRevenue =
      model.revenue && model.revenue.length >= VALIDATION_RULES.revenue.minLength;

    if (hasAdvantage && !hasRevenue) {
      warnings.push({
        section: 'advantage',
        message:
          'Consider defining your revenue model before finalizing your advantage',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get completion status for the Economic Model
   */
  getCompletion(): ModelCompletion {
    const model = this.getModel();

    const completedSections = SECTIONS.filter((section) => {
      const content = model[section];
      const rule = VALIDATION_RULES[section];
      return content && content.length >= rule.minLength;
    });

    const missingSections = SECTIONS.filter(
      (section) => !completedSections.includes(section)
    );

    const suggestions: string[] = [];
    if (missingSections.length > 0) {
      // Suggest the first missing section
      const nextSection = missingSections[0];
      suggestions.push(...VALIDATION_RULES[nextSection].prompts);
    } else {
      suggestions.push(
        'Economic Model complete! Review your work or move to the Impact Model.'
      );
    }

    return {
      percentage: Math.round((completedSections.length / SECTIONS.length) * 100),
      completedSections: completedSections as string[],
      missingSections: missingSections as string[],
      suggestions,
    };
  }

  /**
   * Export the Economic Model in specified format
   */
  export(format: 'json' | 'md'): string {
    const model = this.getModel();

    if (format === 'json') {
      return JSON.stringify(model, null, 2);
    }

    // Markdown format
    return `# Economic Model

## ${CANVAS_SECTION_LABELS.channels}
${model.channels || '_Not yet defined_'}

## ${CANVAS_SECTION_LABELS.revenue}
${model.revenue || '_Not yet defined_'}

## ${CANVAS_SECTION_LABELS.costs}
${model.costs || '_Not yet defined_'}

## ${CANVAS_SECTION_LABELS.advantage}
${model.advantage || '_Not yet defined_'}
`;
  }

  /**
   * Get a single section's content from the database
   */
  private getSection(sectionKey: EconomicSectionId): string {
    const result = this.sql
      .exec<{ content: string }>(
        `SELECT content FROM canvas_section WHERE section_key = ?`,
        sectionKey
      )
      .one();

    return result?.content ?? '';
  }
}
