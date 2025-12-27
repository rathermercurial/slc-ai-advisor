/**
 * Canvas API Routes
 *
 * REST endpoints for canvas operations.
 * Routes to CanvasDO via RPC methods.
 *
 * Routes:
 * - POST /api/canvas - Create new canvas
 * - GET /api/canvas/:id - Get full canvas state
 * - PUT /api/canvas/:id/section/:key - Update section
 * - GET /api/canvas/:id/model/:model - Get model view
 * - GET /api/canvas/:id/venture-profile - Get venture properties
 * - PUT /api/canvas/:id/venture-profile - Update venture property
 * - GET /api/canvas/:id/properties-for-filtering - Get filtered properties
 * - GET /api/canvas/:id/export/:format - Export canvas
 */

import type { CanvasDO } from '../durable-objects/CanvasDO';
import { CANVAS_SECTIONS, type CanvasSectionId } from '../../src/types/canvas';
import type { VentureProperties } from '../../src/types/venture';

/**
 * UUID validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Valid venture property keys
 */
const VALID_PROPERTIES: (keyof VentureProperties)[] = [
  'ventureStage',
  'impactAreas',
  'impactMechanisms',
  'legalStructure',
  'revenueSources',
  'fundingSources',
  'industries',
];

/**
 * Maximum content length (50KB)
 */
const MAX_CONTENT_LENGTH = 50000;

/**
 * Handle canvas-related API routes
 */
