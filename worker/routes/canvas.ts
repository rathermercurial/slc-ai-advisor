/**
 * Canvas API Routes
 *
 * REST endpoints for canvas operations.
 * Routes to CanvasDO via RPC methods.
 * Canvas registry stored in KV (CANVAS_REGISTRY).
 *
 * Routes:
 * - GET /api/canvases - List all canvases (with optional filter query param)
 * - POST /api/canvas - Create new canvas
 * - GET /api/canvas/:id - Get full canvas state
 * - PATCH /api/canvas/:id - Update canvas meta (name, starred, archived)
 * - PUT /api/canvas/:id/section/:key - Update section
 * - GET /api/canvas/:id/model/:model - Get model view
 * - GET /api/canvas/:id/venture-profile - Get venture properties
 * - PUT /api/canvas/:id/venture-profile - Update venture property
 * - GET /api/canvas/:id/properties-for-filtering - Get filtered properties
 * - GET /api/canvas/:id/export/:format - Export canvas
 * - GET /api/canvas/:id/threads - List threads (with filter query param)
 * - POST /api/canvas/:id/threads - Create new thread
 * - PATCH /api/canvas/:id/threads/:threadId - Update thread (name, starred, archived)
 */

import type { CanvasDO } from '../durable-objects/CanvasDO';
import { CANVAS_SECTIONS, type CanvasSectionId } from '../../src/types/canvas';
import type { VentureProperties } from '../../src/types/venture';
import { createLogger, createMetrics } from '../observability';

/**
 * Canvas filter type (for list endpoint)
 */
type CanvasFilter = 'all' | 'active' | 'starred' | 'archived';

const VALID_CANVAS_FILTERS: CanvasFilter[] = ['all', 'active', 'starred', 'archived'];

/**
 * Thread filter type
 */
type ThreadFilter = 'all' | 'active' | 'starred' | 'archived';

const VALID_THREAD_FILTERS: ThreadFilter[] = ['all', 'active', 'starred', 'archived'];

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
 * Canvas metadata stored in registry (KV)
 */
interface CanvasRegistryEntry {
  id: string;
  name: string;
  starred: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * KV key for canvas registry index
 */
const CANVAS_INDEX_KEY = 'canvas-index';

/**
 * Get all canvas IDs from registry
 */
async function getCanvasIndex(kv: KVNamespace): Promise<string[]> {
  const data = await kv.get(CANVAS_INDEX_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data) as string[];
  } catch {
    return [];
  }
}

/**
 * Add canvas ID to registry index
 */
async function addToCanvasIndex(kv: KVNamespace, canvasId: string): Promise<void> {
  const index = await getCanvasIndex(kv);
  if (!index.includes(canvasId)) {
    index.unshift(canvasId); // Add to front (most recent first)
    await kv.put(CANVAS_INDEX_KEY, JSON.stringify(index));
  }
}

/**
 * Get canvas registry entry
 */
async function getCanvasEntry(kv: KVNamespace, canvasId: string): Promise<CanvasRegistryEntry | null> {
  const data = await kv.get(`canvas:${canvasId}`);
  if (!data) return null;
  try {
    return JSON.parse(data) as CanvasRegistryEntry;
  } catch {
    return null;
  }
}

/**
 * Save canvas registry entry
 */
async function saveCanvasEntry(kv: KVNamespace, entry: CanvasRegistryEntry): Promise<void> {
  await kv.put(`canvas:${entry.id}`, JSON.stringify(entry));
}

/**
 * Get all canvases with optional filter
 */
async function listCanvases(kv: KVNamespace, filter: CanvasFilter): Promise<CanvasRegistryEntry[]> {
  const index = await getCanvasIndex(kv);
  const entries: CanvasRegistryEntry[] = [];

  for (const canvasId of index) {
    const entry = await getCanvasEntry(kv, canvasId);
    if (entry) {
      // Apply filter
      switch (filter) {
        case 'active':
          if (!entry.archived) entries.push(entry);
          break;
        case 'starred':
          if (entry.starred) entries.push(entry);
          break;
        case 'archived':
          if (entry.archived) entries.push(entry);
          break;
        default:
          entries.push(entry);
      }
    }
  }

  return entries;
}

/**
 * Handle canvas-related API routes
 */
