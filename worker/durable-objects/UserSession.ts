/**
 * UserSession Durable Object
 *
 * Persists all user state with SQLite storage:
 * - Session metadata (program, current section)
 * - Venture profile (7 dimensions for Selection Matrix)
 * - Canvas sections (11 sections - 10 standard + impact model)
 * - Chat messages
 *
 * Three distinct concepts:
 * 1. Canvas Sections (11) - Content users fill in
 * 2. Models (3) - Conceptual views over sections (not stored separately)
 * 3. Venture Dimensions (7) - Properties for KB filtering
 */

import { DurableObject } from 'cloudflare:workers';
import type {
  CanvasSection,
  CanvasSectionId,
  ImpactModel,
  ImpactModelField,
  Model,
  CANVAS_SECTIONS,
  MODEL_SECTIONS,
} from '../../src/types/canvas';
import type {
  VentureProfile,
  VentureDimensions,
  DimensionConfidence,
  DimensionConfirmed,
} from '../../src/types/venture';
import type { ConversationMessage } from '../../src/types/message';

// Re-import constants we need
const STANDARD_SECTIONS: CanvasSectionId[] = [
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
];

const MODEL_SECTION_MAP: Record<Model, CanvasSectionId[]> = {
  customer: ['customers', 'jobsToBeDone', 'valueProposition', 'solution'],
  economic: ['channels', 'revenue', 'costs', 'advantage'],
  impact: ['impact'],
};

/**
 * Session metadata
 */
interface Session {
  id: string;
  program: string;
  currentSection: CanvasSectionId | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * UserSession Durable Object with SQLite storage
 */
export class UserSession extends DurableObject<Env> {
  private sql: SqlStorage;
  private initialized = false;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
  }

