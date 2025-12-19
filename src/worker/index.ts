/**
 * SLC AI Advisor - Cloudflare Worker Entry Point
 *
 * This Worker handles API requests for the SLC AI Advisor application.
 * Routes requests to appropriate handlers and manages CORS.
 */

import { UserSession } from '../durable-objects/UserSession';

export { UserSession };

export interface Env {
  // Vectorize index for knowledge base search
  VECTORIZE: Vectorize;

  // Durable Object for session state
  USER_SESSION: DurableObjectNamespace;

  // Workers AI for embeddings
  AI: Ai;

  // Anthropic API key (set via wrangler secret)
  ANTHROPIC_API_KEY: string;
}

// CORS headers for cross-origin requests from Pages frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    try {
      // Health check endpoint
      if (url.pathname === '/health' || url.pathname === '/') {
        return jsonResponse({
          status: 'ok',
          service: 'slc-ai-advisor',
          timestamp: new Date().toISOString(),
        });
      }

      // API routes will be added here
      // POST /api/session - Create new session
      // GET /api/session/:id - Get session
      // POST /api/chat - Send chat message
      // GET /api/canvas - Get canvas state
      // PUT /api/canvas/:section - Update canvas section
      // GET /api/export/:format - Export canvas

      return jsonResponse({ error: 'Not found' }, 404);
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse(
        { error: 'Internal server error' },
        500
      );
    }
  },
};

/**
 * Helper to create JSON responses with CORS headers
 */
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}
