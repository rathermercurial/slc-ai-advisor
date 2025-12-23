# Worker (API)

**Status: Stub (B1 complete, B2-B5 pending)**

This is the Cloudflare Worker that will handle API routes. Currently only `/api/health` works - the actual functionality is implemented in Track B tasks.

## Current State

Only the health check endpoint is functional:

```
GET /api/health → { status: "ok", service: "slc-ai-advisor", timestamp: "..." }
```

All other routes return 404 and will be implemented in B2-B5.

## Planned Endpoints (from spec)

| Endpoint | Task | Description |
|----------|------|-------------|
| `POST /api/session` | B3 | Create new session |
| `GET /api/session/:id` | B3 | Get session state |
| `POST /api/chat` | B5 | Send chat message (RAG) |
| `GET /api/canvas` | B7 | Get canvas state |
| `PUT /api/canvas/:section` | B7 | Update canvas section |
| `GET /api/export/:format` | B8 | Export canvas |

## Blocking Dependencies

```
B1 ✅ → B2 (DO schema) → B3 (sessions) → B4 (filtering) → B5 (chat) = DEMO
```

B2 (Durable Object with SQLite schema) is the next step.

## Files

- `index.ts` - Request handler with route stubs
- `env.d.ts` - Extends generated Env interface with secrets

## Development

```bash
npm run dev         # Start local server
npx wrangler types  # Regenerate types after wrangler.toml changes
```

## See Also

- [tasks.md](../spec/slc-ai-advisor-mvp/tasks.md) - B1-B10 task details
- [design.md](../spec/slc-ai-advisor-mvp/design.md) - SQLite schema, Selection Matrix algorithm
- [Issue #10](https://github.com/rathermercurial/slc-ai-advisor/issues/10) - Track B parent issue
