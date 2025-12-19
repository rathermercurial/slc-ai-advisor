# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Status

**Phase:** Implementation (spec complete, ready to build)
**Target Platform:** Cloudflare (Workers, Pages, Durable Objects, Vectorize)
**Timeline:** Demo needed ~1 week after Christmas

## Project Overview

An AI advisor for social entrepreneurs using the Social Lean Canvas methodology. The system provides intelligent, contextual support by filtering a knowledge base using multi-dimensional venture analysis.

**Core Innovation:** The Selection Matrix - filtering examples by 7 venture dimensions (stage, impact area, mechanism, legal structure, revenue source, funding source, industry) before semantic search. This ensures dimensionally-relevant results, not just keyword matches.

**Key Concepts:**
- **Social Lean Canvas**: One-page framework with 11 sections + separate Impact Model
- **138-tag taxonomy**: Encoding domain expertise for categorizing social enterprises
- **7 venture dimensions**: Stage, impact area, mechanism, legal structure, revenue source, funding source, industry

## Specification Documents

The project follows a spec-driven workflow. All implementation should reference these documents:

| Document | Purpose |
|----------|---------|
| `spec/slc-ai-advisor-mvp/requirements.md` | What we're building, success criteria, constraints |
| `spec/slc-ai-advisor-mvp/design.md` | Architecture, components, data models, interfaces |
| `spec/slc-ai-advisor-mvp/tasks.md` | Implementation tasks organized by teammate |

## Architecture

```
Frontend (Pages) → API Worker → Durable Object (state)
                            → Vectorize (RAG)
                            → Anthropic (LLM)
```

**Key Components:**
- **Frontend**: React with AI SDK v5 `useAgentChat`
- **API Worker**: Agents SDK v0.2.24+, Selection Matrix, canvas CRUD
- **Durable Object**: SQLite for session, venture profile, canvas, messages
- **Vectorize**: 768-dim embeddings with metadata filtering

## Team Areas

| Area | Branch | Tasks |
|------|--------|-------|
| Knowledge Base & Indexing | `feature/knowledge-indexing` | A1-A5 |
| Backend / API | `feature/backend-api` | B1-B10 |
| Frontend | `feature/frontend` | C1-C9 |

## Knowledge Base Structure

```
knowledge/
├── agent-content/
│   ├── canvas-sections/       # Content for each canvas section
│   ├── program-content/       # Video program scripts
│   └── venture-example-libraries/
│       ├── core-venture-example-library/   # 9 main examples
│       └── p2p-venture-example-library/    # 7 P2P examples
├── tags/                      # 138-tag taxonomy definitions
├── lexicon-entry/             # Terminology definitions
└── brief-for-agent-design/    # Project briefs
```

## Key Reference Files

When implementing, reference these files:

- `knowledge/agent-content/venture-example-libraries/core-venture-example-library/patagonia/patagonia-slc.md` - Venture example format with frontmatter
- `knowledge/tags/tags.md` - 138-tag taxonomy overview
- `knowledge/agent-content/canvas-sections/canvas-sections.md` - Canvas section definitions

## Data Models

See `spec/slc-ai-advisor-mvp/design.md` for full TypeScript interfaces. Key types:

- `VentureDimensions` - 7 dimensions for filtering
- `VentureProfile` - User's venture with confidence tracking
- `CanvasState` - 11 sections + ImpactModel
- `ConversationState` - Messages + summary

## Implementation Notes

- Use parameterized SQL queries (prevent injection)
- Session ID: `crypto.randomUUID()`
- Confidence threshold for dimension inference: 0.7
- CORS headers needed for Pages/Worker separation
- Rate limiting: 100 req/min per session

## Skills Available

- **spec-driven** - Guides Requirements → Design → Tasks → Implementation workflow
- **cloudflare** - Cloudflare Workers development patterns

## Commands

```bash
# View tasks
cat spec/slc-ai-advisor-mvp/tasks.md

# Start development
wrangler dev

# Deploy
wrangler deploy
```
