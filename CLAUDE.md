# CLAUDE.md

Instructions for Claude Code when working with this repository.

## Project Overview

AI advisor for social entrepreneurs using the Social Lean Canvas methodology. Filters a knowledge base using multi-dimensional venture analysis (the Selection Matrix).

**Core Innovation:** Filter examples by 7 venture dimensions before semantic search. Early-stage healthcare ventures get healthcare examples at similar stages, not keyword matches from unrelated contexts.

## Key Concepts

- **11 Canvas Sections**: Purpose, Customer Segments, Problem, UVP, Solution, Channels, Revenue, Cost Structure, Key Metrics, Unfair Advantage, Impact
- **3 Models**: Customer (sections 2-5), Economic (sections 6-8, 10), Impact (section 11)
- **7 Dimensions**: Stage, impact area, mechanism, legal structure, revenue source, funding source, industry
- **Impact Model**: Section 11 contains 8-field causality chain (issue → participants → activities → outputs → outcomes → impact)

## Architecture

Single Cloudflare Worker (Workers Static Assets). No CORS needed.

```
Worker → Durable Object (SQLite state)
      → Vectorize (768-dim embeddings)
      → Anthropic (Claude)
```

**Stack:**
- Frontend: React 19 + Vite + Agents SDK (`useAgentChat`)
- Backend: Cloudflare Workers + Durable Objects (SQLite)
- Search: Vectorize with metadata filtering

## Spec Documents

| Document | Purpose |
|----------|---------|
| `spec/slc-ai-advisor-mvp/requirements.md` | What we're building |
| `spec/slc-ai-advisor-mvp/design.md` | Architecture, data models, interfaces |
| `spec/slc-ai-advisor-mvp/tasks.md` | Tasks by milestone (Demo vs MVP) |

## File Structure

```
src/types/          # TypeScript interfaces (canvas.ts, venture.ts, message.ts)
worker/             # API entry point
  index.ts          # Request handler
  env.d.ts          # Env type extensions
knowledge/          # 362 markdown files
  agent-content/    # Venture examples, video scripts, section guides
  tags/             # 138-tag taxonomy
spec/               # Specification documents
scripts/            # Indexing scripts (Track A)
```

## Key Reference Files

- `knowledge/agent-content/venture-example-libraries/core-venture-example-library/patagonia/patagonia-slc.md` - Venture example with frontmatter
- `knowledge/tags/tags.md` - 138-tag taxonomy overview
- `src/types/canvas.ts` - Canvas and Impact Model types

## Implementation Notes

- Session ID: `crypto.randomUUID()`
- Confidence threshold for dimension inference: 0.7
- Rate limiting: 100 req/min per session
- Impact Model's `impact` field syncs with section 11 content
- Use parameterized SQL queries (prevent injection)

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run typecheck    # TypeScript check
npx wrangler types   # Regenerate worker types
wrangler deploy      # Deploy to Cloudflare
```

## GitHub Issues

| Issue | Description |
|-------|-------------|
| #7 | Track A: Knowledge Base |
| #8 | A2: KB Restructure (blocker) |
| #9 | A3-A6: Indexing to Demo |
| #10 | Track B: Backend |
| #11 | B1-B5: Backend to Demo |
| #12 | Track C: Frontend |
| #13 | C1-C3: Frontend to Demo |

## Skills Available

- **spec-driven** - Requirements → Design → Tasks → Implementation workflow
- **cloudflare** - Cloudflare Workers patterns and documentation