export async function handleCanvasRoute(
  request: Request,
  env: Env,
  requestId?: string
): Promise<Response> {
  const logger = createLogger('canvas-routes', requestId);
  const metrics = createMetrics(env.SLC_ANALYTICS);
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  // parts: ['api', 'canvas', ...rest] or ['api', 'canvases']

  try {
    // GET /api/canvases - List all canvases
    if (parts.length === 2 && parts[1] === 'canvases' && request.method === 'GET') {
      const filterParam = url.searchParams.get('filter') || 'active';
      const filter = VALID_CANVAS_FILTERS.includes(filterParam as CanvasFilter)
        ? (filterParam as CanvasFilter)
        : 'active';

      const canvases = await listCanvases(env.CANVAS_REGISTRY, filter);
      return jsonResponse(canvases, 200, requestId);
    }

    // POST /api/canvas - Create new canvas
    if (parts.length === 2 && parts[1] === 'canvas' && request.method === 'POST') {
      const canvasId = crypto.randomUUID();
      const stub = getCanvasStub(env, canvasId);

      const canvas = await stub.getFullCanvas();

      // Register in KV
      const now = new Date().toISOString();
      const entry: CanvasRegistryEntry = {
        id: canvasId,
        name: 'Untitled Canvas',
        starred: false,
        archived: false,
        createdAt: now,
        updatedAt: now,
      };
      await saveCanvasEntry(env.CANVAS_REGISTRY, entry);
      await addToCanvasIndex(env.CANVAS_REGISTRY, canvasId);

      metrics.trackEvent('canvas_created', { sessionId: canvasId });

      return jsonResponse({
        canvasId,
        canvas,
      }, 201, requestId);
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

    // PATCH /api/canvas/:id - Update canvas meta (name, starred, archived)
    if (parts.length === 3 && request.method === 'PATCH') {
      const body = await request.json().catch(() => ({})) as {
        name?: string;
        starred?: boolean;
        archived?: boolean;
      };

      const meta = await stub.updateCanvasMeta(body);

      // Update KV registry
      const entry = await getCanvasEntry(env.CANVAS_REGISTRY, canvasId);
      if (entry) {
        const updated: CanvasRegistryEntry = {
          ...entry,
          ...(body.name !== undefined && { name: body.name }),
          ...(body.starred !== undefined && { starred: body.starred }),
          ...(body.archived !== undefined && { archived: body.archived }),
          updatedAt: new Date().toISOString(),
        };
        await saveCanvasEntry(env.CANVAS_REGISTRY, updated);
      }

      return jsonResponse(meta, 200, requestId);
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

      if (result.success) {
        metrics.trackEvent('canvas_updated', { sessionId: canvasId, section: sectionKey });
      }

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

    // GET /api/canvas/:id/meta - Get canvas metadata
    if (parts.length === 4 && parts[3] === 'meta' && request.method === 'GET') {
      const meta = await stub.getCanvasMeta();
      return jsonResponse(meta, 200, requestId);
    }

    // GET /api/canvas/:id/threads - List threads
    if (parts.length === 4 && parts[3] === 'threads' && request.method === 'GET') {
      const filterParam = url.searchParams.get('filter') || 'all';
      const filter = VALID_THREAD_FILTERS.includes(filterParam as ThreadFilter)
        ? (filterParam as ThreadFilter)
        : 'all';

      const threads = await stub.getThreads(filter);
      return jsonResponse(threads, 200, requestId);
    }

    // POST /api/canvas/:id/threads - Create new thread
    if (parts.length === 4 && parts[3] === 'threads' && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as { name?: string };

      try {
        const thread = await stub.createThread(body.name);
        return jsonResponse(thread, 201, requestId);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Maximum')) {
          return jsonResponse({ error: error.message }, 400, requestId);
        }
        throw error;
      }
    }

    // GET /api/canvas/:id/threads/default - Get default thread ID
    if (parts.length === 5 && parts[3] === 'threads' && parts[4] === 'default' && request.method === 'GET') {
      const threadId = await stub.getDefaultThreadId();
      return jsonResponse({ threadId }, 200, requestId);
    }

    // GET /api/canvas/:id/threads/:threadId - Get single thread
    if (parts.length === 5 && parts[3] === 'threads' && request.method === 'GET') {
      const threadId = parts[4];

      if (!UUID_REGEX.test(threadId)) {
        return jsonResponse({ error: 'Invalid thread ID format' }, 400, requestId);
      }

      const thread = await stub.getThread(threadId);
      if (!thread) {
        return jsonResponse({ error: 'Thread not found' }, 404, requestId);
      }

      return jsonResponse(thread, 200, requestId);
    }

    // PATCH /api/canvas/:id/threads/:threadId - Update thread
    if (parts.length === 5 && parts[3] === 'threads' && request.method === 'PATCH') {
      const threadId = parts[4];

      if (!UUID_REGEX.test(threadId)) {
        return jsonResponse({ error: 'Invalid thread ID format' }, 400, requestId);
      }

      const body = await request.json().catch(() => ({})) as {
        name?: string;
        starred?: boolean;
        archived?: boolean;
      };

      try {
        const thread = await stub.updateThread(threadId, body);
        return jsonResponse(thread, 200, requestId);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return jsonResponse({ error: error.message }, 404, requestId);
        }
        throw error;
      }
    }

    return jsonResponse({ error: 'Not found' }, 404, requestId);
  } catch (error) {
    logger.error('Canvas route error', error);
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
