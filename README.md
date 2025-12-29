# Social Lean Canvas AI Advisor

An AI advisor that helps social entrepreneurs complete their Social Lean Canvas. It answers methodology questions using indexed video scripts and guides, and retrieves relevant venture examples based on the user's characteristics.

## How It Works

The advisor sits alongside the Social Lean Canvas video curriculum. As users work through the program, they can ask questions like "How specific should my value proposition be?" or "What revenue models work for early-stage healthcare ventures?" The advisor retrieves relevant content from a knowledge base of methodology guides and real venture examples.

The key to useful retrieval is the **Selection Matrix**. Rather than pure semantic search (which might return a scale-stage education example when you asked about revenue for an early-stage healthcare venture), the Selection Matrix first filters by venture dimensions and other properties then performs semantic search within that filtered set. This ensures examples are actually relevant to the user's situation.

The canvas itself has 11 sections organized into 3 conceptual models:

| Model | Sections |
|-------|----------|
| Customer | customers, jobsToBeDone, valueProposition, solution |
| Economic | channels, revenue, costs, advantage |
| Impact | impact (contains 8-field causality chain) |
| — | purpose, keyMetrics |

## Project Status

| Milestone | Target | Status |
|-----------|--------|--------|
| Demo | ~1 week | In progress |
| MVP | ~2 weeks | Pending |

The Demo milestone requires chat with RAG retrieval working—a user asks a methodology question and gets an answer drawn from the indexed knowledge base. The MVP adds full Selection Matrix filtering, canvas persistence, and dimension inference from conversation.

Currently blocked on A2 (knowledge base restructure). See [tasks.md](spec/slc-ai-advisor-mvp/tasks.md) for details.

## Architecture

Everything runs on a single Cloudflare Worker. The React frontend is served as static assets from the same origin, so there's no CORS configuration needed.

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
     (Claude)       (SQLite)        (1024-dim)
```

Session state (canvas content, venture profile, chat history) lives in a Durable Object with SQLite storage. The knowledge base is indexed in Vectorize with metadata for Selection Matrix filtering.

## Quick Start

```bash
git clone https://github.com/rathermercurial/slc-ai-advisor.git
cd slc-ai-advisor
npm install
npm run dev
```

You'll need to create `.dev.vars` with your Anthropic API key. See [CONTRIBUTING.md](CONTRIBUTING.md) for full setup.

## Project Structure

```
├── src/                    # React frontend
│   ├── components/         # UI components
│   └── types/              # TypeScript interfaces
├── worker/                 # Cloudflare Worker
│   ├── index.ts            # API routes
│   └── env.d.ts            # Environment types
├── knowledge/              # Knowledge base (291 markdown files)
│   ├── programs/           # Learning content by program
│   └── tags/               # Concept and dimension definitions
├── spec/                   # Feature specifications
│   └── slc-ai-advisor-mvp/ # Requirements, design, tasks
└── scripts/                # Indexing scripts
```

## Documentation

- [Requirements](spec/slc-ai-advisor-mvp/requirements.md) — Problem statement, canvas structure, success criteria
- [Design](spec/slc-ai-advisor-mvp/design.md) — Architecture decisions, data models, API design
- [Tasks](spec/slc-ai-advisor-mvp/tasks.md) — Implementation tasks organized by track and milestone
- [Contributing](CONTRIBUTING.md) — Setup instructions and workflow

## Tech Stack

- **Runtime**: Cloudflare Workers, Durable Objects (SQLite), Vectorize
- **Frontend**: React 19, Vite, AI SDK
- **LLM**: Anthropic Claude via AI Gateway
- **Language**: TypeScript (strict mode)

## License

TBD
