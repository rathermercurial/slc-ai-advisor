## Implementation Plan for B1-B5 (Backend to Demo)

I've analyzed the codebase and created a comprehensive implementation plan.

**Branch:** `claude/issue-11-implementation-iBnMY`
**Full Plan:** [`spec/slc-ai-advisor-mvp/B1-B5-implementation-plan.md`](https://github.com/rathermercurial/slc-ai-advisor/blob/claude/issue-11-implementation-iBnMY/spec/slc-ai-advisor-mvp/B1-B5-implementation-plan.md)

---

### Conceptual Architecture

The system has three distinct concepts that must be kept separate:

| Concept | Count | Purpose | Storage |
|---------|-------|---------|---------|
| **Canvas Sections** | 11 | Content users fill in | `canvas_section` + `impact_model` tables |
| **Models** | 3 | Conceptual groupings for retrieval/display | Views over sections (not stored) |
| **Venture Dimensions** | 7 | Selection Matrix filtering | `venture_profile` table |

**Models as Views:**
- `getCustomerModel()` → Returns {customers, jobsToBeDone, valueProposition, solution}
- `getEconomicModel()` → Returns {channels, revenue, costs, advantage}
- `getImpactModel()` → Returns 8-field causality chain

**Data Flow:**
```
User Message → Venture Dimensions (filtering) → KB Retrieval (by model/section)
                                                        ↓
User fills canvas ← AI Guidance ← RAG Context (model-specific examples)
        ↓
Canvas Sections (storage) ← Models (grouped view for display)
```

---

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
- `venture_profile` - 7 dimensions with confidence scores (for filtering)
- `canvas_section` - 10 standard sections (content storage)
- `impact_model` - 8-field causality chain (impact section storage)
- `message` - Chat history

**CRUD Methods by Category:**

*Canvas Sections (content):*
- `getAllCanvasSections()`, `getCanvasSection(key)`, `updateCanvasSection(key, content)`

*Models (grouped views):*
- `getCustomerModel()`, `getEconomicModel()`, `getImpactModel()`
- `updateImpactModelField(field, content)` - syncs with impact section

*Venture Properties (filtering):*
- `getVentureProfile()`, `updateVentureProperty(property, value, confidence)`
- `getPropertiesForFiltering()` - for KB queries

**RAG Pipeline:**
1. Parse user intent (methodology vs examples)
2. Get venture properties from profile (for filtering)
3. Determine target model/section from context
4. Query Vectorize with property + model/section filters
5. Build system prompt with retrieved context
6. Call Claude via AI Gateway

### Environment Setup Required

Before implementation, set up:
1. **AI Gateway** in Cloudflare Dashboard (AI → AI Gateway → Create)
2. **Secrets** via wrangler:
   ```bash
   wrangler secret put ANTHROPIC_API_KEY
   wrangler secret put CF_ACCOUNT_ID
   wrangler secret put CF_GATEWAY_ID
   ```

---

Ready to begin implementation. The plan includes acceptance criteria for each task.
