# Frontend

**Status: Placeholder (C1 complete, C2-C3 pending)**

This is the React frontend that will provide the chat interface and canvas display. Currently shows a placeholder - the actual UI is implemented in Track C tasks.

## Current State

`App.tsx` renders a static placeholder that says "Chat interface coming soon...". The chat component and backend connection are pending.

## Planned Features (from spec)

| Feature | Task | Description |
|---------|------|-------------|
| Chat interface | C2 | Message list, input field, `useAgentChat` hook |
| Backend connection | C3 | Connect to Worker API, session management |
| Canvas display | C4 | Visual layout of all 11 sections |
| Impact Model view | C5 | Expandable causality chain (8 fields) |
| Export menu | C7 | Markdown and JSON download |

## Blocking Dependencies

```
C1 ✅ → C2 (chat UI) → C3 (connect) → DEMO
                            ↑
                      needs B5 (chat endpoint)
```

C2 (Chat interface) can start now. C3 needs the backend chat endpoint (B5).

## Files

- `App.tsx` - Main component (placeholder)
- `main.tsx` - React entry point
- `index.css` - Global styles
- `types/` - TypeScript interfaces (canvas.ts, venture.ts)
- `frontend/` - Additional frontend code (empty)

## Development

```bash
npm run dev    # Start Vite dev server
npm run build  # Production build
```

## Key Dependencies

- React 19
- Vite (build tool)
- AI SDK v5 (`useAgentChat` hook for chat - not yet used)
- TypeScript (strict mode)

## See Also

- [tasks.md](../spec/slc-ai-advisor-mvp/tasks.md) - C1-C9 task details
- [design.md](../spec/slc-ai-advisor-mvp/design.md) - API endpoints to connect to
- [Issue #12](https://github.com/rathermercurial/slc-ai-advisor/issues/12) - Track C parent issue
