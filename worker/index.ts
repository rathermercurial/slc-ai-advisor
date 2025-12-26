/**
 * SLC AI Advisor - Worker Entry Point
 *
 * Two-component architecture:
 * - SLCAgent: AI conversation orchestrator (extends AIChatAgent)
 * - CanvasDO: Goal artifact with Model Managers
 *
 * Routes:
 * - GET /api/health - Health check with dependency status
 * - /api/canvas/* - Canvas CRUD operations
 * - /agents/* - Agent WebSocket connections (Agents SDK)
 */

import { routeAgentRequest } from 'agents';

// Export Durable Objects for wrangler
export { CanvasDO } from './durable-objects/CanvasDO';
export { SLCAgent } from './agents/SLCAgent';

// Import route handlers
import { handleCanvasRoute } from './routes/canvas';
import { handleSessionRoute } from './routes/session';
import { createLogger, createMetrics, getOrCreateRequestId } from './observability';

// Env interface extended in worker/env.d.ts

export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const requestId = getOrCreateRequestId(request);
    const logger = createLogger('worker', requestId);
    const metrics = createMetrics(env.ANALYTICS);
    const startTime = Date.now();

    try {
      // Route agent requests (WebSocket for chat)
      if (url.pathname.startsWith('/agents/')) {
        logger.info('Routing to agent', { path: url.pathname });
        return routeAgentRequest(request, env);
      }

      // Handle /api/* routes
      if (url.pathname.startsWith('/api/')) {
        // Health check with dependency status
        if (url.pathname === '/api/health') {
          const health = await checkHealth(env);
          const status = health.dependencies.every(d => d.status === 'ok') ? 200 : 503;
          return jsonResponse(health, status, requestId);
        }

        // Session routes
        if (url.pathname.startsWith('/api/session')) {
          return handleSessionRoute(request, env);
        }

        // Canvas routes
        if (url.pathname.startsWith('/api/canvas')) {
          logger.info('Routing to canvas', { path: url.pathname, method: request.method });
          const response = await handleCanvasRoute(request, env, requestId);
          logger.info('Request completed', {
            path: url.pathname,
            method: request.method,
            status: response.status,
            durationMs: Date.now() - startTime,
          });
          return response;
        }

        logger.warn('Route not found', { path: url.pathname });
        return jsonResponse({ error: 'Not found' }, 404, requestId);
      }

      // This shouldn't happen due to wrangler.toml config
      return new Response('Not found', { status: 404 });
    } catch (error) {
      logger.error('Request failed', error, {
        path: url.pathname,
        method: request.method,
        durationMs: Date.now() - startTime,
      });
      metrics.trackEvent('error', {
        sessionId: requestId,
        errorType: error instanceof Error ? error.name : 'UnknownError',
        durationMs: Date.now() - startTime,
        success: false,
      });
      const message = error instanceof Error ? error.message : 'Unknown error';
      return jsonResponse({ error: 'Internal server error', message }, 500, requestId);
    }
  },
};

/**
 * Check health of all dependencies
 */
async function checkHealth(env: Env): Promise<{
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  timestamp: string;
  dependencies: Array<{ name: string; status: 'ok' | 'error'; message?: string }>;
}> {
  const dependencies: Array<{ name: string; status: 'ok' | 'error'; message?: string }> = [];

  // Check Vectorize binding
  if (env.VECTORIZE) {
    dependencies.push({ name: 'vectorize', status: 'ok' });
  } else {
    dependencies.push({ name: 'vectorize', status: 'error', message: 'Binding not available' });
  }

  // Check AI binding
  if (env.AI) {
    dependencies.push({ name: 'ai', status: 'ok' });
  } else {
    dependencies.push({ name: 'ai', status: 'error', message: 'Binding not available' });
  }

  // Check Durable Objects bindings
  if (env.CANVAS) {
    dependencies.push({ name: 'canvas-do', status: 'ok' });
  } else {
    dependencies.push({ name: 'canvas-do', status: 'error', message: 'Binding not available' });
  }

  if (env.SLC_AGENT) {
    dependencies.push({ name: 'slc-agent-do', status: 'ok' });
  } else {
    dependencies.push({ name: 'slc-agent-do', status: 'error', message: 'Binding not available' });
  }

  // Check Analytics Engine binding
  if (env.ANALYTICS) {
    dependencies.push({ name: 'analytics-engine', status: 'ok' });
  } else {
    dependencies.push({ name: 'analytics-engine', status: 'error', message: 'Binding not available' });
  }

  const allOk = dependencies.every(d => d.status === 'ok');

  return {
    status: allOk ? 'ok' : 'degraded',
    service: 'slc-ai-advisor',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    dependencies,
  };
}

/**
 * Helper to create JSON responses with request ID header
 */
function jsonResponse(data: unknown, status = 200, requestId?: string): Response {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (requestId) {
    headers['X-Request-ID'] = requestId;
  }
  return new Response(JSON.stringify(data), { status, headers });
}
