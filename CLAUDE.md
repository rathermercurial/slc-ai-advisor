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

- **SLCAgent**: Conversation + tool execution. Has own `this.sql` for messages.
- **CanvasDO**: Canvas state + Model Managers. Stores sections, venture profile.

**Stack:**
- Frontend: React 19 + Vite + Agents SDK (`useAgentChat`)
- Backend: Cloudflare Workers + Durable Objects (SQLite)
- Search: Vectorize with metadata filtering

## Spec Documents

| Document | Purpose |
|----------|---------|
| `spec/slc-ai-advisor-mvp/requirements.md` | What we're building |
| `spec/slc-ai-advisor-mvp/design.md` | Architecture, data models, interfaces |
| `spec/slc-ai-advisor-mvp/tasks.md` | Milestones and definitions of done |

## File Structure

```
src/
  types/            # TypeScript interfaces (canvas.ts, venture.ts)
  models/           # Model Manager classes
worker/
  index.ts          # Entry point, request routing
  agents/           # SLCAgent (AIChatAgent)
  durable-objects/  # CanvasDO
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
