---
name: cloudflare-workers
description: |
  Generates TypeScript for Cloudflare Workers with Durable Objects (SQLite),
  Vectorize, Agents SDK, and AI Gateway. Activate when creating workers,
  configuring bindings, implementing chat agents, or adding vector search.
  Project uses: bge-m3 (1024-dim), WebSocket hibernation, useAgentChat.
---

# Cloudflare Workers Development

## Project Stack

This project (SLC AI Advisor) uses:
- **Durable Objects** with SQLite backend for session state
- **Vectorize** with bge-m3 embeddings (1024-dim) and metadata filtering
- **Agents SDK** with `useAgentChat` hook on frontend
- **AI Gateway** for Anthropic API routing

## Code Standards

- ES modules exclusively (never CommonJS or Service Worker format)
- TypeScript with strict types
- Single-file Workers by default
- Import all methods and types explicitly
- Never embed secrets in code

### Basic Structure
```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handler implementation
  }
} satisfies ExportedHandler<Env>;
```

### Configuration (wrangler.jsonc)
```jsonc
{
  "name": "worker-name",
  "main": "worker/index.ts",
  "compatibility_date": "2025-03-07",
  "compatibility_flags": ["nodejs_compat"],
  "observability": { "enabled": true },
  "durable_objects": {
    "bindings": [{ "name": "USER_SESSION", "class_name": "UserSession" }]
  },
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["UserSession"] }
  ]
}
```

## References

| File | Purpose |
|------|---------|
| [REFERENCE.md](REFERENCE.md) | Binding APIs (KV, D1, R2, Durable Objects, Queues, Vectorize, Workers AI) |
| [EXAMPLES.md](EXAMPLES.md) | Full working examples (API, RAG, WebSocket, Queue consumer) |
| [DURABLE-OBJECTS.md](DURABLE-OBJECTS.md) | SQLite storage, WebSocket hibernation, alarms |
| [VECTORIZE.md](VECTORIZE.md) | Metadata filtering, query patterns, batch insertion |
| [AGENTS-SDK.md](AGENTS-SDK.md) | AIChatAgent, useAgentChat, state management |
| [AI-GATEWAY.md](AI-GATEWAY.md) | Routing, caching, unified API |
| [MCP-PATTERNS.md](MCP-PATTERNS.md) | When to use each MCP server |
