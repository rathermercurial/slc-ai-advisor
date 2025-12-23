# API Worker

Cloudflare Worker handling API routes for the SLC AI Advisor.

## Structure

- `index.ts` - Request handler and routing
- `env.d.ts` - Environment type extensions

## Key Features

- Chat API with RAG (Selection Matrix)
- Canvas CRUD operations
- Session management via Durable Objects

## Development

```bash
npx wrangler dev      # Local development
npx wrangler types    # Regenerate types
wrangler deploy       # Deploy to Cloudflare
```
