# SLC AI Advisor - Milestones

## Overview

| Milestone | Success Criteria |
|-----------|------------------|
| **Demo** | Chat works with RAG. Canvas persists. Streaming with status updates. |
| **MVP** | Full Selection Matrix. Dimensions inferred. Impact Model synced. |
| **Integration** | Functions abstracted for embedding in any frontend. |

---

## Demo

**Goal:** Functional advisor that answers methodology questions using indexed knowledge base.

**Definition of Done:**
- User can chat with advisor and receive streaming responses
- Advisor retrieves relevant content from Vectorize (basic filtering)
- Canvas state persists across sessions
- Status updates visible in UI during processing

**Architecture:** Two-component separation (SLCAgent + CanvasDO)

**Key Constraint:** KB restructure blocks indexing work.

### Implementation Phases

| Phase | Priority | Description | Issue | Status |
|-------|----------|-------------|-------|--------|
| **0** | P0 | Foundation - Model Managers + CanvasDO + SLCAgent skeleton | #40 | ✅ COMPLETE |
| **1** | P0 | Streaming & Agent - Wire SLCAgent with `onChatMessage` | #36 | ✅ COMPLETE |
| **2** | P0 | Session Persistence - localStorage + agent state | #37 | 🔄 IN PROGRESS |
| **3** | P0 | Knowledge Tools - Agent-invoked RAG with Selection Matrix | #42 | 🔄 IN PROGRESS |
| **4** | P1 | Canvas Tools - Route to Model Managers with validation | #38 | 🔄 IN PROGRESS |
| **5** | P2 | Observability - Analytics Engine, structured logging | #39 | 🔄 IN PROGRESS |
| **6** | P3 | User Context Pipeline - Deferred to MVP | #41 | ⏸️ DEFERRED |

**Completed:**
- PR #43: Phase 0 (Model Managers, CanvasDO, venture profile)
- PR #45: Phase 1 (Streaming, tools, frontend integration)

**Current:** Phases 2-5 executing in parallel on `feature/backend`

---

## MVP

**Goal:** Full Selection Matrix with dimensional filtering, ready for user testing.

**Definition of Done:**
- Selection Matrix filters by all 7 venture dimensions
- Progressive relaxation when exact matches unavailable
- Venture dimensions inferred from conversation (confidence > 0.7)
- Impact Model syncs with impact section
- Canvas export (Markdown, JSON)

**Builds on:** Demo milestone

---

## Integration (Future)

**Goal:** Ready for embedding in socialleancanvas.com or other frontends.

**Definition of Done:**
- Functions fully abstracted from demo UI
- Clean API boundaries
- Documentation for integration

---

## References

- Requirements: `spec/slc-ai-advisor-mvp/requirements.md`
- Design: `spec/slc-ai-advisor-mvp/design.md`
- Architecture notes: `tmp/backend-suggestions.md`
