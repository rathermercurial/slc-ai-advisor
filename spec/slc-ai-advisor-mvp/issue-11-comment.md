## Implementation Plan for B1-B5 (Backend to Demo)

I've analyzed the codebase and created a comprehensive implementation plan.

**Branch:** `claude/issue-11-implementation-iBnMY`
**Full Plan:** [`spec/slc-ai-advisor-mvp/B1-B5-implementation-plan.md`](https://github.com/rathermercurial/slc-ai-advisor/blob/claude/issue-11-implementation-iBnMY/spec/slc-ai-advisor-mvp/B1-B5-implementation-plan.md)

---

### Current State

**B1 (Worker Setup) is complete:**
- Worker project initialized with `wrangler.toml`
- Bindings configured: Vectorize, Durable Objects, Workers AI
- Type definitions in `src/types/`
- Basic health endpoint working

### Tasks to Implement

| Task | Description | Size |
|------|-------------|------|
| **B2** | Durable Object + SQLite schema | Large |
| **B3** | Session management endpoints | Medium |
| **B4** | Basic Vectorize filtering | Medium |
| **B5** | Chat handler with RAG | Large |

### File Structure

```
worker/
├── index.ts                    # Router, exports UserSession
├── env.d.ts                    # Env type extensions (exists)
├── durable-objects/
│   └── UserSession.ts          # NEW: Durable Object with SQLite
├── routes/
│   ├── session.ts              # NEW: Session endpoints (B3)
│   └── chat.ts                 # NEW: Chat endpoint (B5)
├── retrieval/
│   └── vector-search.ts        # NEW: Vectorize queries (B4)
└── llm/
    └── prompts.ts              # NEW: System prompts for Claude
```

### Key Implementation Details

**SQLite Schema (5 tables):**
- `session` - Session metadata and program
- `venture_profile` - 7 dimensions with confidence scores
- `canvas_section` - Standard sections (all except impact)
- `impact_model` - 8-field causality chain
- `message` - Chat history

**API Endpoints:**
```
POST /api/session         → Create session
GET  /api/session/:id     → Get session state
POST /api/chat            → Chat with RAG
```

**RAG Pipeline:**
1. Parse user intent (methodology vs examples)
2. Generate embedding via Workers AI (@cf/baai/bge-m3)
3. Query Vectorize with namespace + metadata filters
4. Build system prompt with retrieved context
5. Call Claude via AI Gateway
6. Store messages in session

### Environment Setup Required

Before implementation, set up:
1. **AI Gateway** in Cloudflare Dashboard (AI → AI Gateway → Create)
2. **Secrets** via wrangler:
   ```bash
   wrangler secret put ANTHROPIC_API_KEY
   wrangler secret put CF_ACCOUNT_ID
   wrangler secret put CF_GATEWAY_ID
   ```

### Dependencies

- B4 can be tested without indexed KB (A6), but will return empty results
- B5 requires AI Gateway configuration for Claude calls
- All tasks depend on B2 (Durable Object) being complete first

---

Ready to begin implementation on this branch. The plan includes acceptance criteria for each task.
