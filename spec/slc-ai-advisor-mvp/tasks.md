# SLC AI Advisor MVP - Tasks

## Team Structure

| Teammate | Area | Skill Level | Focus |
|----------|------|-------------|-------|
| **A** | Knowledge Base & Indexing | Weakest vibe coder, knows content best | KB restructure, Vectorize setup, indexing script |
| **B** | Backend / API Worker | Intermediate | Durable Object, API endpoints, Selection Matrix |
| **C** | Frontend | Intermediate | React app, chat UI, canvas display |

## Milestones

| Milestone | Target | Success Criteria |
|-----------|--------|------------------|
| **Demo** | ~1 week | Advisor answers methodology questions using indexed KB. Basic chat + RAG works. |
| **MVP** | ~2 weeks | Full Selection Matrix, canvas persistence, dimension inference, Impact Model sync. |
| **Integration** | Future | Functions abstracted for embedding in any frontend (like socialleancanvas.com). |

## Sync Points

Sync points align with milestones. Each is a team checkpoint.

| Sync | Milestone | Tasks Complete | Success Criteria |
|------|-----------|----------------|------------------|
| **Demo** | 1 week | A1-A6, B1-B5, C1-C3 | Chat works with RAG. User asks methodology question, gets answer from indexed KB. |
| **MVP** | 2 weeks | All tasks | Full requirements met. Selection Matrix filters by dimensions. Canvas persists. |

---

## Demo-Critical Tasks

These tasks must be complete for the Demo milestone. Focus here first.

### Track A (Knowledge Base)
| Task | Description | Status |
|------|-------------|--------|
| A1 | Set up Vectorize index | ✅ |
| A2 | Restructure KB tags | 🔴 pending |
| A3 | Update venture frontmatter | pending |
| A4 | Indexing script scaffold | pending |
| A5 | Content parsing/chunking | pending |
| A6 | Generate embeddings, upload | pending |

### Track B (Backend)
| Task | Description | Status |
|------|-------------|--------|
| B1 | Initialize Worker project | ✅ |
| B2 | Durable Object + SQLite | pending |
| B3 | Session management | pending |
| B4 | Selection Matrix filters | pending |
| B5 | Chat handler with RAG | pending |

### Track C (Frontend)
| Task | Description | Status |
|------|-------------|--------|
| C1 | Initialize React app | ✅ |
| C2 | Chat interface | pending |
| C3 | Connect to backend | pending |

## MVP-Additional Tasks

Complete these after Demo to reach full MVP.

### Track A
| Task | Description | Status |
|------|-------------|--------|
| A7 | Document metadata mapping | pending |

### Track B
| Task | Description | Status |
|------|-------------|--------|
| B6 | Dimension inference | pending |
| B7 | Canvas CRUD endpoints | pending |
| B8 | Export endpoint | pending |
| B9 | Rate limiting | pending |
| B10 | Error handling | pending |

### Track C
| Task | Description | Status |
|------|-------------|--------|
| C4 | Canvas display | pending |
| C5 | Impact Model display | pending |
| C6 | Copy button | pending |
| C7 | Export menu | pending |
| C8 | Loading/error states | pending |
| C9 | Demo styling | pending |

### Integration
| Task | Description | Status |
|------|-------------|--------|
| I1 | End-to-end testing | pending |
| I2 | Demo preparation | pending |

---

## Critical Path to Demo

```
A1 ✅ → A2 🔴 → A3 → A4 → A5 → A6 ─────────────────┐
                                                    ↓
B1 ✅ → B2 → B3 ───────────────────────────→ B4 → B5 (DEMO)
                                              ↑
C1 ✅ → C2 → C3 ──────────────────────────────┘
```

**Blocking dependencies:**
- A2 (KB restructure) blocks all indexing (A3-A6)
- B2 (DO schema) blocks session management (B3)
- A6 (indexed KB) + B3 (sessions) required before Selection Matrix (B4)
- B5 (chat endpoint) required before frontend connection (C3)

