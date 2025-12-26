/**
 * Canvas Durable Object
 *
 * The goal artifact - stores the Social Lean Canvas with all 11 sections.
 * Uses Model Managers for business logic encapsulation.
 *
 * Architecture:
 * - Standalone sections: purpose, keyMetrics (stored directly)
 * - Customer Model: customers, jobsToBeDone, valueProposition, solution
 * - Economic Model: channels, revenue, costs, advantage
 * - Impact Model: 8-field causality chain (impact section)
 * - Venture Profile: 7-dimensional Selection Matrix data
 */

import { DurableObject } from 'cloudflare:workers';
import {
  CustomerModelManager,
  EconomicModelManager,
  ImpactModelManager,
  type UpdateResult,
  type ModelCompletion,
} from '../../src/models';
import {
  type CanvasSectionId,
  type CanvasSection,
  type ImpactModel,
  type CanvasState,
  SECTION_TO_MODEL,
  CANVAS_SECTIONS,
  CANVAS_SECTION_LABELS,
} from '../../src/types/canvas';
import {
  type VentureDimensions,
  type VentureProfile,
  type DimensionConfidence,
  type DimensionConfirmed,
  createEmptyDimensions,
  createEmptyConfidence,
  createEmptyConfirmed,
} from '../../src/types/venture';

/**
 * Confidence threshold for dimension filtering
 */
const CONFIDENCE_THRESHOLD = 0.7;

/**
 * Canvas Durable Object implementation
 */
