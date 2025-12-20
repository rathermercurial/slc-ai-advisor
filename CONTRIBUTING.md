# Contributing

## Quick Reference

| Track | Branch | Demo Tasks | Issues |
|-------|--------|------------|--------|
| Knowledge Base | `feature/knowledge-indexing` | A1-A6 | #7, #8, #9 |
| Backend | `feature/backend-api` | B1-B5 | #10, #11 |
| Frontend | `feature/frontend` | C1-C3 | #12, #13 |

## Setup

```bash
git clone https://github.com/rathermercurial/slc-ai-advisor.git
cd slc-ai-advisor
npm install

# Login to Cloudflare (needed for Durable Objects, Vectorize)
wrangler login

# Create .dev.vars with your API key
echo "ANTHROPIC_API_KEY=sk-ant-..." > .dev.vars

# Start dev server
npm run dev
```

## Workflow

1. Check your tasks in [tasks.md](spec/slc-ai-advisor-mvp/tasks.md)
2. Work on your feature branch
3. Commit with task reference: `git commit -m "A2: Restructure KB tags"`
4. Push and update the GitHub issue

## Milestones

**Demo (~1 week):** Chat + RAG works. A1-A6, B1-B5, C1-C3.

**MVP (~2 weeks):** Full Selection Matrix, canvas persistence. All tasks.

## Code Style

- TypeScript strict mode
- ES Modules
- Simple over clever
- Comments explain "why" not "what"

## Spec Documents

Read these before starting:

- [Requirements](spec/slc-ai-advisor-mvp/requirements.md) - What we're building
- [Design](spec/slc-ai-advisor-mvp/design.md) - Architecture, data models
- [Tasks](spec/slc-ai-advisor-mvp/tasks.md) - Task details and dependencies

## Track Details

### Track A: Knowledge Base

Get the knowledge base indexed in Vectorize with correct metadata.

**Key files:**
- `knowledge/` - 362 markdown files
- `scripts/` - Indexing script
- `knowledge/tags/` - 138-tag taxonomy

**References:**
- [A2 guide](spec/slc-ai-advisor-mvp/A2-knowledge-base-restructure.md)
- [Patagonia example](knowledge/agent-content/venture-example-libraries/core-venture-example-library/patagonia/patagonia-slc.md)

**A2 is the critical blocker** for all indexing work.

### Track B: Backend

Build the API with Durable Object state and Selection Matrix.

**Key files:**
- `worker/` - API entry point
- `src/types/` - TypeScript interfaces

**References:**
- [Design doc](spec/slc-ai-advisor-mvp/design.md) - SQLite schema, Selection Matrix algorithm

### Track C: Frontend

Build the React chat interface.

**Key files:**
- `src/` - React components
- Uses `useAgentChat` from Agents SDK

**References:**
- [Design doc](spec/slc-ai-advisor-mvp/design.md) - API endpoints

## Architecture Notes

- Single Worker deployment (Workers Static Assets)
- No CORS needed - frontend and API are same origin
- Durable Objects use SQLite storage
- Vectorize uses 768-dim embeddings (bge-base-en-v1.5)
