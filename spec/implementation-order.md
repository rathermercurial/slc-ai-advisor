# SLC AI Advisor - Implementation Order

> **Maintaining this document:** When completing an issue, check off the corresponding item below and update the "Status" field. Use `gh issue close <number>` to close the GitHub issue.

> **IMPORTANT - Manual Testing Workflow:** At the end of each phase, after `npm run typecheck` and `npm run build` pass, Claude must:
> 1. Start the dev server (`npm run dev`)
> 2. Provide the preview URL to the user (typically `http://localhost:5173`)
> 3. **STOP and wait for human approval** before closing issues or proceeding
> 4. Only after explicit approval: close GitHub issues, update phase status, proceed to next phase

## Quick Reference

| Phase | Focus | Issues | Status |
|-------|-------|--------|--------|
| 1 | Critical Fixes | B1, B2 | In Progress |
| 2 | Backend Optimization | B3-B8 | Not Started |
| 3 | Frontend + Testing | F0-F4, T1-T2 | Not Started |
| 4 | Polish + Knowledge | F3-F4, K1-K2, T3 | Not Started |
| 5 | Advanced Features | A1 | Deferred |

---

## Phase 1: Critical Fixes

**Goal:** Fix tone effectiveness and clean up codebase before other work.

- [ ] [#89 - B1: Improve Tone Profile Effectiveness](https://github.com/rathermercurial/slc-ai-advisor/issues/89)
  - Move tone modifiers before canvas context in system prompt
  - Strengthen modifiers with explicit behavioral instructions
  - Files: `worker/agents/prompts.ts`, `worker/config/tone-profiles.ts`

- [ ] [#90 - B2: Delete Unused Duplicate Prompts File](https://github.com/rathermercurial/slc-ai-advisor/issues/90)
  - Delete `worker/llm/prompts.ts`
  - Verify no broken imports

- [ ] **Verify Build & Manual Testing**
  - Run `npm run typecheck` and `npm run build`
  - Start dev server with `npm run dev`
  - **STOP HERE**: Provide preview URL to user (typically `http://localhost:5173`)
  - Wait for human approval before proceeding
  - Test: Verify beginner tone uses simpler language and avoids banned phrases
  - Only after approval: Close issues, update status, proceed to next phase

---

## Phase 2: Backend Optimization

**Goal:** Optimize token usage, improve RAG search, add reliability patterns.

**Prerequisite:** Phase 1 complete

- [ ] [#87 - B3: Agent Behaviour Design](https://github.com/rathermercurial/slc-ai-advisor/issues/87)
  - Create `knowledge/instructions/tone.md`
  - Create `knowledge/instructions/behavior.md`
  - Create `knowledge/programs/generic/pedagogy.md`

- [ ] [#91 - B4: Token Optimization with Context Windowing](https://github.com/rathermercurial/slc-ai-advisor/issues/91)
  - Skip empty sections in canvas context
  - Truncate non-current sections to 150 chars
  - File: `worker/agents/prompts.ts`

- [ ] [#92 - B5: RAG Progressive Relaxation (5 Levels)](https://github.com/rathermercurial/slc-ai-advisor/issues/92)
  - Implement 5-level filter relaxation
  - Stop at first level with 3+ results
  - File: `worker/retrieval/vector-search.ts`

- [ ] [#93 - B6: Tool Loop Circuit Breaker](https://github.com/rathermercurial/slc-ai-advisor/issues/93)
  - Track consecutive tool failures
  - Break after 3 failures or same-tool repeat
  - File: `worker/agents/SLCAgent.ts`

- [ ] [#94 - B7: Token Counting in Metrics](https://github.com/rathermercurial/slc-ai-advisor/issues/94)
  - Populate token counts from `event.usage`
  - File: `worker/agents/SLCAgent.ts`

- [ ] [#95 - B8: Tool Execution Metrics](https://github.com/rathermercurial/slc-ai-advisor/issues/95)
  - Track tool duration and success/failure
  - File: `worker/agents/SLCAgent.ts`

---

## Phase 3: Frontend + Testing

**Goal:** Merge frontend PR, add onboarding, establish test coverage.

**Prerequisite:** Phase 2 complete (B4-B6 at minimum)

### Frontend

- [ ] [#96 - F0: Review and Merge PR 86](https://github.com/rathermercurial/slc-ai-advisor/issues/96)
  - Review [PR #86](https://github.com/rathermercurial/slc-ai-advisor/pull/86)
  - Run test plan from PR description
  - Merge to main

- [ ] [#97 - F1: Onboarding Welcome Flow](https://github.com/rathermercurial/slc-ai-advisor/issues/97)
  - Create `OnboardingFlow.tsx`
  - Detect first-time users via localStorage
  - Set tone profile from experience level

- [ ] [#98 - F2: Split Canvas Component](https://github.com/rathermercurial/slc-ai-advisor/issues/98)
  - Extract `CanvasGrid.tsx`
  - Extract `CanvasToolbar.tsx`
  - Reduce `Canvas.tsx` to ~200 lines

### Testing

- [ ] [#103 - T1: Unit Tests for Tool Execution](https://github.com/rathermercurial/slc-ai-advisor/issues/103)
  - Create `worker/agents/tools.test.ts`
  - Test all canvas update tools
  - Test all search tools

- [ ] [#104 - T2: Integration Tests for RAG Pipeline](https://github.com/rathermercurial/slc-ai-advisor/issues/104)
  - Create `worker/retrieval/vector-search.test.ts`
  - Test query building and progressive relaxation

---

## Phase 4: Polish + Knowledge

**Goal:** Improve UX details, strengthen knowledge base content.

**Prerequisite:** Phase 3 complete

### Frontend Polish

- [ ] [#99 - F3: Document Viewer for KB Results](https://github.com/rathermercurial/slc-ai-advisor/issues/99)
  - Create `DocumentViewer.tsx`
  - Render markdown search results properly

- [ ] [#100 - F4: Enhanced Status Indicators](https://github.com/rathermercurial/slc-ai-advisor/issues/100)
  - Show granular agent activity states
  - Update `ConnectionStatus.tsx`

### Knowledge Base

- [ ] [#101 - K1: Strengthen Methodology Content](https://github.com/rathermercurial/slc-ai-advisor/issues/101)
  - Add "how to" guidance to each methodology file
  - Verify frontmatter tags

- [ ] [#102 - K2: Add More Venture Examples](https://github.com/rathermercurial/slc-ai-advisor/issues/102)
  - Add 3-5 examples covering underrepresented dimensions
  - Focus on idea-stage and early-stage ventures

### Testing

- [ ] [#105 - T3: Unit Tests for Model Managers](https://github.com/rathermercurial/slc-ai-advisor/issues/105)
  - Create tests for CustomerModelManager
  - Create tests for EconomicModelManager
  - Create tests for ImpactModelManager

---

## Phase 5: Advanced Features (Deferred)

**Goal:** Cost optimization and intelligent features for post-MVP.

**Prerequisite:** Phases 1-4 complete, MVP shipped

- [ ] [#106 - A1: Advanced Features Roadmap](https://github.com/rathermercurial/slc-ai-advisor/issues/106)
  - A1.1: Request Classification Router (Haiku/Sonnet routing)
  - A1.2: Dimension Inference from Conversation
  - A1.3: Learning Program Skills (progressive tool unlocking)

---

## Dependencies Graph

```
Phase 1 (Critical)
├── B1: Tone Profiles ────┐
└── B2: Cleanup ──────────┴─→ Build Verification

Phase 2 (Backend) ─────────────────────────────────┐
├── B3: Agent Behavior Design                      │
├── B4: Token Optimization (needs B1 patterns)     │
├── B5: RAG Relaxation                             │
├── B6: Circuit Breaker                            │
└── B7-B8: Metrics                                 │
                                                   │
Phase 3 (Frontend + Testing) ←─────────────────────┤
├── F0: Merge PR 86 (independent)                  │
├── F1: Onboarding (needs B1 tone profiles)        │
├── F2: Canvas Split (independent)                 │
├── T1: Tool Tests (needs B6 for circuit breaker)  │
└── T2: RAG Tests (needs B5 for relaxation)        │
                                                   │
Phase 4 (Polish) ←─────────────────────────────────┤
├── F3: Document Viewer                            │
├── F4: Status Indicators                          │
├── K1: Methodology Content (needs B5 for testing) │
├── K2: More Examples                              │
└── T3: Model Manager Tests                        │
                                                   │
Phase 5 (Advanced) ←───────────────────────────────┘
└── A1: All advanced features (post-MVP)
```

---

## How to Update This Document

### When starting an issue:
1. Assign yourself on GitHub: `gh issue edit <number> --add-assignee @me`
2. Create a branch: `git checkout -b fix/issue-<number>-short-description`

### When completing an issue:
1. Check off the item in this document: `- [x]`
2. Close the GitHub issue: `gh issue close <number>`
3. Update the Phase status in the Quick Reference table
4. Commit this file with your PR

### Status values for Quick Reference table:
- `Not Started` - No work begun
- `In Progress` - At least one issue started
- `Blocked` - Waiting on dependency
- `Complete` - All issues in phase closed

### Commands reference:
```bash
# List open issues
gh issue list --state open

# View issue details
gh issue view <number>

# Close an issue
gh issue close <number>

# Assign yourself
gh issue edit <number> --add-assignee @me

# Add a label
gh issue edit <number> --add-label "in-progress"
```

---

## Issue Links Summary

| ID | Title | Link |
|----|-------|------|
| B1 | Improve Tone Profile Effectiveness | [#89](https://github.com/rathermercurial/slc-ai-advisor/issues/89) |
| B2 | Delete Unused Duplicate Prompts File | [#90](https://github.com/rathermercurial/slc-ai-advisor/issues/90) |
| B3 | Agent Behaviour Design | [#87](https://github.com/rathermercurial/slc-ai-advisor/issues/87) |
| B4 | Token Optimization with Context Windowing | [#91](https://github.com/rathermercurial/slc-ai-advisor/issues/91) |
| B5 | RAG Progressive Relaxation (5 Levels) | [#92](https://github.com/rathermercurial/slc-ai-advisor/issues/92) |
| B6 | Tool Loop Circuit Breaker | [#93](https://github.com/rathermercurial/slc-ai-advisor/issues/93) |
| B7 | Token Counting in Metrics | [#94](https://github.com/rathermercurial/slc-ai-advisor/issues/94) |
| B8 | Tool Execution Metrics | [#95](https://github.com/rathermercurial/slc-ai-advisor/issues/95) |
| F0 | Review and Merge PR 86 | [#96](https://github.com/rathermercurial/slc-ai-advisor/issues/96) |
| F1 | Onboarding Welcome Flow | [#97](https://github.com/rathermercurial/slc-ai-advisor/issues/97) |
| F2 | Split Canvas Component | [#98](https://github.com/rathermercurial/slc-ai-advisor/issues/98) |
| F3 | Document Viewer for KB Results | [#99](https://github.com/rathermercurial/slc-ai-advisor/issues/99) |
| F4 | Enhanced Status Indicators | [#100](https://github.com/rathermercurial/slc-ai-advisor/issues/100) |
| K1 | Strengthen Methodology Content | [#101](https://github.com/rathermercurial/slc-ai-advisor/issues/101) |
| K2 | Add More Venture Examples | [#102](https://github.com/rathermercurial/slc-ai-advisor/issues/102) |
| T1 | Unit Tests for Tool Execution | [#103](https://github.com/rathermercurial/slc-ai-advisor/issues/103) |
| T2 | Integration Tests for RAG Pipeline | [#104](https://github.com/rathermercurial/slc-ai-advisor/issues/104) |
| T3 | Unit Tests for Model Managers | [#105](https://github.com/rathermercurial/slc-ai-advisor/issues/105) |
| A1 | Advanced Features Roadmap | [#106](https://github.com/rathermercurial/slc-ai-advisor/issues/106) |
