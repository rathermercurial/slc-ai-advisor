/**
 * Customer Model Manager
 *
 * Manages the 4 sections of the Customer Model:
 * - customers
 * - jobsToBeDone
 * - valueProposition
 * - solution
 *
 * Implements dependency chain validation:
 * customers → jobsToBeDone → valueProposition → solution
 */

import type {
  IModelManager,
  UpdateResult,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ModelCompletion,
  SectionRule,
  CustomerModelData,
  CustomerSectionId,
} from './IModelManager';
import type { SqlStorage } from '../types/sql';
import { CANVAS_SECTION_LABELS } from '../types/canvas';

/**
 * Customer Model sections in dependency order
 */
const SECTIONS: readonly CustomerSectionId[] = [
  'customers',
  'jobsToBeDone',
  'valueProposition',
  'solution',
] as const;

/**
 * Validation rules for each section
 */
const VALIDATION_RULES: Record<CustomerSectionId, SectionRule> = {
  customers: {
    required: true,
    minLength: 20,
    dependsOn: [],
    prompts: [
      'Who are your primary customers?',
      'What customer segments exist?',
      'Who are your early adopters?',
    ],
  },
  jobsToBeDone: {
    required: true,
    minLength: 20,
    dependsOn: ['customers'],
    prompts: [
      'What task are they trying to accomplish?',
      'What problem are they trying to solve?',
      'What do they currently use to get this job done?',
    ],
  },
  valueProposition: {
    required: true,
    minLength: 20,
    dependsOn: ['customers', 'jobsToBeDone'],
    prompts: [
      'Why would they choose your solution over alternatives?',
      'What unique value do you provide?',
      'How do you help them get the job done better?',
    ],
  },
  solution: {
    required: true,
    minLength: 20,
    dependsOn: ['valueProposition'],
    prompts: [
      'What do you provide to deliver that value?',
      'What is your product or service?',
      'How does it work?',
    ],
  },
};

/**
 * Customer Model Manager implementation
 */
export class CustomerModelManager implements IModelManager<CustomerModelData> {
  constructor(private sql: SqlStorage) {}

  /**
   * Get all sections for the Customer Model
   */
  getModel(): CustomerModelData {
    const result: Partial<CustomerModelData> = {};

    for (const section of SECTIONS) {
      result[section] = this.getSection(section);
    }

    return result as CustomerModelData;
  }

  /**
   * Update a section's content with dependency validation
   */
  updateSection(section: string, content: string): UpdateResult {
    // Validate section name
    if (!SECTIONS.includes(section as CustomerSectionId)) {
      return {
        success: false,
        errors: [`Invalid section: ${section}. Valid sections: ${SECTIONS.join(', ')}`],
        completion: this.getCompletion(),
      };
    }

    const sectionId = section as CustomerSectionId;
    const rule = VALIDATION_RULES[sectionId];

    // Check dependencies
    for (const dep of rule.dependsOn) {
      const depContent = this.getSection(dep as CustomerSectionId);
      const depRule = VALIDATION_RULES[dep as CustomerSectionId];

      if (!depContent || depContent.length < depRule.minLength) {
        return {
          success: false,
          errors: [
            `Complete "${CANVAS_SECTION_LABELS[dep as CustomerSectionId]}" before "${CANVAS_SECTION_LABELS[sectionId]}"`,
          ],
          completion: this.getCompletion(),
        };
      }
    }

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

      // Check dependencies
      for (const dep of rule.dependsOn) {
        const depContent = model[dep as CustomerSectionId];
        const depRule = VALIDATION_RULES[dep as CustomerSectionId];

        if (content && content.length >= rule.minLength) {
          if (!depContent || depContent.length < depRule.minLength) {
            warnings.push({
              section,
              message: `"${CANVAS_SECTION_LABELS[section]}" was completed before "${CANVAS_SECTION_LABELS[dep as CustomerSectionId]}"`,
            });
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get completion status for the Customer Model
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

    // Find the next section to work on (first missing that has deps satisfied)
    let nextSection: CustomerSectionId | null = null;
    for (const section of missingSections) {
      const rule = VALIDATION_RULES[section];
      const depsSatisfied = rule.dependsOn.every((dep) =>
        completedSections.includes(dep as CustomerSectionId)
      );
      if (depsSatisfied) {
        nextSection = section;
        break;
      }
    }

    const suggestions: string[] = [];
    if (nextSection) {
      suggestions.push(...VALIDATION_RULES[nextSection].prompts);
    } else if (missingSections.length === 0) {
      suggestions.push('Customer Model complete! Review your work or move to the next model.');
    }

    return {
      percentage: Math.round((completedSections.length / SECTIONS.length) * 100),
      completedSections: completedSections as string[],
      missingSections: missingSections as string[],
      suggestions,
    };
  }

  /**
   * Export the Customer Model in specified format
   */
  export(format: 'json' | 'md'): string {
    const model = this.getModel();

    if (format === 'json') {
      return JSON.stringify(model, null, 2);
    }

    // Markdown format
    return `# Customer Model

## ${CANVAS_SECTION_LABELS.customers}
${model.customers || '_Not yet defined_'}

## ${CANVAS_SECTION_LABELS.jobsToBeDone}
${model.jobsToBeDone || '_Not yet defined_'}

## ${CANVAS_SECTION_LABELS.valueProposition}
${model.valueProposition || '_Not yet defined_'}

## ${CANVAS_SECTION_LABELS.solution}
${model.solution || '_Not yet defined_'}
`;
  }

  /**
   * Get a single section's content from the database
   */
  private getSection(sectionKey: CustomerSectionId): string {
    const result = this.sql
      .exec<{ content: string }>(
        `SELECT content FROM canvas_section WHERE section_key = ?`,
        sectionKey
      )
      .one();

    return result?.content ?? '';
  }
}
