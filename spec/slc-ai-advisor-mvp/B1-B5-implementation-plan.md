# Issue #11: B1-B5 Backend Implementation Plan

## Overview

This plan covers the Demo-critical backend tasks (B1-B5) for the SLC AI Advisor. These tasks establish the API layer that connects the knowledge base with the frontend.

**Branch:** `claude/issue-11-implementation-iBnMY` (based on `feature/backend`)

**Goal:** Working chat API with RAG retrieval, session persistence, and basic dimension filtering.

---

## Current State Assessment

### Already Complete (B1)
- Worker project initialized (`worker/index.ts`)
- `wrangler.toml` configured with bindings:
  - Vectorize: `slc-knowledge-base` (1024 dimensions)
  - Durable Objects: `UserSession` class
  - Workers AI: `AI` binding
- Type definitions: `canvas.ts`, `venture.ts`, `message.ts`
- Basic health endpoint at `/api/health`
- Dependencies installed: `@anthropic-ai/sdk`, `agents`

### Missing (B2-B5)
- UserSession Durable Object implementation
- SQLite schema
- Session management endpoints
- Vectorize query logic
- Chat handler with RAG

---

## Implementation Tasks

### B2: Durable Object with SQLite Schema

**File:** `worker/durable-objects/UserSession.ts`

**SQLite Tables:**
```sql
-- Session metadata
CREATE TABLE session (
  id TEXT PRIMARY KEY,
  program TEXT NOT NULL DEFAULT 'generic',
  current_section TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Venture profile (7 dimensions)
CREATE TABLE venture_profile (
  session_id TEXT PRIMARY KEY,
  venture_stage TEXT,
  impact_areas TEXT,            -- JSON array
  impact_mechanisms TEXT,       -- JSON array
  legal_structure TEXT,
  revenue_sources TEXT,         -- JSON array
  funding_sources TEXT,         -- JSON array
  industries TEXT,              -- JSON array
  confidence_json TEXT,         -- JSON object
  confirmed_json TEXT,          -- JSON object
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Canvas sections (all except impact)
CREATE TABLE canvas_section (
  session_id TEXT NOT NULL,
  section_key TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  is_complete INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (session_id, section_key)
);

-- Impact Model (8-field causality chain)
CREATE TABLE impact_model (
  session_id TEXT PRIMARY KEY,
  issue TEXT NOT NULL DEFAULT '',
  participants TEXT NOT NULL DEFAULT '',
  activities TEXT NOT NULL DEFAULT '',
  outputs TEXT NOT NULL DEFAULT '',
  short_term_outcomes TEXT NOT NULL DEFAULT '',
  medium_term_outcomes TEXT NOT NULL DEFAULT '',
  long_term_outcomes TEXT NOT NULL DEFAULT '',
  impact TEXT NOT NULL DEFAULT '',
  is_complete INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

-- Chat messages
CREATE TABLE message (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL
);

CREATE INDEX idx_message_session ON message(session_id, timestamp);
```

**Conceptual Architecture:**

The system has three distinct concepts that must be kept separate:

1. **Canvas Sections** (11 total) - The actual content users fill in
   - 10 standard sections stored in `canvas_section` table
   - 1 impact section stored in `impact_model` table (with 8 fields)

2. **Models** (3 total) - Conceptual groupings for retrieval and display
   - Customer Model = {customers, jobsToBeDone, valueProposition, solution}
   - Economic Model = {channels, revenue, costs, advantage}
   - Impact Model = {impact} (nested 8-field causality chain)
   - Models are **views** over sections, not separate storage

3. **Venture Dimensions** (7 total) - Properties for Selection Matrix filtering
   - Used to filter KB content, not to store canvas data
   - Inferred from conversation or explicitly set

**CRUD Methods - Session:**
- `initSession(id: string, program: string)` - Create session with empty canvas
- `getSession()` - Get session metadata (program, currentSection, timestamps)

**CRUD Methods - Venture Properties (for Selection Matrix):**
- `getVentureProfile()` - Get all 7 properties with confidence scores
- `updateVentureProperty(property, value, confidence)` - Update single property
- `getPropertiesForFiltering()` - Get confirmed/high-confidence properties for KB queries

**CRUD Methods - Canvas Sections (individual content):**
- `getAllCanvasSections()` - Get all 11 sections (10 standard + impact summary)
- `getCanvasSection(key)` - Get single section by key
- `updateCanvasSection(key, content)` - Update standard section (routes 'impact' to impact_model.impact)
- `markSectionComplete(key, isComplete)` - Toggle completion status

**CRUD Methods - Models (grouped views):**
- `getCustomerModel()` - Returns {customers, jobsToBeDone, valueProposition, solution} sections
- `getEconomicModel()` - Returns {channels, revenue, costs, advantage} sections
- `getImpactModel()` - Returns full 8-field causality chain
- `updateImpactModelField(field, content)` - Update specific impact field (syncs 'impact' field with impact section)

