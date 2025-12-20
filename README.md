# Social Lean Canvas AI Advisor

An AI advisor that helps social entrepreneurs complete their Social Lean Canvas through contextual guidance and relevant examples.

## What It Does

1. **Methodology Guidance** - Answers questions like "How do I fill in the revenue section?" using video scripts and canvas guides
2. **Contextual Examples** - Returns venture examples matching your characteristics (stage, impact area, industry) via the Selection Matrix
3. **Canvas Persistence** - View, edit, and export your 11-section Social Lean Canvas

The core innovation is the **Selection Matrix** - filtering examples by 7 venture dimensions before semantic search. An early-stage healthcare venture gets healthcare examples at similar stages, not scale-stage education examples that happen to mention "revenue."

## Project Status

| Milestone | Target | Status |
|-----------|--------|--------|
| Demo | ~1 week | In progress (A2 blocking) |
| MVP | ~2 weeks | Pending |

**Demo = chat + RAG.** User asks methodology question, gets answer from indexed KB.

## Architecture

Single Cloudflare Worker deployment (Workers Static Assets). No CORS needed.

```
┌─────────────────────────────────────────────────┐
│  Unified Worker                                 │
│  ├── React Frontend (Vite + Agents SDK)         │
│  └── API Routes (/api/*)                        │
│      ├── Selection Matrix                       │
│      ├── Chat with RAG                          │
│      └── Canvas CRUD                            │
└─────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
   Anthropic API   Durable Object   Vectorize
     (Claude)       (SQLite)        (768-dim)
```

## Quick Start

```bash
git clone https://github.com/rathermercurial/slc-ai-advisor.git
cd slc-ai-advisor
npm install
npm run dev
```

## Documentation

| Document | Purpose |
|----------|---------|
| [Requirements](spec/slc-ai-advisor-mvp/requirements.md) | What we're building |
| [Design](spec/slc-ai-advisor-mvp/design.md) | Architecture, data models |
| [Tasks](spec/slc-ai-advisor-mvp/tasks.md) | Implementation tasks |
| [Contributing](CONTRIBUTING.md) | Workflow and setup |

## Project Structure

```
├── src/                    # React frontend
│   ├── components/         # UI components
│   └── types/              # TypeScript types
├── worker/                 # API Worker
│   ├── index.ts            # Entry point
│   └── env.d.ts            # Env type extensions
├── knowledge/              # Knowledge base (362 files)
│   ├── agent-content/      # Venture examples, scripts
│   └── tags/               # 138-tag taxonomy
├── spec/                   # Specification docs
└── scripts/                # Indexing scripts
```

## Key Concepts

- **11 Canvas Sections**: Purpose, Customer Segments, Problem, UVP, Solution, Channels, Revenue, Cost Structure, Key Metrics, Unfair Advantage, Impact
- **3 Models**: Customer (2-5), Economic (6-8, 10), Impact (11)
- **7 Dimensions**: Stage, impact area, mechanism, legal structure, revenue source, funding source, industry
- **Impact Model**: Section 11 contains an 8-field causality chain (issue → participants → activities → outputs → outcomes → impact)

## Tech Stack

- Cloudflare Workers + Durable Objects + Vectorize
- React 19 + Vite
- Agents SDK + AI SDK
- TypeScript (strict)

## License

TBD