  /**
   * Initialize SQLite schema on first access
   */
  private async ensureSchema(): Promise<void> {
    if (this.initialized) return;

    // Session metadata
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY,
        program TEXT NOT NULL DEFAULT 'generic',
        current_section TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Venture profile (7 dimensions for Selection Matrix)
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS venture_profile (
        session_id TEXT PRIMARY KEY,
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

    // Canvas sections (10 standard sections, NOT impact)
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS canvas_section (
        session_id TEXT NOT NULL,
        section_key TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        is_complete INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (session_id, section_key)
      )
    `);

    // Impact Model (8-field causality chain = impact section)
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS impact_model (
        session_id TEXT PRIMARY KEY,
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

    // Chat messages
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS message (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);

    this.sql.exec(`
      CREATE INDEX IF NOT EXISTS idx_message_session
      ON message(session_id, timestamp)
    `);

    this.initialized = true;
  }

  /**
   * Handle HTTP requests to this Durable Object
   */
  async fetch(request: Request): Promise<Response> {
    await this.ensureSchema();

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Initialize session
      if (path === '/init' && request.method === 'POST') {
        const body = await request.json() as { sessionId: string; program?: string };
        await this.initSession(body.sessionId, body.program || 'generic');
        return this.jsonResponse({ success: true });
      }

      // Get session
      if (path === '/session' && request.method === 'GET') {
        const session = this.getSession();
        return this.jsonResponse(session);
      }

      // Get venture profile
      if (path === '/venture-profile' && request.method === 'GET') {
        const profile = this.getVentureProfile();
        return this.jsonResponse(profile);
      }

      // Update venture dimension
      if (path === '/venture-dimension' && request.method === 'PUT') {
        const body = await request.json() as {
          dimension: keyof VentureDimensions;
          value: unknown;
          confidence?: number;
        };
        this.updateVentureDimension(body.dimension, body.value, body.confidence);
        return this.jsonResponse({ success: true });
      }

      // Get all canvas sections
      if (path === '/canvas-sections' && request.method === 'GET') {
        const sections = this.getAllCanvasSections();
        return this.jsonResponse(sections);
      }

      // Get single canvas section
      if (path.startsWith('/canvas-section/') && request.method === 'GET') {
        const key = path.split('/')[2] as CanvasSectionId;
        const section = this.getCanvasSection(key);
        return this.jsonResponse(section);
      }

      // Update canvas section
      if (path.startsWith('/canvas-section/') && request.method === 'PUT') {
        const key = path.split('/')[2] as CanvasSectionId;
        const body = await request.json() as { content: string };
        this.updateCanvasSection(key, body.content);
        return this.jsonResponse({ success: true });
      }

      // Get model (grouped view)
      if (path.startsWith('/model/') && request.method === 'GET') {
        const model = path.split('/')[2] as Model;
        if (model === 'customer') {
          return this.jsonResponse(this.getCustomerModel());
        } else if (model === 'economic') {
          return this.jsonResponse(this.getEconomicModel());
        } else if (model === 'impact') {
          return this.jsonResponse(this.getImpactModel());
        }
      }

      // Update impact model field
      if (path === '/impact-model-field' && request.method === 'PUT') {
        const body = await request.json() as { field: ImpactModelField; content: string };
        this.updateImpactModelField(body.field, body.content);
        return this.jsonResponse({ success: true });
      }

      // Add message
      if (path === '/message' && request.method === 'POST') {
        const body = await request.json() as { role: 'user' | 'assistant'; content: string };
        const id = this.addMessage(body.role, body.content);
        return this.jsonResponse({ id });
      }

      // Get recent messages
      if (path === '/messages' && request.method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const messages = this.getRecentMessages(limit);
        return this.jsonResponse(messages);
      }

      // Get dimensions for filtering (high-confidence only)
      if (path === '/dimensions-for-filtering' && request.method === 'GET') {
        const dimensions = this.getDimensionsForFiltering();
        return this.jsonResponse(dimensions);
      }

      return this.jsonResponse({ error: 'Not found' }, 404);
    } catch (error) {
      console.error('UserSession error:', error);
      return this.jsonResponse({ error: 'Internal error' }, 500);
    }
  }

  // ============================================
  // Session Methods
  // ============================================

  /**
   * Initialize a new session with empty canvas
   */
  async initSession(sessionId: string, program: string): Promise<void> {
    const now = new Date().toISOString();

    // Create session
    this.sql.exec(
      `INSERT OR REPLACE INTO session (id, program, current_section, created_at, updated_at)
       VALUES (?, ?, NULL, ?, ?)`,
      sessionId,
      program,
      now,
      now
    );

    // Create venture profile
    this.sql.exec(
      `INSERT OR REPLACE INTO venture_profile
       (session_id, created_at, updated_at)
       VALUES (?, ?, ?)`,
      sessionId,
      now,
      now
    );

    // Create empty canvas sections (10 standard sections)
    for (const key of STANDARD_SECTIONS) {
      this.sql.exec(
        `INSERT OR REPLACE INTO canvas_section
         (session_id, section_key, content, is_complete, updated_at)
         VALUES (?, ?, '', 0, ?)`,
        sessionId,
        key,
        now
      );
    }

    // Create empty impact model
    this.sql.exec(
      `INSERT OR REPLACE INTO impact_model
       (session_id, updated_at)
       VALUES (?, ?)`,
      sessionId,
      now
    );
  }

  /**
   * Get session metadata
   */
  getSession(): Session | null {
    const row = this.sql.exec('SELECT * FROM session LIMIT 1').one();
    if (!row) return null;

    return {
      id: row.id as string,
      program: row.program as string,
      currentSection: row.current_section as CanvasSectionId | null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  /**
   * Update current section (curriculum progress)
   */
  updateCurrentSection(sectionKey: CanvasSectionId | null): void {
    const now = new Date().toISOString();
    this.sql.exec(
      'UPDATE session SET current_section = ?, updated_at = ?',
      sectionKey,
      now
    );
  }

  // ============================================
  // Venture Dimension Methods (for Selection Matrix)
  // ============================================

  /**
   * Get venture profile with all 7 dimensions
   */
  getVentureProfile(): VentureProfile | null {
    const session = this.getSession();
    if (!session) return null;

    const row = this.sql.exec(
      'SELECT * FROM venture_profile WHERE session_id = ?',
      session.id
    ).one();

    if (!row) return null;

    return {
      id: session.id,
      sessionId: session.id,
      dimensions: {
        ventureStage: row.venture_stage as string | null,
        impactAreas: JSON.parse(row.impact_areas as string || '[]'),
        impactMechanisms: JSON.parse(row.impact_mechanisms as string || '[]'),
        legalStructure: row.legal_structure as string | null,
        revenueSources: JSON.parse(row.revenue_sources as string || '[]'),
        fundingSources: JSON.parse(row.funding_sources as string || '[]'),
        industries: JSON.parse(row.industries as string || '[]'),
      },
      confidence: JSON.parse(row.confidence_json as string || '{}'),
      confirmed: JSON.parse(row.confirmed_json as string || '{}'),
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  /**
   * Update a single venture dimension
   */
  updateVentureDimension(
    dimension: keyof VentureDimensions,
    value: unknown,
    confidence?: number
  ): void {
    const session = this.getSession();
    if (!session) return;

    const now = new Date().toISOString();
    const profile = this.getVentureProfile();
    if (!profile) return;

    // Update confidence if provided
    if (confidence !== undefined) {
      const newConfidence = { ...profile.confidence, [dimension]: confidence };
      this.sql.exec(
        'UPDATE venture_profile SET confidence_json = ?, updated_at = ? WHERE session_id = ?',
        JSON.stringify(newConfidence),
        now,
        session.id
      );
    }

    // Map dimension to column name
    const columnMap: Record<keyof VentureDimensions, string> = {
      ventureStage: 'venture_stage',
      impactAreas: 'impact_areas',
      impactMechanisms: 'impact_mechanisms',
      legalStructure: 'legal_structure',
      revenueSources: 'revenue_sources',
      fundingSources: 'funding_sources',
      industries: 'industries',
    };

    const column = columnMap[dimension];
    const dbValue = Array.isArray(value) ? JSON.stringify(value) : value;

    this.sql.exec(
      `UPDATE venture_profile SET ${column} = ?, updated_at = ? WHERE session_id = ?`,
      dbValue,
      now,
      session.id
    );
  }

  /**
   * Get dimensions suitable for KB filtering (high confidence only)
   */
  getDimensionsForFiltering(): Partial<VentureDimensions> {
    const profile = this.getVentureProfile();
    if (!profile) return {};

    const threshold = 0.7;
    const result: Partial<VentureDimensions> = {};

    // Only include dimensions with high confidence or confirmed
    const dims = profile.dimensions;
    const conf = profile.confidence as DimensionConfidence;
    const confirmed = profile.confirmed as DimensionConfirmed;

    if ((conf.ventureStage >= threshold || confirmed.ventureStage) && dims.ventureStage) {
      result.ventureStage = dims.ventureStage;
    }
    if ((conf.impactAreas >= threshold || confirmed.impactAreas) && dims.impactAreas.length > 0) {
      result.impactAreas = dims.impactAreas;
    }
    if ((conf.industries >= threshold || confirmed.industries) && dims.industries.length > 0) {
      result.industries = dims.industries;
    }
    // Add other dimensions as needed for Demo

    return result;
  }

  // ============================================
  // Canvas Section Methods (content storage)
  // ============================================

  /**
   * Get all canvas sections (10 standard + impact summary)
   */
  getAllCanvasSections(): CanvasSection[] {
    const session = this.getSession();
    if (!session) return [];

    // Get standard sections
    const rows = this.sql.exec(
      'SELECT * FROM canvas_section WHERE session_id = ?',
      session.id
    ).toArray();

    const sections: CanvasSection[] = rows.map((row) => ({
      sessionId: row.session_id as string,
      sectionKey: row.section_key as CanvasSectionId,
      content: row.content as string,
      isComplete: Boolean(row.is_complete),
      updatedAt: row.updated_at as string,
    }));

    // Add impact section from impact_model
    const impactModel = this.getImpactModel();
    if (impactModel) {
      sections.push({
        sessionId: session.id,
        sectionKey: 'impact',
        content: impactModel.impact, // The summary field
        isComplete: impactModel.isComplete,
        updatedAt: impactModel.updatedAt,
      });
    }

    return sections;
  }

  /**
   * Get a single canvas section by key
   */
  getCanvasSection(key: CanvasSectionId): CanvasSection | null {
    const session = this.getSession();
    if (!session) return null;

    // Impact section is stored in impact_model
    if (key === 'impact') {
      const impactModel = this.getImpactModel();
      if (!impactModel) return null;
      return {
        sessionId: session.id,
        sectionKey: 'impact',
        content: impactModel.impact,
        isComplete: impactModel.isComplete,
        updatedAt: impactModel.updatedAt,
      };
    }

    const row = this.sql.exec(
      'SELECT * FROM canvas_section WHERE session_id = ? AND section_key = ?',
      session.id,
      key
    ).one();

    if (!row) return null;

    return {
      sessionId: row.session_id as string,
      sectionKey: row.section_key as CanvasSectionId,
      content: row.content as string,
      isComplete: Boolean(row.is_complete),
      updatedAt: row.updated_at as string,
    };
  }

  /**
   * Update a canvas section's content
   * Routes 'impact' key to impact_model.impact field
   */
  updateCanvasSection(key: CanvasSectionId, content: string): void {
    const session = this.getSession();
    if (!session) return;

    const now = new Date().toISOString();

    // Impact section routes to impact_model.impact
    if (key === 'impact') {
      this.updateImpactModelField('impact', content);
      return;
    }

    this.sql.exec(
      `UPDATE canvas_section SET content = ?, updated_at = ?
       WHERE session_id = ? AND section_key = ?`,
      content,
      now,
      session.id,
      key
    );
  }

  /**
   * Mark a section as complete or incomplete
   */
  markSectionComplete(key: CanvasSectionId, isComplete: boolean): void {
    const session = this.getSession();
    if (!session) return;

    const now = new Date().toISOString();

    if (key === 'impact') {
      this.sql.exec(
        'UPDATE impact_model SET is_complete = ?, updated_at = ? WHERE session_id = ?',
        isComplete ? 1 : 0,
        now,
        session.id
      );
      return;
    }

    this.sql.exec(
      `UPDATE canvas_section SET is_complete = ?, updated_at = ?
       WHERE session_id = ? AND section_key = ?`,
      isComplete ? 1 : 0,
      now,
      session.id,
      key
    );
  }

  // ============================================
  // Model Methods (grouped views over sections)
  // ============================================

  /**
   * Get Customer Model - grouped view of customer-related sections
   */
  getCustomerModel(): Record<string, CanvasSection | null> {
    return {
      customers: this.getCanvasSection('customers'),
      jobsToBeDone: this.getCanvasSection('jobsToBeDone'),
      valueProposition: this.getCanvasSection('valueProposition'),
      solution: this.getCanvasSection('solution'),
    };
  }

  /**
   * Get Economic Model - grouped view of economic-related sections
   */
  getEconomicModel(): Record<string, CanvasSection | null> {
    return {
      channels: this.getCanvasSection('channels'),
      revenue: this.getCanvasSection('revenue'),
      costs: this.getCanvasSection('costs'),
      advantage: this.getCanvasSection('advantage'),
    };
  }

  /**
   * Get Impact Model - full 8-field causality chain
   */
  getImpactModel(): ImpactModel | null {
    const session = this.getSession();
    if (!session) return null;

    const row = this.sql.exec(
      'SELECT * FROM impact_model WHERE session_id = ?',
      session.id
    ).one();

    if (!row) return null;

    return {
      sessionId: row.session_id as string,
      issue: row.issue as string,
      participants: row.participants as string,
      activities: row.activities as string,
      outputs: row.outputs as string,
      shortTermOutcomes: row.short_term_outcomes as string,
      mediumTermOutcomes: row.medium_term_outcomes as string,
      longTermOutcomes: row.long_term_outcomes as string,
      impact: row.impact as string,
      isComplete: Boolean(row.is_complete),
      updatedAt: row.updated_at as string,
    };
  }

  /**
   * Update a specific field in the Impact Model
   * The 'impact' field IS the impact section content
   */
  updateImpactModelField(field: ImpactModelField, content: string): void {
    const session = this.getSession();
    if (!session) return;

    const now = new Date().toISOString();

    // Map camelCase to snake_case for DB
    const columnMap: Record<ImpactModelField, string> = {
      issue: 'issue',
      participants: 'participants',
      activities: 'activities',
      outputs: 'outputs',
      shortTermOutcomes: 'short_term_outcomes',
      mediumTermOutcomes: 'medium_term_outcomes',
      longTermOutcomes: 'long_term_outcomes',
      impact: 'impact',
    };

    const column = columnMap[field];

    this.sql.exec(
      `UPDATE impact_model SET ${column} = ?, updated_at = ? WHERE session_id = ?`,
      content,
      now,
      session.id
    );
  }

  // ============================================
  // Message Methods
  // ============================================

  /**
   * Add a chat message
   */
  addMessage(role: 'user' | 'assistant', content: string): string {
    const session = this.getSession();
    if (!session) throw new Error('No session');

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.sql.exec(
      `INSERT INTO message (id, session_id, role, content, timestamp)
       VALUES (?, ?, ?, ?, ?)`,
      id,
      session.id,
      role,
      content,
      now
    );

    return id;
  }

  /**
   * Get recent messages for conversation context
   */
  getRecentMessages(limit = 20): ConversationMessage[] {
    const session = this.getSession();
    if (!session) return [];

    const rows = this.sql.exec(
      `SELECT * FROM message WHERE session_id = ?
       ORDER BY timestamp DESC LIMIT ?`,
      session.id,
      limit
    ).toArray();

    // Return in chronological order (oldest first)
    return rows.reverse().map((row) => ({
      id: row.id as string,
      sessionId: row.session_id as string,
      role: row.role as 'user' | 'assistant',
      content: row.content as string,
      timestamp: row.timestamp as string,
    }));
  }

  // ============================================
  // Helpers
  // ============================================

  private jsonResponse(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
