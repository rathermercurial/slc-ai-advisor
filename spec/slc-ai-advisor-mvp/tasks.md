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
| **2** | P0 | Session Persistence - localStorage + agent state | #37 | ✅ COMPLETE |
| **3** | P0 | Knowledge Tools - Agent-invoked RAG with Selection Matrix | #42 | ✅ COMPLETE |
| **4** | P1 | Canvas Tools - Route to Model Managers with validation | #38 | ✅ COMPLETE |
| **5** | P2 | Observability - Analytics Engine, structured logging | #39 | ✅ COMPLETE |
| **6** | P3 | User Context Pipeline - Deferred to MVP | #41 | ⏸️ DEFERRED |

**Completed:**
- PR #43: Phase 0 (Model Managers, CanvasDO, venture profile)
- PR #45: Phase 1 (Streaming, tools, frontend integration)
- PR #50: Unified knowledge tools
- Phases 2-5 on `feature/backend`
- PR #75: Multi-canvas/thread support
- PR #76: P1 Configuration & State (tone profiles, session lifecycle)

**Ready for:** Demo milestone - pending KB indexing (A2)

---

## Post-Demo Enhancements

| Priority | Feature | Issue | Status |
|----------|---------|-------|--------|
| **P0** | Tool Modularization | #70 | ✅ COMPLETE |
| **P1** | Configuration & State - Tone profiles, session lifecycle | #66 | ✅ COMPLETE |
| **P3** | Documentation - Backend docs, API reference, spec updates | #68 | 🔄 IN PROGRESS |
| **A1-A5** | Deferred Items - Various A-series improvements | #65 | ⏸️ BACKLOG |

**P1 Features (PR #76):**
- Tone profiles (`beginner` | `experienced`) with safe defaults
- AgentState extended with session lifecycle
- Session status: `new` → `in_progress` → `paused` → `complete`
- SLC methodology skills (`.claude/skills/slc-methodology/`)

**P3 Documentation (Issue #68):**
- `docs/BACKEND.md` - Architecture with Mermaid diagrams
- `docs/API.md` - REST API with curl examples
- Updated CLAUDE.md, requirements.md, design.md, tasks.md

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
- Multi-canvas: `spec/slc-ai-advisor-mvp/multi-canvas-architecture.md`
- API Contracts: `spec/api-contracts.md`
- Backend Docs: `docs/BACKEND.md`
- API Reference: `docs/API.md`