export class CanvasDO extends DurableObject<Env> {
  private customerManager: CustomerModelManager;
  private economicManager: EconomicModelManager;
  private impactManager: ImpactModelManager;
  private initialized = false;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Initialize Model Managers with SQLite reference
    const sql = ctx.storage.sql;
    this.customerManager = new CustomerModelManager(sql);
    this.economicManager = new EconomicModelManager(sql);
    this.impactManager = new ImpactModelManager(sql);
  }

  /**
   * Ensure schema is created and initial data exists
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    const sql = this.ctx.storage.sql;
    const now = new Date().toISOString();

    // Canvas metadata
    sql.exec(`
      CREATE TABLE IF NOT EXISTS canvas_meta (
        id TEXT PRIMARY KEY DEFAULT 'canvas',
        purpose TEXT NOT NULL DEFAULT '',
        key_metrics TEXT NOT NULL DEFAULT '',
        current_section TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Canvas sections (10 standard sections, not impact)
    sql.exec(`
      CREATE TABLE IF NOT EXISTS canvas_section (
        section_key TEXT PRIMARY KEY,
        content TEXT NOT NULL DEFAULT '',
        is_complete INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      )
    `);

    // Impact model (8-field causality chain)
    sql.exec(`
      CREATE TABLE IF NOT EXISTS impact_model (
        id TEXT PRIMARY KEY DEFAULT 'impact',
        issue TEXT NOT NULL DEFAULT '',
        participants TEXT NOT NULL DEFAULT '',
        activities TEXT NOT NULL DEFAULT '',
        outputs TEXT NOT NULL DEFAULT '',
        short_term_outcomes TEXT NOT NULL DEFAULT '',
        medium_term_outcomes TEXT NOT NULL DEFAULT '',
        long_term_outcomes TEXT NOT NULL DEFAULT '',
        impact TEXT NOT NULL DEFAULT '',
        is_complete INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      )
    `);

    // Venture profile (7 dimensions)
    sql.exec(`
      CREATE TABLE IF NOT EXISTS venture_profile (
        id TEXT PRIMARY KEY DEFAULT 'profile',
        venture_stage TEXT,
        impact_areas TEXT NOT NULL DEFAULT '[]',
        impact_mechanisms TEXT NOT NULL DEFAULT '[]',
        legal_structure TEXT,
        revenue_sources TEXT NOT NULL DEFAULT '[]',
        funding_sources TEXT NOT NULL DEFAULT '[]',
        industries TEXT NOT NULL DEFAULT '[]',
        confidence_json TEXT NOT NULL DEFAULT '{}',
        confirmed_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Initialize default records if they don't exist
    // Use .toArray()[0] instead of .one() because .one() throws when no row exists
    const metaExists = sql
      .exec<{ id: string }>(`SELECT id FROM canvas_meta WHERE id = 'canvas'`)
      .toArray()[0];

    if (!metaExists) {
      sql.exec(
        `INSERT INTO canvas_meta (id, purpose, key_metrics, created_at, updated_at)
         VALUES ('canvas', '', '', ?, ?)`,
        now,
        now
      );
    }

    // Use .toArray()[0] instead of .one() because .one() throws when no row exists
    const impactExists = sql
      .exec<{ id: string }>(`SELECT id FROM impact_model WHERE id = 'impact'`)
      .toArray()[0];

    if (!impactExists) {
      sql.exec(
        `INSERT INTO impact_model (id, issue, participants, activities, outputs, short_term_outcomes, medium_term_outcomes, long_term_outcomes, impact, is_complete, updated_at)
         VALUES ('impact', '', '', '', '', '', '', '', '', 0, ?)`,
        now
      );
    }

    // Use .toArray()[0] instead of .one() because .one() throws when no row exists
    const profileExists = sql
      .exec<{ id: string }>(`SELECT id FROM venture_profile WHERE id = 'profile'`)
      .toArray()[0];

    if (!profileExists) {
      sql.exec(
        `INSERT INTO venture_profile (id, created_at, updated_at) VALUES ('profile', ?, ?)`,
        now,
        now
      );
    }

    // Initialize empty canvas sections (excluding impact)
    const sectionsToInit = CANVAS_SECTIONS.filter(
      (s) => s !== 'impact' && s !== 'purpose' && s !== 'keyMetrics'
    );

    for (const sectionKey of sectionsToInit) {
      // Use .toArray()[0] instead of .one() because .one() throws when no row exists
      const exists = sql
        .exec<{ section_key: string }>(
          `SELECT section_key FROM canvas_section WHERE section_key = ?`,
          sectionKey
        )
        .toArray()[0];

      if (!exists) {
        sql.exec(
          `INSERT INTO canvas_section (section_key, content, is_complete, updated_at)
           VALUES (?, '', 0, ?)`,
          sectionKey,
          now
        );
      }
    }

    this.initialized = true;
  }

  // ============================================
  // Canvas Methods
  // ============================================

  /**
   * Get the full canvas state
   */
  async getFullCanvas(): Promise<CanvasState> {
    await this.ensureInitialized();
    const sql = this.ctx.storage.sql;

    // Get canvas metadata
    const meta = sql
      .exec<{
        purpose: string;
        key_metrics: string;
        current_section: string | null;
        created_at: string;
        updated_at: string;
      }>(`SELECT * FROM canvas_meta WHERE id = 'canvas'`)
      .one()!;

    // Get all canvas sections
    const sectionRows = sql
      .exec<{
        section_key: string;
        content: string;
        is_complete: number;
        updated_at: string;
      }>(`SELECT * FROM canvas_section`)
      .toArray();

    // Build sections array (including purpose and keyMetrics)
    const canvasId = this.ctx.id.toString();
    const sections: CanvasSection[] = [];

    // Add purpose as a section
    sections.push({
      sessionId: canvasId,
      sectionKey: 'purpose',
      content: meta.purpose,
      isComplete: meta.purpose.length >= 20,
      updatedAt: meta.updated_at,
    });

    // Add standard sections from canvas_section table
    for (const row of sectionRows) {
      sections.push({
        sessionId: canvasId,
        sectionKey: row.section_key as CanvasSectionId,
        content: row.content,
        isComplete: row.is_complete === 1,
        updatedAt: row.updated_at,
      });
    }

    // Add keyMetrics as a section
    sections.push({
      sessionId: canvasId,
      sectionKey: 'keyMetrics',
      content: meta.key_metrics,
      isComplete: meta.key_metrics.length >= 20,
      updatedAt: meta.updated_at,
    });

    // Get impact model
    const impactRow = sql
      .exec<{
        issue: string;
        participants: string;
        activities: string;
        outputs: string;
        short_term_outcomes: string;
        medium_term_outcomes: string;
        long_term_outcomes: string;
        impact: string;
        is_complete: number;
        updated_at: string;
      }>(`SELECT * FROM impact_model WHERE id = 'impact'`)
      .one()!;

    const impactModel: ImpactModel = {
      sessionId: canvasId,
      issue: impactRow.issue,
      participants: impactRow.participants,
      activities: impactRow.activities,
      outputs: impactRow.outputs,
      shortTermOutcomes: impactRow.short_term_outcomes,
      mediumTermOutcomes: impactRow.medium_term_outcomes,
      longTermOutcomes: impactRow.long_term_outcomes,
      impact: impactRow.impact,
      isComplete: impactRow.is_complete === 1,
      updatedAt: impactRow.updated_at,
    };

    // Calculate completion
    const completedSections = sections.filter((s) => s.isComplete).length;
    const impactComplete = impactModel.isComplete ? 1 : 0;
    const totalSections = sections.length + 1; // sections + impact model
    const completionPercentage = Math.round(
      ((completedSections + impactComplete) / totalSections) * 100
    );

    return {
      sessionId: canvasId,
      sections,
      impactModel,
      currentSection: meta.current_section as CanvasSectionId | null,
      completionPercentage,
      createdAt: meta.created_at,
      updatedAt: meta.updated_at,
    };
  }

  /**
   * Update a canvas section, routing to appropriate manager
   */
  async updateSection(
    section: CanvasSectionId,
    content: string
  ): Promise<UpdateResult> {
    await this.ensureInitialized();

    // Route standalone sections
    if (section === 'purpose') {
      return this.updatePurpose(content);
    }

    if (section === 'keyMetrics') {
      return this.updateKeyMetrics(content);
    }

    // Route impact section to Impact Model Manager
    if (section === 'impact') {
      return this.impactManager.updateSection('impact', content);
    }

    // Route to appropriate Model Manager
    const model = SECTION_TO_MODEL[section];

    if (model === 'customer') {
      return this.customerManager.updateSection(section, content);
    }

    if (model === 'economic') {
      return this.economicManager.updateSection(section, content);
    }

    // Should not reach here
    return {
      success: false,
      errors: [`Unknown section: ${section}`],
      completion: { percentage: 0, completedSections: [], missingSections: [], suggestions: [] },
    };
  }

  /**
   * Update purpose section (standalone)
   */
  private async updatePurpose(content: string): Promise<UpdateResult> {
    const sql = this.ctx.storage.sql;
    const now = new Date().toISOString();

    if (content.length < 20) {
      return {
        success: false,
        errors: [`"${CANVAS_SECTION_LABELS.purpose}" needs more detail (minimum 20 characters)`],
        completion: await this.getOverallCompletion(),
      };
    }

    sql.exec(
      `UPDATE canvas_meta SET purpose = ?, updated_at = ? WHERE id = 'canvas'`,
      content,
      now
    );

    return {
      success: true,
      updatedSection: 'purpose',
      completion: await this.getOverallCompletion(),
    };
  }

  /**
   * Update keyMetrics section (standalone)
   */
  private async updateKeyMetrics(content: string): Promise<UpdateResult> {
    const sql = this.ctx.storage.sql;
    const now = new Date().toISOString();

    if (content.length < 20) {
      return {
        success: false,
        errors: [`"${CANVAS_SECTION_LABELS.keyMetrics}" needs more detail (minimum 20 characters)`],
        completion: await this.getOverallCompletion(),
      };
    }

    sql.exec(
      `UPDATE canvas_meta SET key_metrics = ?, updated_at = ? WHERE id = 'canvas'`,
      content,
      now
    );

    return {
      success: true,
      updatedSection: 'keyMetrics',
      completion: await this.getOverallCompletion(),
    };
  }

  /**
   * Get overall canvas completion
   */
  private async getOverallCompletion(): Promise<ModelCompletion> {
    const canvas = await this.getFullCanvas();
    const completed = canvas.sections.filter((s) => s.isComplete).map((s) => s.sectionKey);
    const missing = canvas.sections.filter((s) => !s.isComplete).map((s) => s.sectionKey);

    if (canvas.impactModel.isComplete) {
      completed.push('impact');
    } else {
      missing.push('impact');
    }

    return {
      percentage: canvas.completionPercentage,
      completedSections: completed,
      missingSections: missing,
      suggestions: missing.length > 0
        ? [`Continue working on "${CANVAS_SECTION_LABELS[missing[0] as CanvasSectionId]}"`]
        : ['Canvas complete! Review your work.'],
    };
  }

  /**
   * Set current section (curriculum progress)
   */
  async setCurrentSection(section: CanvasSectionId | null): Promise<void> {
    await this.ensureInitialized();
    const sql = this.ctx.storage.sql;
    const now = new Date().toISOString();

    sql.exec(
      `UPDATE canvas_meta SET current_section = ?, updated_at = ? WHERE id = 'canvas'`,
      section,
      now
    );
  }

  /**
   * Update an Impact Model field directly
   *
   * Routes to ImpactModelManager with chain order validation.
   * Use this for the 8 fields: issue → participants → activities → outputs →
   * shortTermOutcomes → mediumTermOutcomes → longTermOutcomes → impact
   */
  async updateImpactField(
    field: 'issue' | 'participants' | 'activities' | 'outputs' | 'shortTermOutcomes' | 'mediumTermOutcomes' | 'longTermOutcomes' | 'impact',
    content: string
  ): Promise<UpdateResult> {
    await this.ensureInitialized();
    return this.impactManager.updateSection(field, content);
  }

  // ============================================
  // Model Access Methods
  // ============================================

  /**
   * Get Customer Model data
   */
  async getCustomerModel() {
    await this.ensureInitialized();
    return {
      ...this.customerManager.getModel(),
      completion: this.customerManager.getCompletion(),
      validation: this.customerManager.validate(),
    };
  }

  /**
   * Get Economic Model data
   */
  async getEconomicModel() {
    await this.ensureInitialized();
    return {
      ...this.economicManager.getModel(),
      completion: this.economicManager.getCompletion(),
      validation: this.economicManager.validate(),
    };
  }

  /**
   * Get Impact Model data
   */
  async getImpactModel() {
    await this.ensureInitialized();
    return {
      ...this.impactManager.getModel(),
      completion: this.impactManager.getCompletion(),
      validation: this.impactManager.validate(),
    };
  }

  // ============================================
  // Venture Profile Methods
  // ============================================

  /**
   * Get venture profile with all dimensions
   */
  async getVentureProfile(): Promise<VentureProfile> {
    await this.ensureInitialized();
    const sql = this.ctx.storage.sql;

    const row = sql
      .exec<{
        venture_stage: string | null;
        impact_areas: string;
        impact_mechanisms: string;
        legal_structure: string | null;
        revenue_sources: string;
        funding_sources: string;
        industries: string;
        confidence_json: string;
        confirmed_json: string;
        created_at: string;
        updated_at: string;
      }>(`SELECT * FROM venture_profile WHERE id = 'profile'`)
      .one()!;

    const dimensions: VentureDimensions = {
      ventureStage: row.venture_stage,
      impactAreas: JSON.parse(row.impact_areas),
      impactMechanisms: JSON.parse(row.impact_mechanisms),
      legalStructure: row.legal_structure,
      revenueSources: JSON.parse(row.revenue_sources),
      fundingSources: JSON.parse(row.funding_sources),
      industries: JSON.parse(row.industries),
    };

    const confidence: DimensionConfidence = {
      ...createEmptyConfidence(),
      ...JSON.parse(row.confidence_json),
    };

    const confirmed: DimensionConfirmed = {
      ...createEmptyConfirmed(),
      ...JSON.parse(row.confirmed_json),
    };

    return {
      id: this.ctx.id.toString(),
      sessionId: this.ctx.id.toString(),
      dimensions,
      confidence,
      confirmed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Update a venture dimension
   */
  async updateVentureDimension(
    dimension: keyof VentureDimensions,
    value: string | string[] | null,
    confidence?: number,
    confirmed?: boolean
  ): Promise<void> {
    await this.ensureInitialized();
    const sql = this.ctx.storage.sql;
    const now = new Date().toISOString();

    // Get current profile
    const profile = await this.getVentureProfile();

    // Update dimension value
    if (Array.isArray(value)) {
      (profile.dimensions[dimension] as string[]) = value;
    } else {
      (profile.dimensions[dimension] as string | null) = value;
    }

    // Update confidence if provided
    if (confidence !== undefined) {
      profile.confidence[dimension] = confidence;
    }

    // Update confirmed if provided
    if (confirmed !== undefined) {
      profile.confirmed[dimension] = confirmed;
    }

    // Update using explicit column updates (no string interpolation for SQL safety)
    const dbValue = Array.isArray(value) ? JSON.stringify(value) : value;
    const confJson = JSON.stringify(profile.confidence);
    const confirmedJson = JSON.stringify(profile.confirmed);

    switch (dimension) {
      case 'ventureStage':
        sql.exec(`UPDATE venture_profile SET venture_stage = ?, confidence_json = ?, confirmed_json = ?, updated_at = ? WHERE id = 'profile'`, dbValue, confJson, confirmedJson, now);
        break;
      case 'impactAreas':
        sql.exec(`UPDATE venture_profile SET impact_areas = ?, confidence_json = ?, confirmed_json = ?, updated_at = ? WHERE id = 'profile'`, dbValue, confJson, confirmedJson, now);
        break;
      case 'impactMechanisms':
        sql.exec(`UPDATE venture_profile SET impact_mechanisms = ?, confidence_json = ?, confirmed_json = ?, updated_at = ? WHERE id = 'profile'`, dbValue, confJson, confirmedJson, now);
        break;
      case 'legalStructure':
        sql.exec(`UPDATE venture_profile SET legal_structure = ?, confidence_json = ?, confirmed_json = ?, updated_at = ? WHERE id = 'profile'`, dbValue, confJson, confirmedJson, now);
        break;
      case 'revenueSources':
        sql.exec(`UPDATE venture_profile SET revenue_sources = ?, confidence_json = ?, confirmed_json = ?, updated_at = ? WHERE id = 'profile'`, dbValue, confJson, confirmedJson, now);
        break;
      case 'fundingSources':
        sql.exec(`UPDATE venture_profile SET funding_sources = ?, confidence_json = ?, confirmed_json = ?, updated_at = ? WHERE id = 'profile'`, dbValue, confJson, confirmedJson, now);
        break;
      case 'industries':
        sql.exec(`UPDATE venture_profile SET industries = ?, confidence_json = ?, confirmed_json = ?, updated_at = ? WHERE id = 'profile'`, dbValue, confJson, confirmedJson, now);
        break;
    }
  }

  /**
   * Get dimensions that meet the confidence threshold for filtering
   */
  async getDimensionsForFiltering(): Promise<Partial<VentureDimensions>> {
    const profile = await this.getVentureProfile();
    const result: Partial<VentureDimensions> = {};

    const dims = profile.dimensions;
    const conf = profile.confidence;
    const confirmed = profile.confirmed;

    // Only include dimensions that are confirmed or meet confidence threshold
    if ((conf.ventureStage >= CONFIDENCE_THRESHOLD || confirmed.ventureStage) && dims.ventureStage) {
      result.ventureStage = dims.ventureStage;
    }

    if ((conf.impactAreas >= CONFIDENCE_THRESHOLD || confirmed.impactAreas) && dims.impactAreas.length > 0) {
      result.impactAreas = dims.impactAreas;
    }

    if ((conf.impactMechanisms >= CONFIDENCE_THRESHOLD || confirmed.impactMechanisms) && dims.impactMechanisms.length > 0) {
      result.impactMechanisms = dims.impactMechanisms;
    }

    if ((conf.legalStructure >= CONFIDENCE_THRESHOLD || confirmed.legalStructure) && dims.legalStructure) {
      result.legalStructure = dims.legalStructure;
    }

    if ((conf.revenueSources >= CONFIDENCE_THRESHOLD || confirmed.revenueSources) && dims.revenueSources.length > 0) {
      result.revenueSources = dims.revenueSources;
    }

    if ((conf.fundingSources >= CONFIDENCE_THRESHOLD || confirmed.fundingSources) && dims.fundingSources.length > 0) {
      result.fundingSources = dims.fundingSources;
    }

    if ((conf.industries >= CONFIDENCE_THRESHOLD || confirmed.industries) && dims.industries.length > 0) {
      result.industries = dims.industries;
    }

    return result;
  }

  // ============================================
  // Export Methods
  // ============================================

  /**
   * Export the full canvas in specified format
   */
  async exportCanvas(format: 'json' | 'md'): Promise<string> {
    await this.ensureInitialized();

    if (format === 'json') {
      const canvas = await this.getFullCanvas();
      const profile = await this.getVentureProfile();
      return JSON.stringify({ canvas, ventureProfile: profile }, null, 2);
    }

    // Markdown format
    const canvas = await this.getFullCanvas();
    const customerExport = this.customerManager.export('md');
    const economicExport = this.economicManager.export('md');
    const impactExport = this.impactManager.export('md');

    const purposeSection = canvas.sections.find((s) => s.sectionKey === 'purpose');
    const keyMetricsSection = canvas.sections.find((s) => s.sectionKey === 'keyMetrics');

    return `# Social Lean Canvas

## Purpose
${purposeSection?.content || '_Not yet defined_'}

${customerExport}

${economicExport}

## Key Metrics
${keyMetricsSection?.content || '_Not yet defined_'}

${impactExport}

---
*Completion: ${canvas.completionPercentage}%*
`;
  }
}
