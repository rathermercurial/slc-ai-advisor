/**
 * SLC AI Advisor - Worker Entry Point
 *
 * Handles API routes for the SLC AI Advisor.
 * Static assets (React app) are served automatically by Cloudflare.
 *
 * Routes:
 * - GET /api/health - Health check
 * - POST /api/session - Create new session (B3)
 * - GET /api/session/:id - Get session (B3)
 * - POST /api/chat - Send chat message (B5)
 * - GET /api/canvas - Get canvas state (B7)
 * - PUT /api/canvas/:section - Update canvas section (B7)
 * - GET /api/export/:format - Export canvas (B8)
 */

// Durable Object will be imported from separate file in B2
// import { UserSession } from './durable-objects/UserSession';
// export { UserSession };

// Env interface extended in worker/env.d.ts

export default {
  async fetch(request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Only handle /api/* routes - static assets handled by Cloudflare
    if (!url.pathname.startsWith('/api/')) {
      // This shouldn't happen due to wrangler.toml config, but handle gracefully
      return new Response('Not found', { status: 404 });
    }

    try {
      // Health check
      if (url.pathname === '/api/health') {
        return jsonResponse({
          status: 'ok',
          service: 'slc-ai-advisor',
          timestamp: new Date().toISOString(),
        });
      }

      // API routes will be implemented in subsequent tasks
      // B3: POST /api/session, GET /api/session/:id
      // B5: POST /api/chat
      // B7: GET /api/canvas, PUT /api/canvas/:section
      // B8: GET /api/export/:format

      return jsonResponse({ error: 'Not found' }, 404);
    } catch (error) {
      console.error('API error:', error);
      return jsonResponse({ error: 'Internal server error' }, 500);
    }
  },
};

/**
 * Helper to create JSON responses
 */
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
