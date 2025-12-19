---
name: cloudflare-workers
description: Use this skill when working with Cloudflare Workers, Pages, D1, KV, R2, Durable Objects, Queues, Vectorize, or Workers AI. Generates production-ready TypeScript code following Cloudflare best practices.
---

# Cloudflare Workers Development

This skill provides guidance for building applications on Cloudflare's edge computing platform.

## When to Use

Activate this skill when:
- Creating or modifying Cloudflare Workers
- Working with Cloudflare bindings (D1, KV, R2, Durable Objects, Queues, Vectorize)
- Deploying to Cloudflare Pages
- Integrating Workers AI
- Configuring wrangler.toml/wrangler.jsonc

## Code Standards

### General
- Use ES modules (not CommonJS)
- Use TypeScript with strict types
- Single-file Workers by default
- Minimal dependencies

### Exports
```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handler implementation
  }
} satisfies ExportedHandler<Env>;
```

### Environment Types
```typescript
interface Env {
  MY_KV: KVNamespace;
  MY_D1: D1Database;
  MY_R2: R2Bucket;
  MY_DO: DurableObjectNamespace;
  MY_QUEUE: Queue;
  AI: Ai;
}
```

## Configuration

### wrangler.jsonc
```jsonc
{
  "name": "worker-name",
  "main": "src/index.ts",
  "compatibility_date": "2025-03-07",
  "compatibility_flags": ["nodejs_compat"],
  "observability": { "enabled": true }
}
```

## See Also

- `REFERENCE.md` - Quick reference for bindings
- `EXAMPLES.md` - Common patterns
