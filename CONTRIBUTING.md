# Contributing to SLC AI Advisor

This guide helps contributors understand the project, find their tasks, and coordinate with the team.

## Before You Start

1. **Read the spec documents** - They define what we're building:
   - [Requirements](spec/slc-ai-advisor-mvp/requirements.md) - The problem, users, success criteria
   - [Design](spec/slc-ai-advisor-mvp/design.md) - Architecture, data models, interfaces
   - [Tasks](spec/slc-ai-advisor-mvp/tasks.md) - Your assigned work

2. **Understand the core concept** - The Selection Matrix filters examples by 7 venture dimensions before semantic search. This is the key innovation.

3. **Know your area** - Work is divided into three parallel tracks:

| Area | Branch | GitHub Label |
|------|--------|--------------|
| Knowledge Base & Indexing | `feature/knowledge-indexing` | `area:knowledge` |
| Backend / API | `feature/backend-api` | `area:backend` |
| Frontend | `feature/frontend` | `area:frontend` |

## Team Areas

### Teammate A: Knowledge Base & Indexing

**Focus:** Get the knowledge base into Vectorize with correct metadata.

**You'll work with:**
- `knowledge/` directory (362 markdown files)
- `scripts/` directory (indexing script)
- Cloudflare Vectorize dashboard

**Your tasks:** A1-A5 in [tasks.md](spec/slc-ai-advisor-mvp/tasks.md)

**Key reference:**
- [patagonia-slc.md](knowledge/agent-content/venture-example-libraries/core-venture-example-library/patagonia/patagonia-slc.md) - Example frontmatter format
- [tags.md](knowledge/tags/tags.md) - The 138-tag taxonomy

**What you need to understand:**
- How YAML frontmatter maps to Vectorize metadata
- The 10 indexed metadata properties (see design doc)
- Content chunking (500-800 tokens per chunk)

### Teammate B: Backend / API

**Focus:** Build the API Worker with Durable Object state and Selection Matrix.

**You'll work with:**
- `src/worker/` - API endpoints
- `src/durable-objects/` - State management
- `src/retrieval/` - Selection Matrix logic
- `src/llm/` - Prompts and dimension inference

**Your tasks:** B1-B10 in [tasks.md](spec/slc-ai-advisor-mvp/tasks.md)

**Key reference:**
- [design.md](spec/slc-ai-advisor-mvp/design.md) - Data models, SQLite schema, Selection Matrix algorithm

**What you need to understand:**
- Cloudflare Workers and Durable Objects
- How Selection Matrix filters work (see design doc "Interfaces" section)
- Progressive filter relaxation strategy

### Teammate C: Frontend

**Focus:** Build the React chat interface and canvas display.

**You'll work with:**
- `src/` - React components and app code
- `worker/` - API routes (coordinate with B for shared types)
- AI SDK v5 `useAgentChat` hook

**Your tasks:** C1-C9 in [tasks.md](spec/slc-ai-advisor-mvp/tasks.md)

**Key reference:**
- [design.md](spec/slc-ai-advisor-mvp/design.md) - API endpoints to call
- [canvas-sections.md](knowledge/agent-content/canvas-sections/canvas-sections.md) - The 11 canvas sections

**What you need to understand:**
- React basics
- AI SDK v5 chat hooks
- The canvas layout (11 sections + nested Impact Model)

**Architecture note:** We use Workers Static Assets (not Pages). Frontend and API deploy as a single Worker via `@cloudflare/vite-plugin`. No CORS needed.

## Workflow

### 1. Set Up Your Branch

Branches are already created with S1 scaffolding complete:

```bash
# Clone the repo
git clone https://github.com/rathermercurial/slc-ai-advisor.git
cd slc-ai-advisor

# Checkout your feature branch (already exists)
git checkout feature/knowledge-indexing  # Teammate A
git checkout feature/backend-api         # Teammate B
git checkout feature/frontend            # Teammate C

# Install dependencies
npm install
```

### 2. Find Your Tasks

Open [tasks.md](spec/slc-ai-advisor-mvp/tasks.md) and find your section:
- Teammate A: Tasks A1-A5
- Teammate B: Tasks B1-B10
- Teammate C: Tasks C1-C9

Each task shows:
- **Description** - What to do
- **Files** - What files to create/edit
- **Tests** - How to verify it works
- **Depends on** - What must be done first
- **Status** - pending/in-progress/done

### 3. Work on Tasks

```bash
# Make changes
# ...

# Commit with task reference
git commit -m "A2: Create indexing script scaffold"

# Push to your branch
git push -u origin feature/<your-area>
```

### 4. Create GitHub Issues

Create an issue for each task you're working on:
- Title: `[A2] Create indexing script scaffold`
- Label: `area:knowledge` (or `area:backend`, `area:frontend`)
- Assignee: Yourself

Update the issue as you progress.

### 5. Sync Points

We have 4 sync points to coordinate. **Don't skip these.**

| Sync | After Tasks | What Happens | Status |
|------|-------------|--------------|--------|
| **S1** | A1, B1, C1 | Project scaffolding complete. Quick check-in: everyone can develop independently. | ✅ Complete |
| **S2** | A3, B3 | Vectorize indexed, DO schema ready. Frontend can start testing with real data. | Pending |
| **S3** | A4, B6, C4 | Core features working. Begin integration testing together. | Pending |
| **S4** | All tasks | Demo ready. Final polish and prep. | Pending |

At each sync point:
1. Push your current work
2. Brief standup (what's done, any blockers)
3. Test integrations between areas
4. Adjust plan if needed

### 6. Pull Requests

When your feature area is complete:

```bash
# Make sure you're up to date with main
git fetch origin
git rebase origin/main

# Push and create PR
git push
# Create PR on GitHub: feature/<your-area> → main
```

PR checklist:
- [ ] Tasks from tasks.md are complete
- [ ] Code follows patterns in design.md
- [ ] Tested locally
- [ ] No merge conflicts

## Development Setup

### Prerequisites

- Node.js 18+
- Cloudflare account with Workers paid plan (for Durable Objects, Vectorize)
- Wrangler CLI: `npm install -g wrangler`
- Anthropic API key

### Local Development

```bash
# Install dependencies
npm install

# Login to Cloudflare
wrangler login

# Start local dev server (frontend + API together)
npm run dev
# Opens http://localhost:5173 with Vite hot reload

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Environment Variables

Create `.dev.vars` (not committed):

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Code Style

- **TypeScript** - Strict mode
- **ES Modules** - Not CommonJS
- **Simple over clever** - This codebase will be maintained by vibe coders
- **Comments explain "why"** - Not "what"

## Questions?

- Check the spec docs first
- Ask in the team chat
- Create a GitHub issue with `question` label

## Timeline

**Target:** Functional demo ~1 week after Christmas

This is tight. Focus on:
1. Selection Matrix working (core value prop)
2. Basic chat + canvas display
3. Skip polish, defer PDF export, defer visual canvas editor

Good luck!
