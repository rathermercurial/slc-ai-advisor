# [C1-C3] Frontend Setup to Demo

## Problem

The frontend track (C1-C3) implements the user interface for the SLC AI Advisor. This issue consolidates Demo-critical frontend tasks to enable the core chat + canvas experience.

## Background

**Track C** owns the React application with:
- Chat interface using `useAgentChat` hook
- Canvas display with 11 sections
- Session persistence via localStorage

**PR #16** (`claude/tweak-frontend`) by @explorience already implements significant functionality including markdown rendering, canvas layout, and theme support. This work was rebased onto main and aligned with canonical type definitions.

## What PR #16 Contributes

| Component | Implementation | Status |
|-----------|---------------|--------|
| Two-column layout | `src/App.tsx` | Complete |
| Chat component | `src/components/Chat.tsx` | Complete |
| Markdown rendering | react-markdown integration | Complete |
| Canvas component | `src/components/Canvas.tsx` | Complete |
| Section badges | Numbered indicators (1-11) | Complete |
| Completion indicators | checkmark/circle per section | Complete |
| Model groupings | Visual badges per model | Complete |
| Theme toggle | Dark/light mode | Complete |
| Session ID | localStorage persistence | Complete |

## Remaining Work (Demo-Critical)

| Task | Description | Status |
|------|-------------|--------|
| C3: Backend Connection | Wire `useAgentChat` to `/api/chat` endpoint | Pending |
| SSE Streaming | Handle streaming responses from backend | Pending |
| Session Reconnection | Resume session on page reload | Pending |

## Integration Points

| System | Interface | Notes |
|--------|-----------|-------|
| Backend (Track B) | `POST /api/chat` | Requires B5 complete |
| Backend (Track B) | `GET /api/canvas` | For canvas sync (MVP) |
| Types | `src/types/canvas.ts` | Use `CanvasSectionId`, `ImpactModel` |

## Expected Outcomes

**After rebase (complete):**
- PR #16 applies cleanly to current main
- All existing functionality preserved
- Types align with `src/types/` definitions

**After C3 complete:**
- User sends message, receives AI response
- Messages render with markdown formatting
- Session persists across page reloads

## Out of Scope (MVP tasks)

- C4: Canvas CRUD (requires B7)
- C5: Impact Model display (requires B7)
- C6-C7: Copy/export buttons (requires B8)
- C8-C9: Loading states, demo styling

## Definition of Done

- [x] PR #16 rebased onto main without conflicts
- [x] TypeScript errors resolved (canonical section names)
- [ ] Chat sends messages to backend
- [ ] Streaming responses display correctly
- [ ] Session ID persists and reconnects
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] Development server runs (`npm run dev`)

## Related

- **Branch:** `claude/rebase-frontend-branch-gz3HL`
- **Original PR:** #16
- **Parent Issue:** #12 (Track C)
- **Blocked by:** #18 (completed)