**A2 is the critical blocker** - Teammate A should start here immediately.

---

## Full Task Details

### Teammate A: Knowledge Base & Indexing

#### A1. [S] Set up Vectorize index ✅
- **Description:** Create Vectorize index in Cloudflare dashboard with correct dimensions and metadata config
- **Files:** `wrangler.toml` (add vectorize binding)
- **Tests:** Verify index appears in dashboard
- **Depends on:** none
- **Status:** complete
- **Branch:** `feature/knowledge-indexing`
- **PR:** #4

#### A2. [L] Restructure knowledge base tags 🔴 DEMO-CRITICAL
- **Description:** Restructure `knowledge/tags/` to clearly separate sections from models. This prevents confusion and aids retrieval filtering.
- **Changes:**
  1. Rename `canvas-sections/` to contain ONLY the 11 canonical sections (numbered)
  2. Create new `venture-models/` directory for conceptual groupings
  3. Move sub-concepts (JTBD, Early Adopters, etc.) under models, not sections
  4. Create new Problem section (03) - doesn't exist currently
  5. Flatten deep nesting where possible
  6. Update all tag definition files to reference correct structure
- **Files:** 
  - `knowledge/tags/canvas-sections/` (restructure)
  - `knowledge/tags/venture-models/` (new)
  - All tag definition `.md` files
- **New Structure:**
  ```
  tags/
  ├── canvas-sections/           # 11 numbered sections only
  │   ├── 01-purpose/
  │   ├── 02-customer-segments/
  │   ├── 03-problem/            # NEW
  │   ├── 04-unique-value-proposition/
  │   ├── 05-solution/
  │   ├── 06-channels/
  │   ├── 07-revenue/
  │   ├── 08-cost-structure/
  │   ├── 09-key-metrics/
  │   ├── 10-unfair-advantage/
  │   └── 11-impact/
  │
  ├── venture-models/             # Conceptual groupings
  │   ├── customer-model/        # References sections 2-5
  │   │   ├── jobs-to-be-done/   # Sub-concept
  │   │   ├── existing-alternatives/
  │   │   └── customer-types/
  │   │       └── early-adopters/
  │   ├── economic-model/        # References sections 6-8, 10
  │   │   └── financial-model/
  │   └── impact-model/          # = section 11 expanded
  │       ├── issue/
  │       ├── participants/
  │       ├── activities/
  │       ├── outputs/
  │       ├── short-term-outcomes/
  │       ├── medium-term-outcomes/
  │       ├── long-term-outcomes/
  │       └── impact/            # Same as section 11
  ```
- **Tests:** 
  - All markdown files parse without errors
  - Tag references resolve correctly
  - Venture examples still have valid tags
- **Depends on:** none (blocks A3-A6)
- **Status:** pending
- **Guide:** See [A2-knowledge-base-restructure.md](A2-knowledge-base-restructure.md)

#### A3. [M] Update venture example frontmatter (DEMO-CRITICAL)
- **Description:** Update venture example files to use canonical section names and new tag structure
- **Changes:**
  - "Customers" → reference `02-customer-segments`
  - "Costs" → reference `08-cost-structure`  
  - "Advantage" → reference `10-unfair-advantage`
  - Update tag paths to new structure
- **Files:** `knowledge/agent-content/venture-example-libraries/**/*-slc.md`
- **Tests:** Frontmatter validates against new tag structure
- **Depends on:** A2
- **Status:** pending

#### A4. [M] Create indexing script scaffold (DEMO-CRITICAL)
- **Description:** Set up Node.js script structure with gray-matter for parsing markdown frontmatter
- **Files:** `scripts/index-knowledge-base.ts`, `package.json` (add gray-matter)
- **Tests:** Script runs without errors on sample file
- **Depends on:** A1, A2
- **Status:** pending