**CRUD Methods - Messages:**
- `addMessage(role, content)` - Add chat message
- `getRecentMessages(limit)` - Get last N messages

**Data Flow:**
```
User Message → Venture Dimensions (filtering) → KB Retrieval (by model/section)
                                                        ↓
User fills canvas ← AI Guidance ← RAG Context (model-specific examples)
        ↓
Canvas Sections (storage) ← Models (grouped view for display)
```

**Acceptance Criteria:**
- [ ] DO class extends `DurableObject<Env>`
- [ ] Schema created on first request
- [ ] All CRUD methods work with parameterized queries
- [ ] Models return grouped sections (views, not copies)
- [ ] Impact section syncs with `impact_model.impact` field
- [ ] Venture dimensions separate from canvas content

---

### B3: Session Management Endpoints

**File:** `worker/routes/session.ts`

**Endpoints:**
```
POST /api/session         - Create new session
GET  /api/session/:id     - Get session state
```

**Session Creation Flow:**
1. Generate `sessionId = crypto.randomUUID()`
2. Get Durable Object stub: `env.USER_SESSION.idFromName(sessionId)`
3. Initialize session with default program ('generic')
4. Return session metadata

**Routing Pattern:**
```typescript
// worker/index.ts
if (url.pathname === '/api/session' && request.method === 'POST') {
  const sessionId = crypto.randomUUID();
  const stub = env.USER_SESSION.get(
    env.USER_SESSION.idFromName(sessionId)
  );
  await stub.fetch(new Request('http://internal/init', {
    method: 'POST',
    body: JSON.stringify({ sessionId, program: 'generic' })
  }));
  return jsonResponse({ sessionId, program: 'generic' });
}
```

**Acceptance Criteria:**
- [ ] POST /api/session creates new session, returns sessionId
- [ ] GET /api/session/:id returns session state from DO
- [ ] Session ID stored in localStorage by frontend
- [ ] Invalid session ID returns 404

---

### B4: Basic Vectorize Filtering (Demo Scope)

**File:** `worker/retrieval/vector-search.ts`

**How Models and Sections Guide Retrieval:**

The Selection Matrix uses venture dimensions AND model/section context:
- **Venture Dimensions** (from profile) → Filter by stage, impact area, industry
- **Target Model** (from query intent) → Filter examples by model grouping
- **Target Section** (from query intent) → Filter methodology by section

Example: User working on "revenue" section with "early-stage healthcare" venture:
1. Dimension filter: `venture_stage=early`, `impact_area=health`
2. Model filter: `venture_model=economic` (revenue belongs to Economic Model)
3. Section filter: `canvas_section=revenue`
4. Semantic search within filtered results

**Demo Filtering Strategy (3 stages):**
1. **Program Filter** (namespace) - Strict filter on user's program
2. **Model/Section Filter** (metadata) - Filter by conceptual grouping OR specific section
3. **Semantic Search** - Natural language similarity within filtered results

**Filter Building:**
```typescript
interface QueryIntent {
  type: 'methodology' | 'examples' | 'general';
  targetSection?: CanvasSectionId;  // Specific section user is working on
  targetModel?: Model;               // Conceptual grouping for broader context
}

function buildVectorizeQuery(
  program: string,
  properties: VentureProperties,  // From venture profile
  intent: QueryIntent
): VectorizeQueryOptions {
  const filter: Record<string, any> = {};

  // Content type filter
  if (intent.type === 'examples') {
    filter.content_type = 'canvas-example';
  } else if (intent.type === 'methodology') {
    filter.content_type = 'methodology';
  }

  // Section-specific filter (most specific)
  if (intent.targetSection) {
    filter.canvas_section = intent.targetSection;
  }
  // Model grouping filter (broader context)
  else if (intent.targetModel) {
    filter.venture_model = intent.targetModel;
  }

  // Venture property filters (from profile, not canvas content)
  if (properties.ventureStage) {
    filter.venture_stage = properties.ventureStage;
  }
  // Range query for tags field
  if (properties.industries && properties.industries.length > 0) {
    filter.tags = { $gte: properties.industries[0], $lte: properties.industries[0] + '\uffff' };
  }

  return {
    topK: 5,
    returnMetadata: 'all',
    namespace: program,
    filter
  };
}
```

**Search Function:**
```typescript
async function searchKnowledgeBase(
  env: Env,
  query: string,
  program: string,
  intent: QueryIntent
): Promise<VectorizeMatch[]> {
  // Generate embedding
  const embeddingResult = await env.AI.run('@cf/baai/bge-m3', {
    text: query
  });

  // Query Vectorize with filters
  const options = buildVectorizeQuery(program, intent);
  const results = await env.VECTORIZE.query(embeddingResult.data, options);

  return results.matches;
}
```

