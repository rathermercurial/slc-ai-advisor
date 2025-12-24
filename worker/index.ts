/**
 * SLC AI Advisor - Worker Entry Point
 *
 * Handles API routes for the SLC AI Advisor.
 * Static assets (React app) are served automatically by Cloudflare.
 *
 * Routes:
 * - GET  /api/health - Health check
 * - POST /api/session - Create new session (B3)
 * - GET  /api/session/:id - Get session (B3)
 * - GET  /api/session/:id/messages - Get chat history (C3)
 * - GET  /api/session/:id/canvas - Get full canvas state (B7)
 * - PUT  /api/session/:id/canvas/:section - Update canvas section (B7)
 * - PUT  /api/session/:id/canvas/impact-model - Update impact model (B7)
 * - POST /api/chat - Send chat message (B5)
 * - GET  /api/export/:format - Export canvas (B8) - TODO
 */

// Export Durable Objects for wrangler
import { UserSession } from './durable-objects/UserSession';
export { UserSession };

// Import route handlers
import { handleChat } from './routes/chat';

// Env interface extended in worker/env.d.ts

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

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

      // ============================================
      // B7: Canvas CRUD
      // ============================================

      // Get full canvas state (sections + impactModel)
      if (url.pathname.match(/^\/api\/session\/[^/]+\/canvas$/) && request.method === 'GET') {
        const sessionId = url.pathname.split('/')[3];

        const stub = env.USER_SESSION.get(
          env.USER_SESSION.idFromName(sessionId)
        );

        // Fetch sections and impact model in parallel
        const [sectionsRes, impactRes, sessionRes] = await Promise.all([
          stub.fetch(new Request('http://internal/canvas-sections')),
          stub.fetch(new Request('http://internal/model/impact')),
          stub.fetch(new Request('http://internal/session')),
        ]);

        const sections = await sectionsRes.json();
        const impactModel = await impactRes.json();
        const session = await sessionRes.json() as { id: string; current_section?: string; created_at?: string; updated_at?: string };

        // Calculate completion percentage
        const sectionArray = sections as Array<{ isComplete: boolean }>;
        const completedCount = sectionArray.filter(s => s.isComplete).length;
        const completionPercentage = Math.round((completedCount / 11) * 100);

        // Return full CanvasState per design.md
        return jsonResponse({
          sessionId,
          sections,
          impactModel,
          currentSection: session.current_section || null,
          completionPercentage,
          createdAt: session.created_at,
          updatedAt: session.updated_at,
        });
      }

      // Update canvas section
      if (url.pathname.match(/^\/api\/session\/[^/]+\/canvas\/[^/]+$/) && request.method === 'PUT') {
        const parts = url.pathname.split('/');
        const sessionId = parts[3];
        const sectionKey = parts[5];

        // Validate section key
        const validSections = [
          'purpose', 'customers', 'jobsToBeDone', 'valueProposition',
          'solution', 'channels', 'revenue', 'costs', 'keyMetrics',
          'advantage', 'impact'
        ];
        if (!validSections.includes(sectionKey)) {
          return jsonResponse({ error: `Invalid section: ${sectionKey}` }, 400);
        }

        const body = await request.json() as { content: string };
        if (typeof body.content !== 'string') {
          return jsonResponse({ error: 'content is required' }, 400);
        }

        const stub = env.USER_SESSION.get(
          env.USER_SESSION.idFromName(sessionId)
        );

        const response = await stub.fetch(new Request(`http://internal/canvas-section/${sectionKey}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: body.content }),
        }));

        if (!response.ok) {
          return jsonResponse({ error: 'Failed to update section' }, 500);
        }

        return jsonResponse({ success: true, sectionKey });
      }

      // Update impact model (all fields or specific field)
      if (url.pathname.match(/^\/api\/session\/[^/]+\/canvas\/impact-model$/) && request.method === 'PUT') {
        const sessionId = url.pathname.split('/')[3];

        const body = await request.json() as {
          field?: string;
          content?: string;
          // Or full update with all fields
          issue?: string;
          participants?: string;
          activities?: string;
          outputs?: string;
          shortTermOutcomes?: string;
          mediumTermOutcomes?: string;
          longTermOutcomes?: string;
          impact?: string;
        };

        const stub = env.USER_SESSION.get(
          env.USER_SESSION.idFromName(sessionId)
        );

        // Single field update
        if (body.field && body.content !== undefined) {
          const validFields = [
            'issue', 'participants', 'activities', 'outputs',
            'shortTermOutcomes', 'mediumTermOutcomes', 'longTermOutcomes', 'impact'
          ];
          if (!validFields.includes(body.field)) {
            return jsonResponse({ error: `Invalid field: ${body.field}` }, 400);
          }

          await stub.fetch(new Request('http://internal/impact-model-field', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ field: body.field, content: body.content }),
          }));

          return jsonResponse({ success: true, field: body.field });
        }

        // Full update - update each provided field
        const fields = ['issue', 'participants', 'activities', 'outputs',
                       'shortTermOutcomes', 'mediumTermOutcomes', 'longTermOutcomes', 'impact'] as const;

        for (const field of fields) {
          if (body[field] !== undefined) {
            await stub.fetch(new Request('http://internal/impact-model-field', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ field, content: body[field] }),
            }));
          }
        }

        return jsonResponse({ success: true });
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