#### A5. [L] Implement content parsing and chunking (DEMO-CRITICAL)
- **Description:** Parse knowledge base files, extract tags from frontmatter, chunk content (500-800 tokens). Map frontmatter tags to Vectorize metadata format (10 indexed properties).
- **Metadata mapping must include:**
  - `canvas_section`: section ID (01-11)
  - `venture_model`: model ID (customer, economic, impact, null)
  - `section_number`: integer 1-11 for ordering
  - Venture dimensions (stage, impact area, etc.)
- **Files:** `scripts/index-knowledge-base.ts`, `scripts/chunking.ts`
- **Tests:** Verify chunks have correct metadata, test on venture examples
- **Depends on:** A3, A4
- **Status:** pending

#### A6. [L] Generate embeddings and upload to Vectorize (DEMO-CRITICAL)
- **Description:** Use Workers AI REST API to generate embeddings (@cf/baai/bge-base-en-v1.5), upload vectors with metadata to Vectorize index
- **Files:** `scripts/index-knowledge-base.ts`
- **Tests:** Query Vectorize with sample filter, verify results
- **Depends on:** A5
- **Status:** pending

#### A7. [S] Document metadata mapping
- **Description:** Create reference doc showing how knowledge base frontmatter maps to Vectorize metadata properties
- **Files:** `docs/metadata-mapping.md`
- **Tests:** None (documentation)
- **Depends on:** A6
- **Status:** pending

---

### Teammate B: Backend / API Worker

#### B1. [M] Initialize Cloudflare Worker project ✅
- **Description:** Create Worker project with wrangler, configure bindings (Vectorize, Durable Objects, AI Gateway), set up TypeScript
- **Files:** `wrangler.toml`, `worker/index.ts`, `src/durable-objects/UserSession.ts`, `src/types/`, `tsconfig.json`, `package.json`
- **Tests:** `wrangler dev` runs, basic health endpoint works
- **Depends on:** none
- **Status:** complete
- **Branch:** `feature/backend-api`
- **PR:** #5

