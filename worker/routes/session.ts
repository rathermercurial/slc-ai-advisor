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
import { createLogger, createMetrics } from '../observability';

/**
 * UUID validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Handle session-related API routes
 */
export async function handleSessionRoute(
  request: Request,
  env: Env,
  requestId?: string
): Promise<Response> {
  const logger = createLogger('session-routes', requestId);
  const metrics = createMetrics(env.SLC_ANALYTICS);
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

      // Create default thread for backward compatibility
      // Returns existing thread if one exists
      const defaultThread = await stub.ensureDefaultThread();

      metrics.trackEvent('session_created', { sessionId });

      return jsonResponse({
        sessionId,
        canvasId: sessionId, // Same ID for both
        threadId: defaultThread.id,
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
      // Note: DOs are created on-demand, so we check if it has been initialized
      // by verifying it has a valid createdAt timestamp
      const stub = getCanvasStub(env, sessionId);

      try {
        const canvas = await stub.getFullCanvas();
        // Session exists if canvas has been created (has a createdAt timestamp)
        // Note: This will create an empty canvas for unknown sessions, but that's
        // acceptable since UUIDs are unpredictable. The canvas will be orphaned
        // if the user doesn't use it.
        if (canvas.createdAt) {
          // Get default thread for this canvas
          const defaultThread = await stub.ensureDefaultThread();
          return jsonResponse({
            exists: true,
            sessionId,
            canvasId: sessionId,
            threadId: defaultThread.id,
            completionPercentage: canvas.completionPercentage,
          });
        }
      } catch (error) {
        logger.error('Session check error', error);
        return jsonResponse({ error: 'Failed to check session' }, 500);
      }

      return jsonResponse({ exists: false }, 404);
    }

    return jsonResponse({ error: 'Not found' }, 404);
  } catch (error) {
    logger.error('Session route error', error);
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
