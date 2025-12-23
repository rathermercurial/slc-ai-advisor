/**
 * SLC AI Advisor - Worker Entry Point
 *
 * Handles API routes and agent requests for the SLC AI Advisor.
 * Static assets (React app) are served automatically by Cloudflare.
 *
 * Routes:
 * - /agents/* - WebSocket connections for ChatAgent (Agents SDK)
 * - GET /api/health - Health check
 * - POST /api/session - Create new session (B3)
 * - GET /api/session/:id - Get session (B3)
 * - GET /api/session/:id/messages - Get chat history (C3)
 * - POST /api/chat - Send chat message (B5) [legacy, prefer /agents/]
 * - GET /api/canvas - Get canvas state (B7)
 * - PUT /api/canvas/:section - Update canvas section (B7)
 * - GET /api/export/:format - Export canvas (B8)
 */

import { routeAgentRequest } from 'agents';

// Export Durable Objects for wrangler
import { UserSession } from './durable-objects/UserSession';
import { ChatAgent } from './agents/ChatAgent';
export { UserSession, ChatAgent };

// Import route handlers
import { handleChat } from './routes/chat';

// Env interface extended in worker/env.d.ts

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Route agent requests (WebSocket + HTTP for ChatAgent)
    if (url.pathname.startsWith('/agents/')) {
      return routeAgentRequest(request, env);
    }

    // Handle /api/* routes
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

      // ============================================
      // B3: Session Management
      // ============================================

      // Create new session
      if (url.pathname === '/api/session' && request.method === 'POST') {
        const sessionId = crypto.randomUUID();
        const body = await request.json().catch(() => ({})) as { program?: string };
        const program = body.program || 'generic';

        // Get Durable Object stub and initialize session
        const stub = env.USER_SESSION.get(
          env.USER_SESSION.idFromName(sessionId)
        );

        await stub.fetch(new Request('http://internal/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, program }),
        }));

        return jsonResponse({ sessionId, program });
      }

      // Get session state
      if (url.pathname.match(/^\/api\/session\/[^/]+$/) && request.method === 'GET') {
        const sessionId = url.pathname.split('/')[3];

        const stub = env.USER_SESSION.get(
          env.USER_SESSION.idFromName(sessionId)
        );

        const response = await stub.fetch(new Request('http://internal/session'));
        const session = await response.json();

        if (!session || !session.id) {
          return jsonResponse({ error: 'Session not found' }, 404);
        }

        return jsonResponse(session);
      }

      // Get venture profile
      if (url.pathname.match(/^\/api\/session\/[^/]+\/venture-profile$/) && request.method === 'GET') {
        const sessionId = url.pathname.split('/')[3];

        const stub = env.USER_SESSION.get(
          env.USER_SESSION.idFromName(sessionId)
        );

        const response = await stub.fetch(new Request('http://internal/venture-profile'));
        const profile = await response.json();

        return jsonResponse(profile);
      }

      // Get canvas sections
      if (url.pathname.match(/^\/api\/session\/[^/]+\/canvas$/) && request.method === 'GET') {
        const sessionId = url.pathname.split('/')[3];

        const stub = env.USER_SESSION.get(
          env.USER_SESSION.idFromName(sessionId)
        );

        const response = await stub.fetch(new Request('http://internal/canvas-sections'));
        const sections = await response.json();

        return jsonResponse(sections);
      }

      // Get model (grouped view)
      if (url.pathname.match(/^\/api\/session\/[^/]+\/model\/[^/]+$/) && request.method === 'GET') {
        const parts = url.pathname.split('/');
        const sessionId = parts[3];
        const model = parts[5];

        const stub = env.USER_SESSION.get(
          env.USER_SESSION.idFromName(sessionId)
        );

        const response = await stub.fetch(new Request(`http://internal/model/${model}`));
        const data = await response.json();

        return jsonResponse(data);
      }

      // Get chat messages
      if (url.pathname.match(/^\/api\/session\/[^/]+\/messages$/) && request.method === 'GET') {
        const sessionId = url.pathname.split('/')[3];
        const limit = url.searchParams.get('limit') || '50';

        const stub = env.USER_SESSION.get(
          env.USER_SESSION.idFromName(sessionId)
        );

        const response = await stub.fetch(
          new Request(`http://internal/messages?limit=${limit}`)
        );
        const messages = await response.json();

        return jsonResponse(messages);
      }

      // ============================================
      // B5: Chat with RAG
      // ============================================

      if (url.pathname === '/api/chat' && request.method === 'POST') {
        return handleChat(request, env);
      }

      // B7: PUT /api/canvas/:section - To be implemented
      // B8: GET /api/export/:format - To be implemented

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