#### B2. [L] Implement Durable Object with SQLite schema (DEMO-CRITICAL)
- **Description:** Create UserSession Durable Object with SQLite schema for all state.
- **Schema tables:**
  - `session`: id, current_section (1-11), timestamps
  - `venture_profile`: 7 dimensions with confidence/confirmed JSON
  - `canvas_section`: 10 rows (sections 1-10, simple content)
  - `impact_model`: 8 fields (section 11's nested structure)
  - `message`: chat history
- **Key design:** 
  - Sections 1-10 stored in `canvas_section` table (simple strings)
  - Section 11 stored in `impact_model` table (8-field causality chain)
  - `impact_model.impact` field IS section 11's display content
- **CRUD methods:**
  - Session: create, get, updateCurrentSection
  - VentureProfile: get, update, updateDimensionConfidence
  - CanvasSections: get (all), get (one), update, initialize
  - ImpactModel: get, update (syncs with section 11)
  - Messages: add, getRecent
- **Files:** `src/durable-objects/UserSession.ts`, `src/types/canvas.ts`
- **Tests:** Create session, write/read each table, verify Impact sync
- **Depends on:** B1
- **Status:** pending

#### B3. [M] Implement session management endpoints (DEMO-CRITICAL)
- **Description:** Create session CRUD endpoints, session ID generation (crypto.randomUUID), route requests to correct Durable Object
- **Files:** `src/worker/session.ts`, `worker/index.ts`
- **Tests:** Create session, retrieve session, verify persistence
- **Depends on:** B2
- **Status:** pending

#### B4. [L] Implement Selection Matrix filter building (DEMO-CRITICAL)
- **Description:** Build Vectorize metadata filters from venture profile. Support filtering by:
  - `canvas_section` (numbered 01-11)
  - `venture_model` (customer, economic, impact)
  - Venture dimensions (stage, impact area, industry, etc.)
- **Implement progressive relaxation:** strict → remove industry → remove impact area → model-only → pure semantic
- **Files:** `src/retrieval/selection-matrix.ts`, `src/retrieval/vector-search.ts`
- **Tests:** Test filter building with sample profiles, test relaxation when no results
- **Depends on:** B3, A6 (needs indexed data)
- **Status:** pending

#### B5. [L] Implement chat handler with RAG (DEMO-CRITICAL)
- **Description:** Chat endpoint that queries Vectorize with Selection Matrix, builds prompt with retrieved context, calls Anthropic via AI Gateway, handles streaming response
- **Files:** `src/worker/chat.ts`, `src/llm/prompts.ts`
- **Tests:** Send message, verify RAG context included, verify response
- **Depends on:** B4
- **Status:** pending

#### B6. [M] Implement dimension inference
- **Description:** Extract venture dimensions from conversation with confidence scores, update venture_profile when confidence > 0.7. Also infer current curriculum section when possible.
- **Files:** `src/llm/dimension-inference.ts`
- **Tests:** Test inference on sample conversations, verify confidence thresholds
- **Depends on:** B5
- **Status:** pending

#### B7. [M] Implement canvas CRUD endpoints
- **Description:** 
  - `GET /api/canvas` - Returns full CanvasState (10 sections + ImpactModel)
  - `PUT /api/canvas/:section` - Update sections 1-10 by number or ID
  - `PUT /api/canvas/impact-model` - Update Impact Model fields (auto-syncs section 11)
  - `PUT /api/canvas/impact-model/impact` - Update just the impact summary (syncs both places)
- **Files:** `src/worker/canvas.ts`
- **Tests:** Update section, verify persistence, update Impact Model, verify sync
- **Depends on:** B2
- **Status:** pending

#### B8. [S] Implement export endpoint
- **Description:** Export canvas as Markdown or JSON format. Impact Model exports nested within section 11.
- **Files:** `src/worker/canvas.ts`
- **Tests:** Export both formats, verify Impact Model included correctly
- **Depends on:** B7
- **Status:** pending

#### B9. [S] Add rate limiting
- **Description:** Configure rate limiting (100 req/min per session). Note: CORS not needed with Workers Static Assets (single origin)
- **Files:** `worker/index.ts`
- **Tests:** Test rate limit enforcement
- **Depends on:** B1
- **Status:** pending

#### B10. [M] Add error handling
- **Description:** Handle zero results (methodology fallback), LLM API failures (graceful degradation), request timeouts
- **Files:** `src/worker/errors.ts`, `src/retrieval/fallback.ts`
- **Tests:** Simulate failures, verify graceful handling
- **Depends on:** B5
- **Status:** pending

---

### Teammate C: Frontend

#### C1. [M] Initialize React app with Workers Static Assets ✅
- **Description:** Create React app with Vite, configure for Workers Static Assets deployment, install AI SDK v5
- **Files:** `src/`, `worker/`, `package.json`, `vite.config.ts`, `wrangler.toml`, `index.html`
- **Tests:** `npm run dev` runs, app loads in browser
- **Depends on:** none
- **Status:** complete
- **Branch:** `feature/frontend`
- **PR:** #6

#### C2. [M] Implement chat interface (DEMO-CRITICAL)
- **Description:** Chat UI with message list, input field, using `useAgentChat` hook from AI SDK
- **Files:** `src/components/Chat.tsx`, `src/App.tsx`
- **Tests:** Send message, see response (mock initially)
- **Depends on:** C1
- **Status:** pending

#### C3. [M] Connect chat to backend (DEMO-CRITICAL)
- **Description:** Connect useAgentChat to Worker API, handle session ID storage in localStorage, implement reconnection
- **Files:** `src/components/Chat.tsx`, `src/hooks/useSession.ts`
- **Tests:** Messages persist across refresh, session continues
- **Depends on:** C2, B5 (needs chat endpoint)
- **Status:** pending

#### C4. [L] Implement canvas display
- **Description:** Visual canvas layout showing 11 numbered sections with completion status. Sections 1-10 display simple content. Section 11 (Impact) shows summary with expand option.
- **Must show:**
  - Section numbers (1-11) for curriculum tracking
  - Section names from `CANVAS_SECTION_LABELS`
  - Completion indicators
  - Model groupings as visual hints (not navigation)
- **Files:** `src/components/Canvas.tsx`, `src/components/CanvasSection.tsx`
- **Tests:** Canvas renders all 11 sections, shows correct data from API
- **Depends on:** C1, B7 (needs canvas endpoint)
- **Status:** pending

#### C5. [M] Implement nested Impact Model display
- **Description:** Section 11 (Impact) expands to show full causality chain. The 8 Impact Model fields display as a flow: Issue → Participants → Activities → Outputs → Outcomes (3 levels) → Impact.
- **Key behavior:** 
  - Collapsed: Shows `impactModel.impact` as section 11 content
  - Expanded: Shows all 8 fields with causality arrows
  - Editing any field (including `impact`) syncs automatically
- **Files:** `src/components/ImpactModel.tsx`
- **Tests:** Expand/collapse works, all 8 fields display, editing syncs
- **Depends on:** C4
- **Status:** pending

#### C6. [S] Implement copy button
- **Description:** Copy button to copy canvas section content to clipboard
- **Files:** `src/components/CanvasSection.tsx`
- **Tests:** Click copy, verify clipboard content
- **Depends on:** C4
- **Status:** pending

#### C7. [M] Implement export menu
- **Description:** Export dropdown with Markdown and JSON options, triggers download
- **Files:** `src/components/ExportMenu.tsx`
- **Tests:** Export both formats, verify file downloads
- **Depends on:** C4, B8 (needs export endpoint)
- **Status:** pending

#### C8. [M] Add loading states and error handling
- **Description:** Loading spinners, error messages, connection status indicator
- **Files:** `src/components/` (various)
- **Tests:** Simulate slow responses, errors, verify UI feedback
- **Depends on:** C3, C4
- **Status:** pending

#### C9. [S] Style for demo
- **Description:** Basic styling to make demo presentable (not production polish)
- **Files:** `src/styles/`
- **Tests:** Visual review
- **Depends on:** C8
- **Status:** pending

---

### Integration Tasks (All teammates)

#### I1. [M] End-to-end integration testing
- **Description:** Test full flow: new session → chat → dimension inference → canvas update → Impact Model sync → export
- **Files:** None (manual testing)
- **Tests:** Walk through demo scenarios from requirements
- **Depends on:** All MVP tasks
- **Status:** pending

#### I2. [S] Demo preparation
- **Description:** Prepare demo script covering scenarios from requirements, pre-populate test data if needed
- **Files:** `docs/demo-script.md`
- **Tests:** Run through demo script
- **Depends on:** I1
- **Status:** pending

---

## Complexity Key
- **[S]** Small - < 30 min
- **[M]** Medium - 30 min to 2 hours
- **[L]** Large - 2+ hours

## Task Summary

| Teammate | Demo Tasks | MVP Tasks | Total |
|----------|------------|-----------|-------|
| A | 6 (A1-A6) | 1 (A7) | 7 |
| B | 5 (B1-B5) | 5 (B6-B10) | 10 |
| C | 3 (C1-C3) | 6 (C4-C9) | 9 |
| All | — | 2 (I1-I2) | 2 |

## Notes

- **A2 is the critical blocker** - KB restructure must happen before any indexing. Start here.
- **Demo = chat + RAG** - That's it. Canvas display, dimension inference, and polish come after.
- **Impact Model nests in section 11** - The `impact` field IS section 11's content. They stay in sync.
- **Section numbers matter** - Frontend should show 1-11 for curriculum tracking.
- **Models are just conceptual** - Not navigation or storage, just grouping for understanding.
