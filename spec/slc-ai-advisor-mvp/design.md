# SLC AI Advisor MVP - Design

## Architecture Overview

A conversational AI advisor for social entrepreneurs deployed on Cloudflare's edge platform. The system provides methodology guidance and contextual example retrieval using the Selection Matrix - multi-dimensional filtering by venture characteristics before semantic search.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Frontend (Cloudflare Pages)                                        │
│  - Chat interface with useAgentChat                                 │
│  - Canvas display with nested Impact Model                          │
│  - Export (copy, Markdown, JSON)                                    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  API Worker (Cloudflare Workers + Agents SDK v0.2.24+)              │
│  - Chat handler with RAG                                            │
│  - Canvas CRUD                                                      │
│  - Session routing to Durable Objects                               │
└─────────────────────────────────────────────────────────────────────┘
                                  │
           ┌──────────────────────┼──────────────────────┐
           ▼                      ▼                      ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  Anthropic API  │   │ Durable Object  │   │   Vectorize     │
│  (via AI        │   │ (UserSession    │   │   (Knowledge    │
│   Gateway)      │   │  + SQLite)      │   │    Base Index)  │
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

MVP simplification: Chat-primary interface. Visual canvas editor deferred to post-MVP.

## Components

### Frontend (Cloudflare Pages)
- **Purpose:** Provide chat interface and canvas display for users
- **Responsibilities:**
  - Render chat messages with conversation history
  - Display canvas with 11 sections + nested Impact Model
  - Handle section editing via chat
  - Copy button + export (Markdown, JSON)
  - Store sessionId in localStorage
- **Interface:** React app using AI SDK v5 `useAgentChat` hook

### API Worker
- **Purpose:** Handle requests and coordinate between LLM, storage, and retrieval
- **Responsibilities:**
  - Route chat messages to Anthropic with RAG context
  - Implement Selection Matrix (filter by dimensions before semantic search)
  - CRUD for canvas sections
  - Rate limiting (100 req/min per session)
  - Error handling with graceful degradation
- **Interface:**
  ```
  POST /api/chat           - Send message, receive AI response
  GET  /api/canvas         - Get current canvas state
  PUT  /api/canvas/:section - Update specific section
  GET  /api/session        - Get session metadata
  POST /api/export         - Export canvas (format: md|json)
  POST /api/import         - Import canvas data
  ```

### Durable Object (UserSession)
- **Purpose:** Persist all user state with strong consistency
- **Responsibilities:**
  - Store venture profile (7 dimensions with confidence scores)
  - Store canvas content (11 sections + Impact Model)
  - Store conversation history
- **Interface:** SQLite database within Durable Object

### Vectorize Index
- **Purpose:** Enable semantic search with dimensional filtering
- **Responsibilities:**
  - Store embeddings for knowledge base (362 files)
  - Support metadata filtering by venture dimensions
  - Return relevant documents for RAG
- **Interface:** Vectorize query API with metadata filters

### Knowledge Base Processor
- **Purpose:** Index knowledge base at build time
- **Responsibilities:**
  - Parse markdown files with gray-matter
  - Extract YAML frontmatter tags
  - Chunk content (500-800 tokens)
  - Generate embeddings via Workers AI
  - Upload to Vectorize
- **Interface:** CLI script, runs during deployment

## Data Models

```typescript
// Venture dimensions (7 total)
interface VentureDimensions {
  ventureStage: string | null;      // idea | early | growth | scale
  impactAreas: string[];            // 34 tags (SDG + IRIS+)
  impactMechanisms: string[];       // 10 tags
  legalStructure: string | null;    // 11 tags
  revenueSources: string[];         // 11 tags
  fundingSources: string[];         // 7 tags
  industries: string[];             // 17 tags
}

// Venture profile with inference tracking
interface VentureProfile {
  sessionId: string;
  dimensions: VentureDimensions;
  confidence: Partial<Record<keyof VentureDimensions, number>>;
  confirmed: Partial<Record<keyof VentureDimensions, boolean>>;
  createdAt: string;
  updatedAt: string;
}

// Canvas state (11 sections + Impact Model)
interface CanvasState {
  sessionId: string;
  sections: {
    purpose: CanvasSection;
    customers: CanvasSection;
    earlyAdopters: CanvasSection;
    jobsToBeDone: CanvasSection;
    existingAlternatives: CanvasSection;
    uniqueValueProposition: CanvasSection;
    solution: CanvasSection;
    channels: CanvasSection;
    revenue: CanvasSection;
    costs: CanvasSection;
    advantage: CanvasSection;
    keyMetrics: CanvasSection;
  };
  impactModel: ImpactModel;
  createdAt: string;
  updatedAt: string;
}

interface CanvasSection {
  content: string;
  isComplete: boolean;
  lastEditedAt: string;
}

// Impact Model - full causality chain
interface ImpactModel {
  issue: string;
  participants: string;
  activities: string;
  outputs: string;
  shortTermOutcomes: string;
  mediumTermOutcomes: string;
  longTermOutcomes: string;
  impact: string;
  isComplete: boolean;
  lastEditedAt: string;
}

// Conversation state
interface ConversationState {
  sessionId: string;
  messages: ConversationMessage[];
  conversationSummary: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
```

