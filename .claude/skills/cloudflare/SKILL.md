---
name: cloudflare-workers
description: Generates TypeScript code for Cloudflare Workers, Pages, D1, KV, R2, Durable Objects, Queues, Vectorize, and Workers AI. Activate when creating workers, configuring bindings, or deploying to Cloudflare.
---

# Cloudflare Workers Development

## Code Standards

- ES modules (not CommonJS)
- TypeScript with strict types
- Single-file Workers by default
- Minimal dependencies

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
  "main": "src/index.ts",
  "compatibility_date": "2025-03-07",
  "compatibility_flags": ["nodejs_compat"],
  "observability": { "enabled": true }
}
```

## References

- [REFERENCE.md](REFERENCE.md) — Binding APIs (KV, D1, R2, Durable Objects, Queues, Vectorize, Workers AI)
- [EXAMPLES.md](EXAMPLES.md) — Full working examples (API, RAG, WebSocket, Queue consumer)
