# SLC AI Advisor MVP - Tasks

## Team Structure

| Teammate | Area | Skill Level | Focus |
|----------|------|-------------|-------|
| **A** | Knowledge Base & Indexing | Weakest vibe coder, knows content best | Vectorize setup, indexing script, content chunking |
| **B** | Backend / API Worker | Intermediate | Durable Object, API endpoints, Selection Matrix |
| **C** | Frontend | Intermediate | React app, chat UI, canvas display |

## Sync Points

| Sync | After Tasks | Purpose | Blockers Resolved |
|------|-------------|---------|-------------------|
| **S1** | A1, B1, C1 | Project scaffolding complete | All can develop independently |
| **S2** | A3, B3 | Vectorize index ready, DO schema ready | C can test with real data |
| **S3** | A4, B6, C4 | Core features working | Integration testing begins |
| **S4** | All tasks | Demo ready | Final polish |

---

## Teammate A: Knowledge Base & Indexing

### A1. [S] Set up Vectorize index ✅
- **Description:** Create Vectorize index in Cloudflare dashboard with correct dimensions and metadata config
- **Files:** `wrangler.toml` (add vectorize binding)
- **Tests:** Verify index appears in dashboard
- **Depends on:** none
- **Status:** complete
- **Branch:** `feature/knowledge-indexing`
- **PR:** #4

### A2. [M] Create indexing script scaffold
- **Description:** Set up Node.js script structure with gray-matter for parsing markdown frontmatter
- **Files:** `scripts/index-knowledge-base.ts`, `package.json` (add gray-matter)
- **Tests:** Script runs without errors on sample file
- **Depends on:** A1
- **Status:** pending

### A3. [L] Implement content parsing and chunking
- **Description:** Parse all 362 knowledge base files, extract tags from frontmatter, chunk content (500-800 tokens). Map frontmatter tags to Vectorize metadata format (10 indexed properties).
- **Files:** `scripts/index-knowledge-base.ts`, `scripts/chunking.ts`
- **Tests:** Verify chunks have correct metadata, test on venture examples
- **Depends on:** A2
- **Status:** pending

### A4. [L] Generate embeddings and upload to Vectorize
- **Description:** Use Workers AI REST API to generate embeddings (@cf/baai/bge-base-en-v1.5), upload vectors with metadata to Vectorize index
- **Files:** `scripts/index-knowledge-base.ts`
- **Tests:** Query Vectorize with sample filter, verify results
- **Depends on:** A3
- **Status:** pending

### A5. [S] Document metadata mapping
- **Description:** Create reference doc showing how knowledge base frontmatter maps to Vectorize metadata properties
- **Files:** `docs/metadata-mapping.md`
- **Tests:** None (documentation)
- **Depends on:** A4
- **Status:** pending

---

## Teammate B: Backend / API Worker

### B1. [M] Initialize Cloudflare Worker project ✅
- **Description:** Create Worker project with wrangler, configure bindings (Vectorize, Durable Objects, AI Gateway), set up TypeScript
- **Files:** `wrangler.toml`, `src/worker/index.ts`, `src/durable-objects/UserSession.ts`, `src/types/venture.ts`, `src/types/canvas.ts`, `tsconfig.json`, `package.json`
- **Tests:** `wrangler dev` runs, basic health endpoint works
- **Depends on:** none
- **Status:** complete
- **Branch:** `feature/backend-api`
- **PR:** #5

### B2. [L] Implement Durable Object with SQLite schema
- **Description:** Create UserSession Durable Object class, implement SQLite schema (session, venture_profile, canvas_section, impact_model, message tables)
- **Files:** `src/durable-objects/UserSession.ts`, `src/types/venture.ts`, `src/types/canvas.ts`
- **Tests:** Create session, write/read from each table
- **Depends on:** B1
- **Status:** pending

### B3. [M] Implement session management endpoints
- **Description:** Create session CRUD endpoints, session ID generation (crypto.randomUUID), route requests to correct Durable Object
- **Files:** `src/worker/session.ts`, `src/worker/index.ts`
- **Tests:** Create session, retrieve session, verify persistence
- **Depends on:** B2
- **Status:** pending

### B4. [L] Implement Selection Matrix filter building
- **Description:** Build Vectorize metadata filters from venture profile, implement progressive relaxation (strict → remove industry → remove impact area → pure semantic)
- **Files:** `src/retrieval/selection-matrix.ts`, `src/retrieval/vector-search.ts`
- **Tests:** Test filter building with sample profiles, test relaxation when no results
- **Depends on:** B3, A4 (needs indexed data)
- **Status:** pending

### B5. [L] Implement chat handler with RAG
- **Description:** Chat endpoint that queries Vectorize with Selection Matrix, builds prompt with retrieved context, calls Anthropic via AI Gateway, handles streaming response
- **Files:** `src/worker/chat.ts`, `src/llm/prompts.ts`
- **Tests:** Send message, verify RAG context included, verify response
- **Depends on:** B4
- **Status:** pending

### B6. [M] Implement dimension inference
- **Description:** Extract venture dimensions from conversation with confidence scores, update venture_profile when confidence > 0.7
- **Files:** `src/llm/dimension-inference.ts`
- **Tests:** Test inference on sample conversations, verify confidence thresholds
- **Depends on:** B5
- **Status:** pending

### B7. [M] Implement canvas CRUD endpoints
- **Description:** GET/PUT endpoints for canvas sections and impact model, store in Durable Object SQLite
- **Files:** `src/worker/canvas.ts`
- **Tests:** Update section, verify persistence, get full canvas
- **Depends on:** B2
- **Status:** pending

