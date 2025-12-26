/**
 * Session API Routes
 *
 * Session management for the SLC AI Advisor.
 * Sessions are mapped 1:1 with canvases - the sessionId IS the canvasId.
 *
 * Routes:
 * - POST /api/session - Create new session (and canvas)
 * - GET /api/session/:id - Check if session exists
 */

import type { CanvasDO } from '../durable-objects/CanvasDO';

/**
 * UUID validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Handle session-related API routes
 */
export async function handleSessionRoute(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  // parts: ['api', 'session', ...rest]

  try {
    // POST /api/session - Create new session
    if (parts.length === 2 && request.method === 'POST') {
      // Generate a single UUID that serves as both sessionId and canvasId
      const sessionId = crypto.randomUUID();

      // Parse optional program from body
      const body = await request.json().catch(() => ({})) as { program?: string };
      const program = body.program || 'generic';

      // Create canvas DO with this ID (implicitly creates it on first access)
      const stub = getCanvasStub(env, sessionId);

      // Initialize the canvas by calling getFullCanvas (this triggers ensureInitialized)
      await stub.getFullCanvas();

      return jsonResponse({
        sessionId,
        canvasId: sessionId, // Same ID for both
        program,
      });
    }

    // GET /api/session/:id - Check if session exists
    if (parts.length === 3 && request.method === 'GET') {
      const sessionId = parts[2];

      // Validate session ID format
      if (!UUID_REGEX.test(sessionId)) {
        return jsonResponse({ error: 'Invalid session ID format' }, 400);
      }

      // Check if canvas exists by trying to fetch it
      // Since DOs are created on-demand, we check if it has been initialized
      const stub = getCanvasStub(env, sessionId);

      try {
        const canvas = await stub.getFullCanvas();
        // Session exists if canvas has been created (has a createdAt timestamp)
        if (canvas.createdAt) {
          return jsonResponse({
            exists: true,
            sessionId,
            canvasId: sessionId,
            completionPercentage: canvas.completionPercentage,
          });
        }
      } catch {
        // Canvas doesn't exist or error occurred
      }

      return jsonResponse({ exists: false }, 404);
    }

    return jsonResponse({ error: 'Not found' }, 404);
  } catch (error) {
    console.error('Session route error:', error);
    return jsonResponse(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}

/**
 * Get CanvasDO stub by session/canvas ID
 */
function getCanvasStub(env: Env, id: string): DurableObjectStub<CanvasDO> {
  return env.CANVAS.get(env.CANVAS.idFromName(id)) as DurableObjectStub<CanvasDO>;
}

/**
 * Helper to create JSON responses
 */
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
