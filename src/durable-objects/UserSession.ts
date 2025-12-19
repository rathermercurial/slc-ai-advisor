/**
 * UserSession Durable Object
 *
 * Manages session state using SQLite storage.
 * Stores venture profile, canvas sections, impact model, and chat messages.
 *
 * This is a scaffold - full implementation in task B2.
 */

import { DurableObject } from 'cloudflare:workers';

export class UserSession extends DurableObject {
  private sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.initSchema();
  }

  /**
   * Initialize SQLite schema for session data
   * Full schema implementation in task B2
   */
  private initSchema(): void {
    // Session metadata
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Additional tables (venture_profile, canvas_section, impact_model, message)
    // will be added in task B2
  }

  /**
   * Handle HTTP requests to this Durable Object
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Placeholder routes - full implementation in tasks B3, B7
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  }
}
