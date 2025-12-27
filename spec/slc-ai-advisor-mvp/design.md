# SLC AI Advisor MVP - Design

## Architecture Overview

A conversational AI advisor using two-component separation:
- **SLCAgent** - AI orchestrator for conversation and tool execution
- **CanvasDO** - Goal artifact with Model Manager classes

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Worker (Stateless Entry Point)                    │
│  Serves UI (Static Assets), routes /api/* to Agent/DO                  │
└───────────────────────────────────────┬─────────────────────────────────┘
                                        │
              ┌─────────────────────────┴─────────────────────────┐
              ▼                                                   ▼
┌──────────────────────────────┐                ┌─────────────────────────────────────┐
│  SLCAgent (Orchestrator)     │                │     CanvasDO (Goal Artifact)        │
│  extends AIChatAgent         │                │     extends DurableObject           │
│                              │                │                                     │
│  Agent's Own State:          │   Tool calls   │  Cross-cutting:                     │
│  ├── conversation (this.sql) │───────────────▶│  ├── purpose, keyMetrics            │
│  ├── message (this.sql)      │                │  └── ventureProfile (7-dim)         │
│  ├── status, preferences     │                │                                     │
│  └── currentCanvasId         │                │  Model Managers:                    │
│                              │                │  ├── CustomerModelManager           │
│  Capabilities:               │                │  ├── EconomicModelManager           │
│  ├── onChatMessage()         │                │  └── ImpactModelManager             │
│  ├── setState() → UI sync    │                │                                     │
│  └── Tool definitions        │◀───────────────│  Each: validate, complete, export   │
└──────────────────────────────┘                └─────────────────────────────────────┘
              │
              ▼
    ┌──────────────────┐
    │    Vectorize     │
    │   (Public KB)    │
    └──────────────────┘
```

MVP simplification: Chat-primary interface. Visual canvas editor deferred to post-MVP.

## Components

### Worker (Stateless Entry Point)
- **Purpose:** Route requests, serve UI, handle auth
- **Responsibilities:**
  - Serve React frontend via Static Assets
  - Route /api/* to SLCAgent or CanvasDO
  - Handle MCP server requests (future)
- **Files:** `worker/index.ts`

### Frontend (React + Vite)
- **Purpose:** Provide chat interface and canvas display for users
- **Responsibilities:**
  - Render chat messages with conversation history
  - Display canvas with 11 sections
  - Display Impact Model nested within impact section
  - Handle section editing via chat
  - Copy button + export (Markdown, JSON)
  - Store canvasId in localStorage
- **Interface:** React app using Agents SDK `useAgentChat` hook
- **Build:** `@cloudflare/vite-plugin` for unified deployment with Worker
- **Files:** `src/` (React app)

### SLCAgent (extends AIChatAgent)
- **Purpose:** AI orchestrator for conversation and tool execution
- **Responsibilities:**
  - Handle streaming chat via `onChatMessage()`
  - Execute tools that modify CanvasDO
  - Update status via `setState()` (syncs to frontend)
  - Store conversation history in own `this.sql`
- **State:** conversation, message tables (agent's own DB)
- **Files:** `worker/agents/SLCAgent.ts`

### CanvasDO (extends DurableObject)
- **Purpose:** Goal artifact - the canvas being built
- **Responsibilities:**
  - Store canvas sections via Model Managers
  - Store venture profile (7 dimensions)
  - Validate updates via Model Manager rules
  - Export canvas in multiple formats
- **Files:** `worker/durable-objects/CanvasDO.ts`, `src/models/*.ts`

### Model Managers

Model Managers encapsulate business logic for each of the three models, providing clean interfaces that work for MVP (single DO) or future child-DO architecture.

#### Interface

```typescript
interface IModelManager {
  getModel(): Promise<ModelData>;
  updateSection(section: string, content: string): Promise<UpdateResult>;
  validate(): Promise<ValidationResult>;
  getCompletion(): Promise<ModelCompletion>;
  export(format: 'json' | 'md'): Promise<string>;
}
```

#### Managers

| Manager | Sections | Notes |
|---------|----------|-------|
| CustomerModelManager | customers, jobsToBeDone, valueProposition, solution | Dependency chain validation |
| EconomicModelManager | channels, revenue, costs, advantage | Business sustainability |
| ImpactModelManager | 8-field causality chain | Must complete in order |

See `tmp/backend-suggestions.md` section 3.5 for implementation details.

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

## Knowledge Base Architecture

The knowledge base is organized into two main directories that map to different Vectorize capabilities:

### Programs (Vectorize Namespaces)

Programs define learning journeys. Each program maps to a Vectorize **namespace** for strict pre-filtering. Users select a program when starting a session.

```
knowledge/programs/
├── default/          # General knowledge (namespace: "default")
├── generic/          # Base SLC learning program (namespace: "generic")
└── p2p/              # Peer-to-peer ventures (namespace: "p2p", future)
```

The Selection Matrix applies program filtering first, before any dimensional filtering.

### Tags (Vectorize Metadata)

Tags define concepts and venture characteristics. They map to Vectorize **metadata indexes** for dimensional filtering.

```
knowledge/tags/
├── canvas/           # Canvas section concepts
│   ├── purpose.md
│   ├── customers.md
│   ├── jobsToBeDone.md
│   └── ...
├── model/            # Model grouping concepts
│   ├── customer.md
│   ├── economic.md
│   └── impact.md
└── venture/          # Venture classification dimensions
    ├── stage/        # Hierarchical: idea → early → growth → scale
    ├── impact-area/  # SDG + IRIS+ themes
    ├── industry/     # Sector classification
    └── ...
```

Tags have two relationship types:
- **Hierarchies** (nested folders): Strict categorical relationships used for filtering
- **Heterarchies** (aliases in frontmatter): Fuzzy/semantic cross-references for discovery

### Selection Matrix Flow

1. **Program Filter** (namespace) - Strict filter based on user's selected program
2. **Dimension Filter** (tags) - Venture stage, impact area, industry, etc.
3. **Semantic Search** - Natural language similarity within filtered results

This three-stage flow ensures dimensionally-relevant results before semantic ranking.

## Data Models

### Canvas Structure

The Social Lean Canvas has **11 sections**, mostly organized into **3 conceptual models**.

```typescript
// The 11 canvas sections
type CanvasSectionId =
  | 'purpose'           // standalone (foundational)
  | 'customers'         // Customer Model
  | 'jobsToBeDone'      // Customer Model
  | 'valueProposition'  // Customer Model
  | 'solution'          // Customer Model
  | 'channels'          // Economic Model
  | 'revenue'           // Economic Model
  | 'costs'             // Economic Model
  | 'advantage'         // Economic Model
  | 'keyMetrics'        // standalone
  | 'impact';           // Impact Model (nested causality chain)

// Model groupings 
type Model = 'customer' | 'economic' | 'impact';

const SECTION_TO_MODEL: Record<CanvasSectionId, Model | null> = {
  purpose: null,
  customers: 'customer',
  jobsToBeDone: 'customer',
  valueProposition: 'customer',
  solution: 'customer',
  channels: 'economic',
  revenue: 'economic',
  costs: 'economic',
  keyMetrics: null,
  advantage: 'economic',
  impact: 'impact',
};
```

### Venture Properties

```typescript
// Venture properties for Selection Matrix filtering
// Note: Only ventureStage is a "dimension" (pre-defined, mutually exclusive values)
// All others are "properties" (open-ended, descriptive tags)
interface VentureProperties {
  ventureStage: string | null;      // idea-stage | early-stage | growth-stage | scale-stage
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
  properties: VentureProperties;
  confidence: Partial<Record<keyof VentureProperties, number>>;
  confirmed: Partial<Record<keyof VentureProperties, boolean>>;
  createdAt: string;
  updatedAt: string;
}
```

### Canvas State

```typescript
// A single canvas section
// Note: The impact section is stored in impact_model table, not canvas_section.
// Code that writes to DB should route 'impact' to the impact_model table.
interface CanvasSection {
  sessionId: string;
  sectionKey: CanvasSectionId;
  content: string;
  isComplete: boolean;
  updatedAt: string;
}

// Impact Model - causality chain nested within the impact section
// The 'impact' field IS the impact section's content - they stay in sync
interface ImpactModel {
  sessionId: string;
  issue: string;
  participants: string;
  activities: string;
  outputs: string;
  shortTermOutcomes: string;
  mediumTermOutcomes: string;
  longTermOutcomes: string;
  impact: string;           // Synced with impact section content
  isComplete: boolean;
  updatedAt: string;
}

// Full canvas state returned by API
interface CanvasState {
  sessionId: string;
  sections: CanvasSection[];  // All sections except impact (simple content)
  impactModel: ImpactModel;   // Impact section (nested causality chain)
  currentSection: CanvasSectionId | null;  // User's curriculum progress
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
}
```

**Storage:** Standard sections are stored in `canvas_section` table. The impact section is stored in `impact_model` table. The `impact` field in ImpactModel IS the impact section's content.

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

Two separate databases in the two-component architecture:

#### Agent's Database (SLCAgent's `this.sql`)

```sql
-- Conversations for this agent
CREATE TABLE conversation (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  title TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Messages within conversations
CREATE TABLE message (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,           -- 'user' | 'assistant'
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL
);

CREATE INDEX idx_message_conv ON message(conversation_id, timestamp);
```

#### Canvas Database (CanvasDO's `ctx.storage.sql`)

```sql
-- Canvas metadata
CREATE TABLE canvas (
  id TEXT PRIMARY KEY,
  current_section TEXT,         -- Curriculum progress (section key)
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Venture profile (7 dimensions)
CREATE TABLE venture_profile (
  canvas_id TEXT PRIMARY KEY,
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

-- Canvas sections (all sections except impact)
-- Impact is stored in impact_model table
CREATE TABLE canvas_section (
  canvas_id TEXT NOT NULL,
  section_key TEXT NOT NULL,    -- One of: purpose, customers, jobsToBeDone, etc. (NOT 'impact')
  content TEXT NOT NULL DEFAULT '',
  is_complete INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (canvas_id, section_key)
);

-- Impact Model (impact section - full causality chain)
-- The 'impact' column IS the impact section's content
CREATE TABLE impact_model (
  canvas_id TEXT PRIMARY KEY,
  issue TEXT NOT NULL DEFAULT '',
  participants TEXT NOT NULL DEFAULT '',
  activities TEXT NOT NULL DEFAULT '',
  outputs TEXT NOT NULL DEFAULT '',
  short_term_outcomes TEXT NOT NULL DEFAULT '',
  medium_term_outcomes TEXT NOT NULL DEFAULT '',
  long_term_outcomes TEXT NOT NULL DEFAULT '',
  impact TEXT NOT NULL DEFAULT '',  -- This IS the impact section's content
  is_complete INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
```

## Interfaces

### Selection Matrix (Core Algorithm)

The Selection Matrix implements a three-stage filtering pipeline:

**Stage 1: Program Filter (Namespace)**
- User's selected program determines Vectorize namespace
- This is a strict pre-filter applied to all queries

**Stage 2: Dimension Filter (Tags)**
- Build metadata filters from venture profile and query intent
- Confidence threshold: 0.7 for inferred dimensions
- Apply progressive relaxation when insufficient results

**Stage 3: Semantic Search**
- Natural language similarity within filtered results
- Returns dimensionally-relevant documents

```typescript
// Filter building with program namespace
function buildVectorizeFilter(
  program: string,
  profile: VentureProfile,
  intent: QueryIntent
): { namespace: string; filters: object } {
  const filters: any = {};

  // Filter by content type
  if (intent.type === 'examples') {
    filters.content_type = { $eq: 'canvas-example' };
  }

  // Filter by venture stage
  if (profile.dimensions.ventureStage) {
    filters.venture_stage = { $eq: profile.dimensions.ventureStage };
  }

  // Filter by canvas section
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

  return { namespace: program, filters };
}

// Progressive relaxation: strict → remove industry → remove impact area → model-only → pure semantic
```

### Frontend ↔ API Communication

- No CORS needed (same origin with Workers Static Assets)
- Session ID via localStorage, passed in requests
- WebSocket for chat (via Agents SDK), REST for canvas CRUD

### Impact Model Sync

When updating the impact section or the Impact Model:

```typescript
// Update via impact section
async updateImpactSection(sessionId: string, content: string): Promise<void> {
  // Updates impact_model.impact column
  // Keeps Impact Model's final field in sync
}

// Update via Impact Model
async updateImpactModel(sessionId: string, field: string, content: string): Promise<void> {
  // Updates specific field
  // If field === 'impact', this IS the impact section's content
}
```

## Dependencies

### External
- **Libraries:**
  - `agents` ^0.2.32 (Cloudflare Agents SDK)
  - `@anthropic-ai/sdk` ^0.39.0 (Anthropic SDK - routed through AI Gateway)
  - `gray-matter` ^4.0.3 (frontmatter parsing)
  - `zod` ^4.0.0 (response validation - v4 for performance + JSON Schema export)
- **APIs:**
  - Anthropic Claude API (via AI Gateway `/anthropic` endpoint)
  - Workers AI (embeddings: @cf/baai/bge-m3, 1024 dimensions)
- **Services:**
  - Cloudflare Workers (with Static Assets)
  - Cloudflare Durable Objects
  - Cloudflare Vectorize
  - Cloudflare AI Gateway

### AI Gateway Configuration

AI Gateway provides observability, caching, and rate limiting for LLM calls:

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
  baseURL: `https://gateway.ai.cloudflare.com/v1/${env.CF_ACCOUNT_ID}/${env.CF_GATEWAY_ID}/anthropic`
});

const response = await client.messages.create({
  model: "claude-sonnet-4-5-20250514",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello" }]
});
```

**Environment variables required:**
- `ANTHROPIC_API_KEY` - Anthropic API key (secret)
- `CF_ACCOUNT_ID` - Cloudflare account ID
- `CF_GATEWAY_ID` - AI Gateway ID (e.g., "slc-advisor")

### Vectorize Setup

**Metadata indexes** must be created before the indexing script runs:

```bash
# Create Vectorize index with 1024 dimensions (for bge-m3)
wrangler vectorize create slc-knowledge-base --dimensions 1024 --metric cosine

# Create metadata indexes for filtering
wrangler vectorize create-metadata-index slc-knowledge-base \
  --type string --property-name content_type
wrangler vectorize create-metadata-index slc-knowledge-base \
  --type string --property-name venture_stage
wrangler vectorize create-metadata-index slc-knowledge-base \
  --type string --property-name canvas_section
wrangler vectorize create-metadata-index slc-knowledge-base \
  --type string --property-name primary_impact_area
wrangler vectorize create-metadata-index slc-knowledge-base \
  --type string --property-name primary_industry
```

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
| Impact Model storage | Separate table, synced with impact section | Inline JSON in section | Cleaner querying, explicit causality chain |
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

*Source: spec/slc-ai-advisor-mvp/requirements.md*
