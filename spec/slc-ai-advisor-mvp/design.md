# SLC AI Advisor MVP - Design

## Architecture Overview

A conversational AI advisor for social entrepreneurs deployed on Cloudflare's edge platform. The system provides methodology guidance and contextual example retrieval using the Selection Matrix - multi-dimensional filtering by venture characteristics before semantic search.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Unified Worker (Cloudflare Workers Static Assets)                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Frontend (React + Vite + @cloudflare/vite-plugin)          │   │
│  │  - Chat interface with useAgentChat                          │   │
│  │  - Canvas display (11 sections)                              │   │
│  │  - Impact Model nested in section 11                         │   │
│  │  - Export (copy, Markdown, JSON)                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  API Routes (/api/*)                                         │   │
│  │  - Chat handler with RAG                                     │   │
│  │  - Canvas CRUD                                               │   │
│  │  - Session routing to Durable Objects                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
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

**Architecture Note:** Uses Workers Static Assets (not Pages) per Cloudflare's 2025 recommendation. Frontend and API deploy as a single Worker - no CORS needed.

MVP simplification: Chat-primary interface. Visual canvas editor deferred to post-MVP.

## Components

### Frontend (React + Vite)
- **Purpose:** Provide chat interface and canvas display for users
- **Responsibilities:**
  - Render chat messages with conversation history
  - Display canvas with 11 sections
  - Display Impact Model nested within section 11
  - Handle section editing via chat
  - Copy button + export (Markdown, JSON)
  - Store sessionId in localStorage
- **Interface:** React app using AI SDK v5 `useAgentChat` hook
- **Build:** `@cloudflare/vite-plugin` for unified deployment with Worker
- **Files:** `src/` (React app), `worker/` (API routes)

### API Worker
- **Purpose:** Handle requests and coordinate between LLM, storage, and retrieval
- **Responsibilities:**
  - Route chat messages to Anthropic with RAG context
  - Implement Selection Matrix (filter by dimensions before semantic search)
  - CRUD for canvas sections and Impact Model
  - Rate limiting (100 req/min per session)
  - Error handling with graceful degradation
- **Interface:**
  ```
  POST /api/chat           - Send message, receive AI response
  GET  /api/canvas         - Get current canvas state (includes Impact Model)
  PUT  /api/canvas/:section - Update specific section (1-10)
  PUT  /api/canvas/impact-model - Update Impact Model (syncs section 11)
  GET  /api/session        - Get session metadata
  POST /api/export         - Export canvas (format: md|json)
  POST /api/import         - Import canvas data
  ```

### Durable Object (UserSession)
- **Purpose:** Persist all user state with strong consistency
- **Responsibilities:**
  - Store venture profile (7 dimensions with confidence scores)
  - Store canvas content (10 simple sections + Impact Model)
  - Store conversation history
  - Keep Impact Model's `impact` field synced with section 11
- **Interface:** SQLite database within Durable Object

### Vectorize Index
- **Purpose:** Enable semantic search with dimensional filtering
- **Responsibilities:**
  - Store embeddings for knowledge base
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

### Canvas Structure

The Social Lean Canvas has **11 sections** in curriculum order, organized into **3 conceptual models**.

```typescript
// The 11 canvas sections (curriculum order)
type CanvasSectionId =
  | 'purpose'              // 1 - standalone
  | 'customerSegments'     // 2 - Customer Model
  | 'problem'              // 3 - Customer Model
  | 'uniqueValueProposition' // 4 - Customer Model
  | 'solution'             // 5 - Customer Model
  | 'channels'             // 6 - Economic Model
  | 'revenue'              // 7 - Economic Model
  | 'costStructure'        // 8 - Economic Model
  | 'keyMetrics'           // 9 - standalone
  | 'unfairAdvantage'      // 10 - Economic Model
  | 'impact';              // 11 - Impact Model (contains nested ImpactModel)

// Section numbers for curriculum tracking
const SECTION_NUMBERS: Record<CanvasSectionId, number> = {
  purpose: 1,
  customerSegments: 2,
  problem: 3,
  uniqueValueProposition: 4,
  solution: 5,
  channels: 6,
  revenue: 7,
  costStructure: 8,
  keyMetrics: 9,
  unfairAdvantage: 10,
  impact: 11,
};

// Venture Model groupings (for retrieval/filtering, not storage)
type VentureModel = 'customer' | 'economic' | 'impact';

const SECTION_TO_MODEL: Record<CanvasSectionId, VentureModel | null> = {
  purpose: null,
  customerSegments: 'customer',
  problem: 'customer',
  uniqueValueProposition: 'customer',
  solution: 'customer',
  channels: 'economic',
  revenue: 'economic',
  costStructure: 'economic',
  keyMetrics: null,
  unfairAdvantage: 'economic',
  impact: 'impact',
};
```

### Venture Dimensions

```typescript
// Venture dimensions (7 total) for Selection Matrix filtering
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
```

### Canvas State

```typescript
// A single canvas section (sections 1-10)
interface CanvasSection {
  sectionKey: CanvasSectionId;
  content: string;
  isComplete: boolean;
  updatedAt: string;
}

// Impact Model - causality chain nested within section 11
// The 'impact' field IS section 11's content - they stay in sync
interface ImpactModel {
  issue: string;
  participants: string;
  activities: string;
  outputs: string;
  shortTermOutcomes: string;
  mediumTermOutcomes: string;
  longTermOutcomes: string;
  impact: string;           // Synced with section 11 content
  isComplete: boolean;
  updatedAt: string;
}

// Full canvas state returned by API
interface CanvasState {
  sessionId: string;
  sections: CanvasSection[];  // Sections 1-10 (simple content)
  impactModel: ImpactModel;   // Section 11 (nested causality chain)
  currentSection: number | null;  // User's curriculum progress (1-11)
  createdAt: string;
  updatedAt: string;
}
```

**Key design decision:** Sections 1-10 store simple string content. Section 11 (Impact) contains the full ImpactModel structure. The ImpactModel's `impact` field is the summary that appears as section 11's "content" when viewing the canvas linearly.

### Conversation State

```typescript
interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
```

### SQLite Schema

```sql
-- Session metadata
CREATE TABLE session (
  id TEXT PRIMARY KEY,
  current_section INTEGER,      -- Curriculum progress (1-11)
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
  confidence_json TEXT,         -- JSON object {dimension: number}
  confirmed_json TEXT,          -- JSON object {dimension: boolean}
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Canvas sections (sections 1-10 only; section 11 is in impact_model table)
CREATE TABLE canvas_section (
  session_id TEXT NOT NULL,
  section_key TEXT NOT NULL,    -- One of 10 CanvasSectionIds (not 'impact')
  content TEXT NOT NULL DEFAULT '',
  is_complete INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (session_id, section_key)
);

-- Impact Model (section 11 - full causality chain)
-- The 'impact' column mirrors what would be section 11's content
CREATE TABLE impact_model (
  session_id TEXT PRIMARY KEY,
  issue TEXT NOT NULL DEFAULT '',
  participants TEXT NOT NULL DEFAULT '',
  activities TEXT NOT NULL DEFAULT '',
  outputs TEXT NOT NULL DEFAULT '',
  short_term_outcomes TEXT NOT NULL DEFAULT '',
  medium_term_outcomes TEXT NOT NULL DEFAULT '',
  long_term_outcomes TEXT NOT NULL DEFAULT '',
  impact TEXT NOT NULL DEFAULT '',  -- This IS section 11's content
  is_complete INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

-- Chat messages
CREATE TABLE message (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,           -- 'user' | 'assistant'
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
  
  // Filter by content type
  if (intent.type === 'examples') {
    filters.content_type = { $eq: 'canvas-example' };
  }
  
  // Filter by venture stage
  if (profile.dimensions.ventureStage) {
    filters.venture_stage = { $eq: profile.dimensions.ventureStage };
  }
  
  // Filter by canvas section (1-11)
  if (intent.targetSection) {
    filters.canvas_section = { $eq: intent.targetSection };
  }
  
  // Filter by venture model (customer, economic, impact)
  if (intent.targetModel) {
    filters.venture_model = { $eq: intent.targetModel };
  }
  
  // Filter by impact areas
  if (profile.dimensions.impactAreas.length > 0) {
    filters.primary_impact_area = { $in: profile.dimensions.impactAreas };
  }
  
  // Filter by industries
  if (profile.dimensions.industries.length > 0) {
    filters.primary_industry = { $in: profile.dimensions.industries };
  }
  
  return filters;
}

// Progressive relaxation: strict → remove industry → remove impact area → pure semantic
```

### Frontend ↔ API Communication

- No CORS needed (same origin with Workers Static Assets)
- Session ID via localStorage, passed in requests
- WebSocket for chat (via Agents SDK), REST for canvas CRUD

### Impact Model Sync

When updating section 11 or the Impact Model:

```typescript
// Update via section 11
async updateImpactSection(sessionId: string, content: string): Promise<void> {
  // Updates impact_model.impact column
  // Keeps Impact Model's final field in sync
}

// Update via Impact Model
async updateImpactModel(sessionId: string, field: string, content: string): Promise<void> {
  // Updates specific field
  // If field === 'impact', this IS section 11's content
}
```

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
  - Cloudflare Workers (with Static Assets)
  - Cloudflare Durable Objects
  - Cloudflare Vectorize
  - Cloudflare AI Gateway

### Internal
- **Existing components:**
  - Knowledge base (markdown files in `knowledge/`)
  - 138-tag taxonomy (7 dimensions)
  - Venture examples with YAML frontmatter

## Alternatives Considered

| Decision | Chosen | Alternative | Why Chosen |
|----------|--------|-------------|------------|
| State storage | Durable Object + SQLite | D1 | Single DO per user is simpler, strong consistency |
| Selection Matrix | Vectorize metadata filtering | Custom scoring | Native Cloudflare, no extra infrastructure |
| Dimension inference | LLM with confidence thresholds | Explicit form | More natural conversation, less friction |
| Impact Model storage | Separate table, synced with section 11 | Inline JSON in section | Cleaner querying, explicit causality chain |
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
| Impact Model sync bugs | Single source of truth in DB, sync on read/write |

---

*Source: spec/slc-ai-advisor-mvp/requirements.md, tmp/section-issues.md*