### SQLite Schema

```sql
CREATE TABLE session (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE venture_profile (
  session_id TEXT PRIMARY KEY,
  venture_stage TEXT,
  impact_areas TEXT,
  impact_mechanisms TEXT,
  legal_structure TEXT,
  revenue_sources TEXT,
  funding_sources TEXT,
  industries TEXT,
  confidence_json TEXT,
  confirmed_json TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE canvas_section (
  session_id TEXT NOT NULL,
  section_key TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  is_complete INTEGER NOT NULL DEFAULT 0,
  last_edited_at TEXT NOT NULL,
  PRIMARY KEY (session_id, section_key)
);

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
  last_edited_at TEXT NOT NULL
);

CREATE TABLE message (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL
);

CREATE INDEX idx_message_session ON message(session_id, timestamp);
```

## Interfaces

### Selection Matrix (Core Algorithm)

Components communicate through the Selection Matrix flow:

1. **Chat Handler → Dimension Inference:** Extract venture dimensions from conversation with confidence scores (threshold: 0.7)
2. **Chat Handler → Filter Builder:** Build Vectorize metadata filter from venture profile
3. **Filter Builder → Vectorize:** Query with filter, progressive relaxation if insufficient results
4. **Vectorize → Chat Handler:** Return relevant documents ranked by dimensional similarity
5. **Chat Handler → LLM:** Generate response with RAG context

```typescript
// Filter building
function buildVectorizeFilter(profile: VentureProfile, intent: QueryIntent): object {
  const filters: any = {};
  if (intent.type === 'examples') filters.content_type = { $eq: 'canvas-example' };
  if (profile.dimensions.ventureStage) filters.venture_stage = { $eq: profile.dimensions.ventureStage };
  if (intent.targetSection) filters.canvas_section = { $eq: intent.targetSection };
  if (profile.dimensions.impactAreas.length > 0) filters.primary_impact_area = { $in: profile.dimensions.impactAreas };
  if (profile.dimensions.industries.length > 0) filters.primary_industry = { $in: profile.dimensions.industries };
  return filters;
}

// Progressive relaxation: strict → remove industry → remove impact area → pure semantic
```

### Frontend ↔ API Communication

- CORS headers required for Pages/Worker separation
- Session ID via localStorage, passed in requests
- WebSocket for chat (via Agents SDK), REST for canvas CRUD

## Dependencies

### External
- **Libraries:**
  - `@cloudflare/agents` ^0.2.24 (Agents SDK)
  - `ai` ^5.0.0 (AI SDK)
  - `workers-ai-provider` ^2.0.0
  - `@anthropic-ai/sdk` ^0.30.0
  - `gray-matter` ^4.0.3 (frontmatter parsing)
  - `zod` ^3.23.0 (optional, LLM response validation)
- **APIs:**
  - Anthropic Claude API (via AI Gateway)
  - Workers AI (embeddings: @cf/baai/bge-base-en-v1.5)
- **Services:**
  - Cloudflare Workers
  - Cloudflare Pages
  - Cloudflare Durable Objects
  - Cloudflare Vectorize
  - Cloudflare AI Gateway

### Internal
- **Existing components:**
  - Knowledge base (362 markdown files in `knowledge/`)
  - 138-tag taxonomy (7 dimensions)
  - 16 venture examples with YAML frontmatter

## Alternatives Considered

| Decision | Chosen | Alternative | Why Chosen |
|----------|--------|-------------|------------|
| State storage | Durable Object + SQLite | D1 | Single DO per user is simpler, strong consistency |
| Selection Matrix | Vectorize metadata filtering | Custom scoring | Native Cloudflare, no extra infrastructure |
| Dimension inference | LLM with confidence thresholds | Explicit form | More natural conversation, less friction |
| Impact Model | Separate linked document | Inline field | Matches existing examples, preserves full causality chain |
| MVP UI | Chat-primary | Full visual editor | Faster path to demo, visual editor post-MVP |
| PDF export | Deferred | Client-side jsPDF | Complexity not worth it for demo; Markdown sufficient |

## Risks

| Risk | Mitigation |
|------|------------|
| Vectorize metadata limit (10 properties) | Prioritize most useful dimensions for filtering |
| LLM dimension inference accuracy | Confidence thresholds (0.7+), user correction via chat |
| Knowledge base gaps | Progressive filter relaxation, methodology fallback |
| Amateur coder maintenance | Clear file separation, simple patterns, comments |
| LLM API failures | AI Gateway monitoring, graceful degradation messages |
| Rate abuse on demo | Rate limiting (100 req/min per session) |
| CORS issues | Standard CORS headers on API Worker |

---

*Source: spec/slc-ai-advisor-mvp/requirements.md, tmp/design-suggestions.md*