export async function handleCanvasRoute(
  request: Request,
  env: Env,
  requestId?: string
): Promise<Response> {
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  // parts: ['api', 'canvas', ...rest]

  try {
    // POST /api/canvas - Create new canvas
    if (parts.length === 2 && request.method === 'POST') {
      const canvasId = crypto.randomUUID();
      const stub = getCanvasStub(env, canvasId);

      const canvas = await stub.getFullCanvas();

      return jsonResponse({
        canvasId,
        canvas,
      }, 200, requestId);
    }

    // All other routes require a canvas ID
    if (parts.length < 3) {
      return jsonResponse({ error: 'Canvas ID required' }, 400, requestId);
    }

    const canvasId = parts[2];

    // Validate canvas ID format
    if (!UUID_REGEX.test(canvasId)) {
      return jsonResponse({ error: 'Invalid canvas ID format' }, 400, requestId);
    }

    const stub = getCanvasStub(env, canvasId);

    // GET /api/canvas/:id - Get full canvas
    if (parts.length === 3 && request.method === 'GET') {
      const canvas = await stub.getFullCanvas();
      return jsonResponse(canvas, 200, requestId);
    }

    // PUT /api/canvas/:id/section/:key - Update section
    if (parts.length === 5 && parts[3] === 'section' && request.method === 'PUT') {
      const sectionKey = parts[4];

      // Validate section key
      if (!CANVAS_SECTIONS.includes(sectionKey as CanvasSectionId)) {
        return jsonResponse({ error: `Invalid section: ${sectionKey}` }, 400, requestId);
      }

      const body = await request.json().catch(() => ({})) as { content?: string };
      if (typeof body.content !== 'string') {
        return jsonResponse({ error: 'content is required' }, 400, requestId);
      }

      // Validate content length
      if (body.content.length > MAX_CONTENT_LENGTH) {
        return jsonResponse({ error: 'Content too large (max 50KB)' }, 413, requestId);
      }

      const result = await stub.updateSection(sectionKey as CanvasSectionId, body.content);
      // Return 422 Unprocessable Entity for validation failures
      const status = result.success ? 200 : 422;
      return jsonResponse(result, status, requestId);
    }

    // PUT /api/canvas/:id/impact - Update full impact model
    if (parts.length === 4 && parts[3] === 'impact' && request.method === 'PUT') {
      const body = await request.json().catch(() => ({})) as {
        issue?: string;
        participants?: string;
        activities?: string;
        outputs?: string;
        shortTermOutcomes?: string;
        mediumTermOutcomes?: string;
        longTermOutcomes?: string;
        impact?: string;
        sessionId?: string;
      };

      const result = await stub.updateFullImpactModel({
        sessionId: body.sessionId || canvasId,
        issue: body.issue || '',
        participants: body.participants || '',
        activities: body.activities || '',
        outputs: body.outputs || '',
        shortTermOutcomes: body.shortTermOutcomes || '',
        mediumTermOutcomes: body.mediumTermOutcomes || '',
        longTermOutcomes: body.longTermOutcomes || '',
        impact: body.impact || '',
        isComplete: false, // Will be calculated in the method
        updatedAt: new Date().toISOString(),
      });

      return jsonResponse(result);
    }

    // GET /api/canvas/:id/model/:model - Get model view
    if (parts.length === 5 && parts[3] === 'model' && request.method === 'GET') {
      const model = parts[4];

      switch (model) {
        case 'customer':
          return jsonResponse(await stub.getCustomerModel(), 200, requestId);
        case 'economic':
          return jsonResponse(await stub.getEconomicModel(), 200, requestId);
        case 'impact':
          return jsonResponse(await stub.getImpactModel(), 200, requestId);
        default:
          return jsonResponse({ error: `Unknown model: ${model}` }, 400, requestId);
      }
    }

    // GET /api/canvas/:id/venture-profile - Get venture profile
    if (parts.length === 4 && parts[3] === 'venture-profile' && request.method === 'GET') {
      const profile = await stub.getVentureProfile();
      return jsonResponse(profile, 200, requestId);
    }

    // PUT /api/canvas/:id/venture-profile - Update property
    if (parts.length === 4 && parts[3] === 'venture-profile' && request.method === 'PUT') {
      const body = await request.json().catch(() => ({})) as {
        property?: keyof VentureProperties;
        value?: string | string[] | null;
        confidence?: number;
        confirmed?: boolean;
      };

      if (!body.property) {
        return jsonResponse({ error: 'property is required' }, 400, requestId);
      }

      // Validate property key
      if (!VALID_PROPERTIES.includes(body.property)) {
        return jsonResponse({ error: `Invalid property: ${body.property}` }, 400, requestId);
      }

      await stub.updateVentureProperty(
        body.property,
        body.value ?? null,
        body.confidence,
        body.confirmed
      );

      const profile = await stub.getVentureProfile();
      return jsonResponse(profile, 200, requestId);
    }

    // GET /api/canvas/:id/properties-for-filtering - Get filtered properties
    if (parts.length === 4 && parts[3] === 'properties-for-filtering' && request.method === 'GET') {
      const properties = await stub.getPropertiesForFiltering();
      return jsonResponse(properties, 200, requestId);
    }

    // GET /api/canvas/:id/export/:format - Export canvas
    if (parts.length === 5 && parts[3] === 'export' && request.method === 'GET') {
      const format = parts[4];

      if (format !== 'json' && format !== 'md') {
        return jsonResponse({ error: 'Format must be json or md' }, 400, requestId);
      }

      const exported = await stub.exportCanvas(format);
      const headers: Record<string, string> = {
        'Content-Disposition': `attachment; filename="canvas-${canvasId}.${format}"`,
      };

      if (requestId) {
        headers['X-Request-ID'] = requestId;
      }

      if (format === 'json') {
        headers['Content-Type'] = 'application/json';
        return new Response(exported, { headers });
      }

      headers['Content-Type'] = 'text/markdown';
      return new Response(exported, { headers });
    }

    // PUT /api/canvas/:id/current-section - Set current section
    if (parts.length === 4 && parts[3] === 'current-section' && request.method === 'PUT') {
      const body = await request.json().catch(() => ({})) as { section?: CanvasSectionId | null };

      // Validate section if provided
      if (body.section !== null && body.section !== undefined) {
        if (!CANVAS_SECTIONS.includes(body.section)) {
          return jsonResponse({ error: `Invalid section: ${body.section}` }, 400, requestId);
        }
      }

      await stub.setCurrentSection(body.section ?? null);

      return jsonResponse({ success: true }, 200, requestId);
    }

    return jsonResponse({ error: 'Not found' }, 404, requestId);
  } catch (error) {
    console.error('Canvas route error:', error);
    return jsonResponse(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      500,
      requestId
    );
  }
}

/**
 * Get CanvasDO stub by canvas ID
 */
function getCanvasStub(env: Env, canvasId: string): DurableObjectStub<CanvasDO> {
  return env.CANVAS.get(env.CANVAS.idFromName(canvasId)) as DurableObjectStub<CanvasDO>;
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
