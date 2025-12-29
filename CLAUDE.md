# CLAUDE.md

Instructions for Claude Code when working with this repository.

## Project Overview

AI advisor for social entrepreneurs using the Social Lean Canvas methodology. Filters a knowledge base using multi-dimensional venture analysis (the Selection Matrix).

**Core Innovation:** Filter examples by 7 venture dimensions before semantic search. Early-stage healthcare ventures get healthcare examples at similar stages, not keyword matches from unrelated contexts.

## Key Concepts

- **11 Canvas Sections**: Purpose, Customers, Jobs To Be Done, Value Proposition, Solution, Channels, Revenue, Costs, Key Metrics, Advantage, Impact
- **3 Models**: Customer (customers, jobsToBeDone, valueProposition, solution), Economic (channels, revenue, costs, advantage), Impact (impact)
- **7 Dimensions**: Stage, impact area, mechanism, legal structure, revenue source, funding source, industry
- **Impact Model**: The impact section contains 8-field causality chain (issue → participants → activities → outputs → outcomes → impact)

## Architecture

Two-component separation. Single Cloudflare Worker (Workers Static Assets). No CORS needed.

```
Worker (entry) → SLCAgent (orchestrator, extends AIChatAgent)
              → CanvasDO (goal artifact, extends DurableObject)
              → Vectorize (1024-dim embeddings, bge-m3)
              → Anthropic (Claude via AI Gateway)
```

- **SLCAgent**: Conversation + tool execution. Has own `this.sql` for messages. One instance per thread.
- **CanvasDO**: Canvas state + thread registry. Stores sections, venture profile, threads.

### Multi-Canvas/Thread Architecture

```
User → Canvas 1 → Thread A → SLCAgent A (WebSocket)
                → Thread B → SLCAgent B (WebSocket)
     → Canvas 2 → Thread C → SLCAgent C (WebSocket)
```

- **One SLCAgent per thread**: Agents SDK pattern, each thread is separate DO instance
- **CanvasDO as thread registry**: Stores thread metadata (title, summary, starred, archived)
- **Canvas registry**: localStorage + backend verification (see `src/utils/canvasRegistry.ts`)
- **WebSocket URL**: `/agents/slc-agent/{threadId}?canvasId={canvasId}`

See [multi-canvas-architecture.md](spec/slc-ai-advisor-mvp/multi-canvas-architecture.md) for migration path to authenticated backend registry.

**Stack:**
- Frontend: React 19 + Vite + Agents SDK (`useAgentChat`)
- Backend: Cloudflare Workers + Durable Objects (SQLite)
- Search: Vectorize with metadata filtering

### AI Gateway Configuration
- **Base URL**: `https://gateway.ai.cloudflare.com/v1/{CF_ACCOUNT_ID}/{CF_GATEWAY_ID}/anthropic`
- **Auth Header**: `cf-aig-authorization: Bearer {CF_AIG_TOKEN}` (if Authenticated Gateway enabled)
- **Model**: `claude-sonnet-4-20250514`
- **Secrets**: `CF_ACCOUNT_ID`, `CF_GATEWAY_ID`, `ANTHROPIC_API_KEY` (required), `CF_AIG_TOKEN` (optional)

## Spec Documents

| Document | Purpose |
|----------|---------|
| `spec/slc-ai-advisor-mvp/requirements.md` | What we're building |
| `spec/slc-ai-advisor-mvp/design.md` | Architecture, data models, interfaces |
| `spec/slc-ai-advisor-mvp/tasks.md` | Milestones and definitions of done |
| `spec/slc-ai-advisor-mvp/multi-canvas-architecture.md` | Multi-canvas/thread support, auth migration |
| `spec/api-contracts.md` | REST API endpoint documentation |

## File Structure

```
src/
  components/       # React components (Canvas, Chat, ThreadList, CanvasList)
  context/          # React Context providers
  types/            # TypeScript interfaces (canvas.ts, venture.ts)
  models/           # Model Manager classes
  utils/            # Utilities (canvasRegistry.ts for localStorage)
worker/
  index.ts          # Entry point, request routing
  agents/           # SLCAgent (AIChatAgent, one per thread)
  durable-objects/  # CanvasDO (canvas state + thread registry)
  routes/           # API route handlers (canvas.ts, session.ts)
knowledge/          # Knowledge base
  programs/         # Learning journeys (generic/, p2p/) → Vectorize namespaces
  tags/             # Concepts & dimensions → Vectorize metadata
spec/               # Specification documents
```

## Key Reference Files

- `knowledge/programs/generic/examples/patagonia/patagonia-slc.md` - Venture example with frontmatter
- `knowledge/tags/readme.md` - Tag structure overview
- `src/types/canvas.ts` - Canvas and Impact Model types

## Implementation Notes

- Session ID: `crypto.randomUUID()`
- Confidence threshold for dimension inference: 0.7
- Rate limiting: 100 req/min per session
- Impact Model's `impact` field syncs with impact section content
- Use parameterized SQL queries (prevent injection)

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run typecheck    # TypeScript check
npx wrangler types   # Regenerate worker types
wrangler deploy      # Deploy to Cloudflare
```

## Skills Available

- **spec-driven** - Requirements → Design → Tasks → Implementation workflow
- **cloudflare** - Cloudflare Workers patterns and documentation

## Cloudflare Skill Files

The cloudflare skill (`.claude/skills/cloudflare/`) includes project-specific patterns:

| File | Content |
|------|---------|
| `SKILL.md` | Entry point, code standards, wrangler.jsonc template |
| `REFERENCE.md` | API quick reference (KV, D1, R2, DO, Queues, Vectorize, AI) |
| `EXAMPLES.md` | Working code examples |
| `DURABLE-OBJECTS.md` | SQLite storage, WebSocket hibernation, alarms |
| `VECTORIZE.md` | Metadata filtering for Selection Matrix, bge-m3 patterns |
| `AGENTS-SDK.md` | useAgentChat, AIChatAgent, state management |
| `AI-GATEWAY.md` | Routing, caching, logging, debugging |
| `MCP-PATTERNS.md` | When to use each MCP server |

## Subagents Available

| Agent | Model | Purpose |
|-------|-------|---------|
| `cloudflare-lookup` | Sonnet | Knowledge retrieval, doc search, MCP discovery. Use for "how do I..." questions. |
| `cloudflare-developer` | Opus | Full implementation, code writing, deployment. Use for actual development work. |

**Delegation pattern:**
- Questions → `cloudflare-lookup` (fast, read-only)
- Implementation → `cloudflare-developer` (full power)

## MCP Servers

| Server | Purpose |
|--------|---------|
| `cloudflare-docs` | Documentation search |
| `cloudflare-bindings` | Manage Workers, KV, D1, R2, Hyperdrive |
| `cloudflare-builds` | CI/CD debugging, build logs |
| `cloudflare-ai-gateway` | AI request monitoring, logs |
| `cloudflare-browser` | Fetch external URLs |
| `cloudflare-observability` | Production logs, metrics, traces |

### Collaborator Setup

MCP servers are defined in `.mcp.json`. To enable them, add to your user settings (`~/.claude/settings.json`):

```json
{
  "enableAllProjectMcpServers": true
}
```

Or selectively enable:

```json
{
  "enabledMcpjsonServers": [
    "cloudflare-docs",
    "cloudflare-bindings",
    "cloudflare-builds",
    "cloudflare-ai-gateway",
    "cloudflare-observability",
    "cloudflare-browser"
  ]
}
```