**Acceptance Criteria:**
- [ ] Embedding generation works with Workers AI
- [ ] Vectorize query executes with namespace filter
- [ ] Metadata filters applied (content_type, canvas_section)
- [ ] Returns relevant documents for RAG context

---

### B5: Chat Handler with RAG

**File:** `worker/routes/chat.ts`

**Endpoint:**
```
POST /api/chat
Body: { sessionId: string, message: string }
Response: { response: string, sources?: string[] }
```

**RAG Pipeline:**
1. Get session from Durable Object
2. Parse user intent (methodology vs examples)
3. Query Vectorize with Selection Matrix filters
4. Build system prompt with retrieved context
5. Call Claude via AI Gateway
6. Store messages in session
7. Return response

**AI Gateway Integration:**
```typescript
import Anthropic from '@anthropic-ai/sdk';

async function callClaude(
  env: Env,
  systemPrompt: string,
  messages: ConversationMessage[]
): Promise<string> {
  const client = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    baseURL: `https://gateway.ai.cloudflare.com/v1/${env.CF_ACCOUNT_ID}/${env.CF_GATEWAY_ID}/anthropic`
  });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content
    }))
  });

  return response.content[0].type === 'text'
    ? response.content[0].text
    : '';
}
```

**System Prompt Template:**
```typescript
function buildSystemPrompt(context: string): string {
  return `You are an AI advisor for social entrepreneurs using the Social Lean Canvas methodology.

The Social Lean Canvas has 11 sections organized into 3 models:
- Customer Model: customers, jobsToBeDone, valueProposition, solution
- Economic Model: channels, revenue, costs, advantage
- Impact Model: impact (with 8-field causality chain)

Provide clear, actionable guidance. When sharing examples, explain how they apply to the user's situation.

KNOWLEDGE BASE CONTEXT:
${context}

Use this context to inform your responses. If the context is relevant, reference it. If not, rely on general methodology knowledge.`;
}
```

**Acceptance Criteria:**
- [ ] POST /api/chat accepts message, returns AI response
- [ ] RAG context retrieved from Vectorize
- [ ] Claude called via AI Gateway
- [ ] Messages stored in session
- [ ] Error handling for API failures

---

## File Structure After Implementation

```
worker/
├── index.ts                    # Router, exports UserSession
├── env.d.ts                    # Env type extensions
├── durable-objects/
│   └── UserSession.ts          # Durable Object with SQLite
├── routes/
│   ├── session.ts              # Session endpoints (B3)
│   └── chat.ts                 # Chat endpoint (B5)
├── retrieval/
│   └── vector-search.ts        # Vectorize queries (B4)
└── llm/
    └── prompts.ts              # System prompts for Claude
```

---

## Environment Variables Required

Set via `wrangler secret put`:
- `ANTHROPIC_API_KEY` - Anthropic API key
- `CF_ACCOUNT_ID` - Cloudflare account ID (for AI Gateway)
- `CF_GATEWAY_ID` - AI Gateway ID (e.g., "slc-advisor")

---

## Testing Strategy

### Local Development
```bash
npm run dev  # Starts wrangler dev server
```

### Manual Testing
1. Create session: `POST /api/session`
2. Send message: `POST /api/chat { sessionId, message: "What is a value proposition?" }`
3. Verify response includes methodology guidance
4. Check session persists: `GET /api/session/:id`

### Integration Points
- B4 requires A6 (indexed knowledge base) for real results
- Until A6 complete, B4 can be tested with mock data or empty index
- B5 requires AI Gateway setup in Cloudflare Dashboard

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Vectorize index not created | Add setup check, return error if missing |
| AI Gateway not configured | Clear error message, fallback to direct API |
| KB not indexed (A6 pending) | Chat works without RAG, methodology-only mode |
| Rate limits on Claude | AI Gateway provides monitoring, add backoff |

---

## Estimated Complexity

| Task | Size | Dependencies |
|------|------|--------------|
| B2: DO + SQLite | Large (2+ hrs) | B1 ✅ |
| B3: Session mgmt | Medium (1-2 hrs) | B2 |
| B4: Vectorize | Medium (1-2 hrs) | B3, (A6 for real data) |
| B5: Chat + RAG | Large (2+ hrs) | B4 |

**Total:** ~6-8 hours of implementation

---

## Next Steps After B5

After Demo milestone (B1-B5), MVP tasks include:
- B6: Dimension inference from conversation
- B7: Canvas CRUD endpoints
- B8: Export endpoint
- B9: Rate limiting
- B10: Error handling

---

*Plan created: 2025-12-23*
*Issue: https://github.com/rathermercurial/slc-ai-advisor/issues/11*
