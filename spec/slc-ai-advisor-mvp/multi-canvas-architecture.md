# Multi-Canvas Architecture

Issue #65: Multi-Canvas/Threads Support

## Overview

Users can have multiple canvases (ventures) with multiple conversation threads per canvas. Conversations persist across sessions.

## Architecture

### One SLCAgent Instance Per Thread

Each conversation thread is a separate SLCAgent Durable Object instance. This aligns with Cloudflare Agents SDK design:

- `cf_ai_chat_agent_messages` table has no `thread_id` column
- `saveMessages()` has no thread parameter
- Each DO hibernates independently (cost efficient)

### CanvasDO as Thread Registry

CanvasDO is the authoritative source for:
- Canvas metadata (name, created_at, updated_at)
- Thread registry (id, title, summary, created_at, last_message_at)

### WebSocket Connection

Frontend passes `canvasId` via WebSocket connection URL:
```
/agents/slc-agent/{threadId}?canvasId={canvasId}
```

SLCAgent extracts `canvasId` from connection context.

## Current Implementation: Hybrid Canvas Registry (Option 3)

Canvas list is stored in **localStorage** for fast startup, with **backend verification**.

### How It Works

1. **Startup**: Load canvas list from `localStorage` immediately
2. **Verification**: Call `GET /api/canvas/:id/meta` for each canvas
3. **Cleanup**: Remove stale canvases that no longer exist on backend
4. **Sync**: All create/rename/archive operations update both localStorage and backend

### Files

| File | Purpose |
|------|---------|
| `src/utils/canvasRegistry.ts` | localStorage CRUD + backend verification |
| `src/components/CanvasList.tsx` | Canvas selection UI |
| `src/App.tsx` | Canvas state management, handlers |

### API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/canvas/:id/meta` | Verify canvas exists, get name |
| `PUT` | `/api/canvas/:id/name` | Rename canvas |
| `DELETE` | `/api/canvas/:id` | Archive canvas |
| `POST` | `/api/session` | Create new canvas + thread |

---

## Migration Path: Option 3 → Option 2 (Backend Registry + Auth)

When ready to add authentication and cross-device sync:

### Phase 1: Create UserRegistryDO

```typescript
// worker/durable-objects/UserRegistryDO.ts
import { DurableObject } from 'cloudflare:workers';

export class UserRegistryDO extends DurableObject {
  sql = this.ctx.storage.sql;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS user_canvas (
        canvas_id TEXT PRIMARY KEY,
        name TEXT,
        last_accessed_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_last_accessed ON user_canvas(last_accessed_at DESC);
    `);
  }

  async listCanvases(): Promise<CanvasInfo[]> {
    return this.sql.exec(`
      SELECT canvas_id as id, name, last_accessed_at as lastAccessedAt
      FROM user_canvas
      ORDER BY last_accessed_at DESC
    `).toArray();
  }

  async addCanvas(canvasId: string, name: string): Promise<void> {
    const now = new Date().toISOString();
    this.sql.exec(`
      INSERT INTO user_canvas (canvas_id, name, last_accessed_at, created_at)
      VALUES (?, ?, ?, ?)
    `, canvasId, name, now, now);
  }

  async removeCanvas(canvasId: string): Promise<void> {
    this.sql.exec(`DELETE FROM user_canvas WHERE canvas_id = ?`, canvasId);
  }

  async updateCanvasName(canvasId: string, name: string): Promise<void> {
    this.sql.exec(`UPDATE user_canvas SET name = ? WHERE canvas_id = ?`, name, canvasId);
  }

  async touchCanvas(canvasId: string): Promise<void> {
    this.sql.exec(`
      UPDATE user_canvas SET last_accessed_at = ? WHERE canvas_id = ?
    `, new Date().toISOString(), canvasId);
  }
}
```

Add to `wrangler.toml`:
```toml
[[durable_objects.bindings]]
name = "USER_REGISTRY"
class_name = "UserRegistryDO"

