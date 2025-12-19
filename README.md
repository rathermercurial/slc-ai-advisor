# Social Lean Canvas AI Advisor

An AI advisor that helps social entrepreneurs complete their Social Lean Canvas by providing contextually-relevant guidance and examples.

## Project Status

**Phase:** Implementation (S1 scaffolding complete)
**Target Demo:** ~1 week after Christmas
**Platform:** Cloudflare Workers (with Static Assets, Durable Objects, Vectorize)

### Sync Point Status
- [x] **S1** - Project scaffolding complete (A1, B1, C1 done)
- [ ] **S2** - Vectorize indexed, DO schema ready
- [ ] **S3** - Core features working
- [ ] **S4** - Demo ready

## What This Does

The SLC AI Advisor provides:

1. **Methodology Guidance** - Answers questions like "How do I fill in the revenue section?" drawing from video scripts and canvas guides
2. **Contextual Example Retrieval** - Returns venture examples that match your venture's characteristics (stage, impact area, industry, etc.) - not just keyword matching
3. **Canvas Persistence** - View, edit, and export your 11-section Social Lean Canvas

The core innovation is the **Selection Matrix** - filtering examples by 7 venture dimensions before semantic search, so an early-stage healthcare venture gets healthcare examples at similar stages, not scale-stage education examples that happen to mention "revenue."

## Quick Links

| Document | Description |
|----------|-------------|
| [Requirements](spec/slc-ai-advisor-mvp/requirements.md) | What we're building and why |
| [Design](spec/slc-ai-advisor-mvp/design.md) | Architecture and data models |
| [Tasks](spec/slc-ai-advisor-mvp/tasks.md) | Implementation tasks by teammate |
| [Contributing](CONTRIBUTING.md) | How to contribute |

## Architecture Overview

Uses **Workers Static Assets** (not Pages) per Cloudflare's 2025 recommendation. Frontend and API deploy as a single Worker.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Unified Worker (Cloudflare Workers Static Assets)                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Frontend (React + Vite + @cloudflare/vite-plugin)          │   │
│  │  - Chat interface with useAgentChat                          │   │
│  │  - Canvas display with nested Impact Model                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  API Routes (/api/*)                                         │   │
│  │  - Selection Matrix (filter by venture dimensions)           │   │
│  │  - Chat handler with RAG                                     │   │
│  │  - Canvas CRUD                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
           ┌──────────────────────┼──────────────────────┐
           ▼                      ▼                      ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  Anthropic API  │   │ Durable Object  │   │   Vectorize     │
│  (Claude)       │   │ (User State)    │   │ (Knowledge Base)│
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

## Knowledge Base

The knowledge base contains 362 markdown files:

- **16 venture examples** with full Social Lean Canvas (Patagonia, Toast Ale, Auticon, etc.)
- **138-tag taxonomy** across 7 dimensions for categorizing ventures
- **Video program scripts** organized by canvas section
- **Methodology guides** for each of the 11 canvas sections

```
knowledge/
├── agent-content/
│   ├── canvas-sections/           # Methodology for each section
│   ├── program-content/           # Video scripts
│   └── venture-example-libraries/ # 16 venture examples
├── tags/                          # 138-tag taxonomy
└── lexicon-entry/                 # Terminology definitions
```

## Team Structure

| Area | Branch | PR | Status |
|------|--------|----|--------|
| Knowledge Base & Indexing | `feature/knowledge-indexing` | [#4](../../pull/4) | A1 ✅, A2-A5 pending |
| Backend / API | `feature/backend-api` | [#5](../../pull/5) | B1 ✅, B2-B10 pending |
| Frontend | `feature/frontend` | [#6](../../pull/6) | C1 ✅, C2-C9 pending |

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed setup and workflow.

## Development

```bash
# Clone the repo
git clone https://github.com/rathermercurial/slc-ai-advisor.git
cd slc-ai-advisor

# Checkout your feature branch
git checkout feature/knowledge-indexing  # or backend-api or frontend

# Install dependencies
npm install

# Start dev server (frontend + API)
npm run dev

# See your assigned tasks
cat spec/slc-ai-advisor-mvp/tasks.md
```

### Project Structure

```
├── src/                    # React frontend
│   ├── App.tsx
│   ├── main.tsx
│   └── components/         # (to be added in C2+)
├── worker/                 # API Worker entry point
│   └── index.ts
├── scripts/                # Indexing scripts (Track A)
├── knowledge/              # Knowledge base (362 files)
├── spec/                   # Requirements, design, tasks
├── vite.config.ts
├── wrangler.toml
└── package.json
```

## License

TBD
