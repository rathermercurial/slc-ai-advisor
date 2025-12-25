/**
 * SLC AI Advisor - Worker Entry Point
 *
 * Two-component architecture:
 * - SLCAgent: AI conversation orchestrator (extends AIChatAgent)
 * - CanvasDO: Goal artifact with Model Managers
 *
 * Routes:
 * - GET /api/health - Health check
 * - /api/canvas/* - Canvas CRUD operations
 * - /agents/* - Agent WebSocket connections (Agents SDK)
 */

import { routeAgentRequest } from 'agents';

// Export Durable Objects for wrangler
export { CanvasDO } from './durable-objects/CanvasDO';
export { SLCAgent } from './agents/SLCAgent';

// Import route handlers
import { handleCanvasRoute } from './routes/canvas';

// Env interface extended in worker/env.d.ts

export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    try {
      // Route agent requests (WebSocket for chat)
      if (url.pathname.startsWith('/agents/')) {
        return routeAgentRequest(request, env);
      }

      // Handle /api/* routes
      if (url.pathname.startsWith('/api/')) {
        // Health check
        if (url.pathname === '/api/health') {
          return jsonResponse({
            status: 'ok',
            service: 'slc-ai-advisor',
            version: '2.0.0', // Phase 0 architecture
            timestamp: new Date().toISOString(),
          });
        }

        // Canvas routes
        if (url.pathname.startsWith('/api/canvas')) {
          return handleCanvasRoute(request, env);
        }

        return jsonResponse({ error: 'Not found' }, 404);
      }

      // This shouldn't happen due to wrangler.toml config
      return new Response('Not found', { status: 404 });
    } catch (error) {
      console.error('API error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return jsonResponse({ error: 'Internal server error', message }, 500);
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
