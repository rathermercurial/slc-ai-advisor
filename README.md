# Social Lean Canvas AI Advisor

An AI advisor that helps social entrepreneurs complete their Social Lean Canvas by providing contextually-relevant guidance and examples.

## Project Status

**Phase:** Implementation
**Target Demo:** ~1 week after Christmas
**Platform:** Cloudflare (Workers, Pages, Durable Objects, Vectorize)

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

```
┌─────────────────────────────────────────────────────────────────────┐
│  Frontend (Cloudflare Pages)                                        │
│  - Chat interface with useAgentChat                                 │
│  - Canvas display with nested Impact Model                          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  API Worker (Cloudflare Workers + Agents SDK)                       │
│  - Chat handler with RAG                                            │
│  - Selection Matrix (filter by venture dimensions)                  │
│  - Canvas CRUD                                                      │
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

| Area | Branch | Focus |
|------|--------|-------|
| Knowledge Base & Indexing | `feature/knowledge-indexing` | Vectorize setup, content chunking, metadata mapping |
| Backend / API | `feature/backend-api` | Durable Object, Selection Matrix, chat handler |
| Frontend | `feature/frontend` | React app, chat UI, canvas display |

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed setup and workflow.

## Development

```bash
# Clone the repo
git clone <repo-url>
cd slc

# See your assigned tasks
cat spec/slc-ai-advisor-mvp/tasks.md

# Create your feature branch
git checkout -b feature/<your-area>
```

## License

TBD