[[migrations]]
tag = "v4"
new_sqlite_classes = ["UserRegistryDO"]
```

### Phase 2: Add API Routes

```typescript
// worker/routes/user.ts

// GET /api/user/canvases
export async function listUserCanvases(env: Env, userId: string) {
  const stub = env.USER_REGISTRY.get(env.USER_REGISTRY.idFromName(userId));
  return stub.listCanvases();
}

// POST /api/user/canvases
export async function addUserCanvas(env: Env, userId: string, canvasId: string, name: string) {
  const stub = env.USER_REGISTRY.get(env.USER_REGISTRY.idFromName(userId));
  await stub.addCanvas(canvasId, name);
}

// DELETE /api/user/canvases/:id
export async function removeUserCanvas(env: Env, userId: string, canvasId: string) {
  const stub = env.USER_REGISTRY.get(env.USER_REGISTRY.idFromName(userId));
  await stub.removeCanvas(canvasId);
  // Note: CanvasDO data is preserved, only registry entry removed
}
```

### Phase 3: Update Frontend

Replace localStorage calls with API calls in `src/App.tsx`:

```typescript
// Before (Option 3 - Hybrid):
import { getLocalCanvases, verifyAllCanvases, addCanvas, ... } from './utils/canvasRegistry';

const localCanvases = getLocalCanvases();
const verified = await verifyAllCanvases();

// After (Option 2 - Backend Registry):
const response = await fetch('/api/user/canvases');
const { canvases } = await response.json();
```

The `canvasRegistry.ts` file can be repurposed as a cache layer:

```typescript
// src/utils/canvasRegistry.ts (updated for Option 2)

export async function loadCanvases(): Promise<CanvasInfo[]> {
  // Try cache first for fast startup
  const cached = getLocalCanvases();

  // Fetch from backend (source of truth)
  const response = await fetch('/api/user/canvases');
  if (response.ok) {
    const { canvases } = await response.json();
    saveLocalCanvases(canvases); // Update cache
    return canvases;
  }

  // Fallback to cache if offline
  return cached;
}
```

### Phase 4: Add Authentication

1. Integrate Cloudflare Access or implement custom auth
2. Extract user ID from auth token/session
3. Derive UserRegistryDO ID from user identity:

```typescript
// worker/index.ts
function getUserId(request: Request): string {
  // Option A: Cloudflare Access
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion');
  if (jwt) {
    const payload = decodeJwt(jwt);
    return payload.sub; // User's unique ID
  }

  // Option B: Custom auth
  const session = request.headers.get('Authorization');
  // ... validate and extract user ID

  // Fallback: anonymous user (browser fingerprint or random)
  return 'anonymous';
}
```

### Backward Compatibility

During migration:
- Keep localStorage as offline cache
- Sync localStorage ↔ backend on init
- Backend is source of truth when connected
- Anonymous users continue working (localStorage only)

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Thread per agent | One SLCAgent instance per thread | Aligns with SDK design, independent hibernation |
| Thread registry | CanvasDO owns thread list | Single source of truth per canvas |
| Canvas registry | Hybrid (localStorage + backend) | Fast startup, verifies on load, easy migration path |
| Deletion | Soft-delete (archive flag) | Preserve data, allow restore |
| Cross-thread context | Thread summaries + sibling access | AI can reference other discussions |

## Related Files

- `worker/durable-objects/CanvasDO.ts` - Thread CRUD, canvas metadata
- `worker/agents/SLCAgent.ts` - Extracts canvasId from connection
- `worker/routes/canvas.ts` - Thread and canvas API endpoints
- `worker/agents/tools/meta/get-thread-context.ts` - Cross-thread access tool
- `src/components/ThreadList.tsx` - Thread selection UI
- `src/components/CanvasList.tsx` - Canvas selection UI
- `src/utils/canvasRegistry.ts` - localStorage helpers