### B8. [S] Implement export endpoint
- **Description:** Export canvas as Markdown or JSON format
- **Files:** `src/worker/canvas.ts`
- **Tests:** Export both formats, verify content
- **Depends on:** B7
- **Status:** pending

### B9. [S] Add rate limiting
- **Description:** Configure rate limiting (100 req/min per session). Note: CORS not needed with Workers Static Assets (single origin)
- **Files:** `worker/index.ts`
- **Tests:** Test rate limit enforcement
- **Depends on:** B1
- **Status:** pending

### B10. [M] Add error handling
- **Description:** Handle zero results (methodology fallback), LLM API failures (graceful degradation), request timeouts
- **Files:** `src/worker/errors.ts`, `src/retrieval/fallback.ts`
- **Tests:** Simulate failures, verify graceful handling
- **Depends on:** B5
- **Status:** pending

---

## Teammate C: Frontend

### C1. [M] Initialize React app with Workers Static Assets ✅
- **Description:** Create React app with Vite, configure for Workers Static Assets deployment (not Pages - deprecated), install AI SDK v5
- **Files:** `src/`, `worker/`, `package.json`, `vite.config.ts`, `wrangler.toml`, `index.html`, TypeScript configs
- **Tests:** `npm run dev` runs, app loads in browser
- **Depends on:** none
- **Status:** complete
- **Branch:** `feature/frontend`
- **PR:** #6
- **Note:** Uses `@cloudflare/vite-plugin` for unified frontend+backend deployment as single Worker

### C2. [M] Implement chat interface
- **Description:** Chat UI with message list, input field, using `useAgentChat` hook from AI SDK
- **Files:** `src/components/Chat.tsx`, `src/App.tsx`
- **Tests:** Send message, see response (mock initially)
- **Depends on:** C1
- **Status:** pending

### C3. [M] Connect chat to backend
- **Description:** Connect useAgentChat to Worker API, handle session ID storage in localStorage, implement reconnection
- **Files:** `src/components/Chat.tsx`, `src/hooks/useSession.ts`
- **Tests:** Messages persist across refresh, session continues
- **Depends on:** C2, B5 (needs chat endpoint)
- **Status:** pending

### C4. [L] Implement canvas display
- **Description:** Visual canvas layout showing 11 sections, completion status indicators, read-only for MVP
- **Files:** `src/components/Canvas.tsx`, `src/components/CanvasSection.tsx`
- **Tests:** Canvas renders, shows correct data from API
- **Depends on:** C1, B7 (needs canvas endpoint)
- **Status:** pending

### C5. [M] Implement nested Impact Model display
- **Description:** Impact Model section expandable to show full causality chain (issue → participants → activities → outputs → outcomes → impact)
- **Files:** `src/components/ImpactModel.tsx`
- **Tests:** Expand/collapse works, shows all 8 fields
- **Depends on:** C4
- **Status:** pending

### C6. [S] Implement copy button
- **Description:** Copy button to copy canvas section content to clipboard
- **Files:** `src/components/CanvasSection.tsx`
- **Tests:** Click copy, verify clipboard content
- **Depends on:** C4
- **Status:** pending

### C7. [M] Implement export menu
- **Description:** Export dropdown with Markdown and JSON options, triggers download
- **Files:** `src/components/ExportMenu.tsx`
- **Tests:** Export both formats, verify file downloads
- **Depends on:** C4, B8 (needs export endpoint)
- **Status:** pending

### C8. [M] Add loading states and error handling
- **Description:** Loading spinners, error messages, connection status indicator
- **Files:** `src/components/` (various)
- **Tests:** Simulate slow responses, errors, verify UI feedback
- **Depends on:** C3, C4
- **Status:** pending

### C9. [S] Style for demo
- **Description:** Basic styling to make demo presentable (not production polish)
- **Files:** `src/styles/`
- **Tests:** Visual review
- **Depends on:** C8
- **Status:** pending

---

## Integration Tasks (All teammates)

### I1. [M] End-to-end integration testing
- **Description:** Test full flow: new session → chat → dimension inference → canvas update → export
- **Files:** None (manual testing)
- **Tests:** Walk through demo scenarios from requirements
- **Depends on:** A4, B10, C8
- **Status:** pending

### I2. [S] Demo preparation
- **Description:** Prepare demo script covering 5 scenarios from requirements, pre-populate test data if needed
- **Files:** `docs/demo-script.md`
- **Tests:** Run through demo script
- **Depends on:** I1
- **Status:** pending

---

## Complexity Key
- **[S]** Small - < 30 min
- **[M]** Medium - 30 min to 2 hours
- **[L]** Large - 2+ hours

## Task Summary by Teammate

| Teammate | Tasks | Est. Total |
|----------|-------|------------|
| A | 5 tasks (1S, 1M, 2L, 1S) | ~6-8 hours |
| B | 10 tasks (3S, 4M, 3L) | ~12-16 hours |
| C | 9 tasks (2S, 5M, 2L) | ~10-14 hours |
| All | 2 tasks (1S, 1M) | ~2-3 hours |

## Notes

- **Teammate A** has fewer tasks because the knowledge base content is already well-structured. Focus is on correct metadata mapping.
- **Teammate B** has the most tasks but many are interconnected - once DO and Selection Matrix work, the rest flows.
- **Teammate C** can work largely independently after C1, rejoining at sync points for integration.
- **PDF export deferred** - Markdown export is sufficient for demo. Users can convert if needed.
- **Visual canvas editing deferred** - Chat-based editing only for MVP.
- **Sync points are critical** - Don't skip them. Brief check-ins prevent integration surprises.
