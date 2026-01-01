# SLC AI Advisor - Comprehensive Audit Report

**Audit Date:** January 1, 2026
**Branch:** `claude/audit-advisor-agent-MeScF`
**Auditor:** Claude Opus 4.5

---

## Executive Summary

This audit evaluates the SLC AI Advisor codebase for production readiness, identifying bugs, architectural issues, and improvement opportunities. The application is a conversational AI advisor for social entrepreneurs, built on Cloudflare Workers with the Agents SDK, Durable Objects, and Vectorize for RAG.

### Overall Assessment: **Functional Prototype, Not Production-Ready**

The core architecture is sound and demonstrates good understanding of Cloudflare primitives. However, several critical issues must be addressed before MVP presentation:

| Priority | Category | Issues Found |
|----------|----------|--------------|
| **Critical** | Canvas UI Sync | State synchronization bugs between agent and UI |
| **Critical** | Tone Modification | System prompt injection not effective |
| **High** | Agents SDK Usage | Missing setState() for real-time UI updates |
| **High** | Token Optimization | No context windowing or caching |
| **Medium** | RAG Pipeline | Filter relaxation not implemented |
| **Medium** | Durable Objects | Session/Canvas coupling creates orphaned DOs |
| **Low** | Observability | Logs exist but not human-actionable |

---

## Part 1: Critical Issues

### 1.1 Canvas UI Synchronization Bugs

**Symptoms:** When the agent updates the canvas, updates may not appear in the UI for some time or at all. Sometimes multiple attempts are needed.

**Root Cause Analysis:**

1. **No Real-Time Push from Agent to UI:**
   - `SLCAgent.ts:140-180` - Tool executions call `CanvasDO` but don't push state changes to the frontend
   - The `setState()` method (Agents SDK) is NOT being used after canvas modifications
   - Frontend relies on REST API polling in `CanvasList.tsx` and manual refreshes

2. **Stale Canvas Context in Agent:**
   - In `SLCAgent.ts:95-100`, `buildCanvasContext()` is called once per message
   - If user edits canvas between messages, agent has stale context
   - No mechanism to refresh canvas state before each tool call

3. **Disconnected State Sources:**
   ```
   Current Flow:
   Agent Tool → CanvasDO (SQLite) → ??? → Frontend

   Missing: WebSocket push from Agent's setState() to React useAgentChat
   ```

4. **CanvasSection.tsx:100-105** syncs draft with content on prop change, but:
   - `isEditing` check prevents updates during edit mode
   - Race conditions between save and external updates
   - `isUpdating` prop exists but isn't connected to agent state

**Recommended Fix:**

```typescript
// In SLCAgent.ts - After each canvas tool execution:
async function postToolExecute(toolName: string, result: any) {
  if (toolName.startsWith('update_')) {
    // Push fresh canvas state to frontend
    const canvas = await this.getCanvasState();
    this.setState({
      ...this.getState(),
      canvas: canvas,
      lastUpdate: Date.now(),
      updatedSections: [result.section]
    });
  }
}

// In Frontend - Listen for state changes:
const { state } = useAgentChat({ ... });
useEffect(() => {
  if (state?.updatedSections) {
    // Trigger section refresh animations
    setHighlightedSections(state.updatedSections);
  }
}, [state?.lastUpdate]);
```

### 1.2 Tone Modification Ineffective

**Symptoms:** Despite tone profiles, agent still says "You're absolutely right" and similar phrases.

**Root Cause Analysis:**

1. **Tone Profile Location:** `worker/config/tone-profiles.ts:1-50`
   - Well-structured profiles with personality, guidelines, phrases to avoid
   - But they're appended to system prompt, not enforced

2. **System Prompt Bloat:** In `worker/agents/prompts.ts`:
   - Base prompt is generic
   - Tone instructions get buried after RAG context
   - Claude tends to revert to default behavior when prompts are long

3. **No Output Validation:**
   - Response isn't checked against avoided phrases
   - No retry mechanism for tone violations

**Recommended Fix - Use Claude's Output Styles:**

```typescript
// Use Anthropic's "style" parameter (when available)
// Or implement a two-pass approach:

async function generateResponse(messages: Message[], toneProfile: ToneProfile) {
  // First pass: Generate content
  const draft = await claude.messages.create({
    model: "claude-sonnet-4-5-20250514",
    messages: [...],
    system: buildSystemPrompt(ragContext)
  });

  // Second pass: Apply tone transformation
  const styled = await claude.messages.create({
    model: "claude-haiku-3-5-20240307", // Fast, cheap
    messages: [{
      role: "user",
      content: `Rewrite this response in a ${toneProfile.name} tone.

AVOID these phrases: ${toneProfile.avoidPhrases.join(', ')}

Original: ${draft.content}

Rewrite with same content, different tone:`
    }]
  });

  return styled;
}
```

Alternatively, prepend tone instructions to EVERY message, not just system prompt:

```typescript
// Prefix every user message with tone reminder
const messages = [
  ...conversationHistory,
  {
    role: "user",
    content: `[TONE: ${profile.name}. Never say: ${profile.avoidPhrases.slice(0,3).join(', ')}]

${userMessage}`
  }
];
```

---

## Part 2: High Priority Issues

### 2.1 Agents SDK Implementation Gaps

**Current State:** The app extends `AIChatAgent` but underutilizes its features.

| Feature | SDK Provides | Current Usage | Gap |
|---------|--------------|---------------|-----|
| `setState()` | Real-time UI sync | Unused for canvas | Critical |
| `getState()` | Typed state access | Unused | High |
| `schedule()` | Delayed tasks | Not used | Low |
| Message streaming | Resume on disconnect | Properly used | None |
| Tool definitions | JSON Schema tools | Custom format | Medium |

**Issues in `SLCAgent.ts`:**

1. **Lines 50-80:** Tool definitions use custom format, not SDK's tool schema
2. **Lines 100-150:** `onChatMessage()` doesn't leverage state for UI reactivity
3. **No typed state interface:** `AIChatAgent<Env, AgentState>` generic unused

**Recommended Refactor:**

```typescript
interface SLCAgentState {
  canvas: CanvasState;
  ventureProfile: VentureProfile;
  currentSection: CanvasSectionId | null;
  isProcessing: boolean;
  lastToolExecution: { tool: string; section: string; timestamp: number } | null;
}

export class SLCAgent extends AIChatAgent<Env, SLCAgentState> {
  // Initialize state on first connection
  async onConnect() {
    const canvas = await this.getCanvasDO().getFullCanvas();
    this.setState({
      canvas,
      ventureProfile: await this.getVentureProfile(),
      currentSection: canvas.currentSection,
      isProcessing: false,
      lastToolExecution: null
    });
  }

  // Update state after tool execution
  async onToolComplete(toolName: string, result: any) {
    const currentState = this.getState();
    this.setState({
      ...currentState,
      canvas: await this.getCanvasDO().getFullCanvas(),
      lastToolExecution: {
        tool: toolName,
        section: result.section || null,
        timestamp: Date.now()
      }
    });
  }
}
```

### 2.2 Token Usage Optimization

**Current State:** No token management strategy.

**Issues Found:**

1. **Full Canvas in Every Call:** `buildCanvasContext()` serializes all 11 sections
2. **RAG Context Unbounded:** `vector-search.ts` returns full document content
3. **No Conversation Windowing:** All messages included in context
4. **No Caching:** Same knowledge queries regenerate embeddings

**Measurements Needed:**
- Average tokens per message exchange
- RAG context contribution percentage
- Canvas context contribution percentage

**Recommended Optimizations:**

```typescript
// 1. Summarize inactive sections
function buildCanvasContext(canvas: CanvasState, focus?: CanvasSectionId): string {
  const focusSections = focus
    ? [focus, ...getRelatedSections(focus)]
    : ['purpose', 'impact'];

  return CANVAS_SECTIONS.map(section => {
    const content = canvas.sections.find(s => s.sectionKey === section)?.content || '';
    if (focusSections.includes(section)) {
      return `## ${section}\n${content}`;
    } else if (content) {
      // Summarize non-focus sections
      return `## ${section} (summary)\n${content.slice(0, 100)}...`;
    }
    return null;
  }).filter(Boolean).join('\n\n');
}

// 2. Truncate RAG results
const MAX_RAG_TOKENS = 2000;
function truncateRagContext(results: VectorizeMatch[]): string {
  let tokens = 0;
  const included: string[] = [];

  for (const result of results) {
    const docTokens = estimateTokens(result.metadata.content);
    if (tokens + docTokens > MAX_RAG_TOKENS) break;
    included.push(result.metadata.content);
    tokens += docTokens;
  }

  return included.join('\n\n---\n\n');
}

// 3. Conversation windowing
const MAX_CONVERSATION_TOKENS = 4000;
function windowConversation(messages: Message[]): Message[] {
  // Always include first message (context) and last N messages
  const recent = messages.slice(-10);
  // TODO: Implement sliding window with summarization
  return recent;
}
```

### 2.3 Agent Tool Loop and Rules

**Current Implementation:** `worker/agents/tools.ts`

**Issues:**

1. **Tool Definitions Not Anthropic-Native:**
   - Using custom schema instead of Anthropic's tool_use format
   - Missing proper input validation with Zod schemas

2. **No Tool Loop Limit:**
   - Agent could theoretically loop indefinitely
   - No circuit breaker for failed tools

3. **Missing Tool Result Validation:**
   - Tool outputs not validated before returning to model
   - Error messages not structured consistently

**Recommended Tool Definition Pattern:**

```typescript
import { z } from 'zod';

const updateSectionSchema = z.object({
  section: z.enum([...CANVAS_SECTIONS]),
  content: z.string().min(10).max(2000),
});

const tools: Tool[] = [
  {
    name: 'update_section',
    description: 'Update a canvas section with new content',
    input_schema: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          enum: [...CANVAS_SECTIONS],
          description: 'The section to update'
        },
        content: {
          type: 'string',
          description: 'The new content for the section'
        }
      },
      required: ['section', 'content']
    }
  }
];

// Tool execution with validation
async function executeTool(name: string, input: unknown): Promise<ToolResult> {
  const schema = toolSchemas[name];
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: `Invalid input: ${parsed.error.message}`
    };
  }

  // Execute with validated input
  return await toolHandlers[name](parsed.data);
}
```

---

## Part 3: Medium Priority Issues

### 3.1 RAG Pipeline Improvements

**Current Implementation:** `worker/retrieval/vector-search.ts`

**Issues:**

1. **No Progressive Relaxation:**
   - Design doc specifies: strict → remove industry → remove impact area → model-only → pure semantic
   - Not implemented; single filter level used

2. **Namespace Handling:**
   - `program` namespace not consistently applied
   - Default to 'generic' but no fallback

3. **Metadata Indexing:**
   - Tags stored as comma-separated string
   - Can't do efficient `$in` queries

**Recommended Implementation:**

```typescript
async function searchKnowledge(
  query: string,
  profile: VentureProfile,
  options: SearchOptions
): Promise<SearchResult[]> {
  const relaxationLevels = [
    // Level 0: Strict - all dimensions
    buildStrictFilter(profile),
    // Level 1: Remove industry
    buildFilterWithoutIndustry(profile),
    // Level 2: Remove impact area
    buildFilterWithoutImpactArea(profile),
    // Level 3: Stage + section only
    buildMinimalFilter(profile),
    // Level 4: Pure semantic
    {}
  ];

  for (const filter of relaxationLevels) {
    const results = await vectorize.query(
      await embedQuery(query),
      {
        topK: 5,
        namespace: options.program,
        filter
      }
    );

    if (results.matches.length >= 3) {
      return results.matches;
    }
  }

  return []; // No results even with no filter
}
```

### 3.2 Durable Objects Integrity

**Current Architecture:**
- `SLCAgent` DO: Conversation + messages + preferences
- `CanvasDO` DO: Canvas sections + venture profile + impact model

**Issues:**

1. **Session/Canvas Coupling:**
   - Session ID IS canvas ID (1:1 mapping)
   - `session.ts:37-56` creates both on POST
   - No way to have multiple conversations per canvas

2. **Orphaned DOs:**
   - Checking if session exists (`session.ts:69-78`) creates empty canvas
   - No cleanup mechanism for abandoned sessions

3. **No Cross-DO Transactions:**
   - Agent and Canvas are separate DOs
   - Tool calls to Canvas aren't transactional

**Recommended Architecture Changes:**

For MVP, keep current design but add:

```typescript
// Canvas metadata in KV for quick lookup without DO access
interface CanvasMeta {
  id: string;
  name: string;
  createdAt: string;
  lastAccessedAt: string;
  threadIds: string[]; // Allow multiple threads per canvas
}

// Thread management (future)
interface Thread {
  id: string;
  canvasId: string;
  title: string;
  createdAt: string;
}
```

### 3.3 PR 86 Readiness

Unable to directly access PR 86 details. Based on git history, recent PRs include:
- PR 88: Fix agent tool call narration
- PR 85: Backend Integration - Tone Profiles, Docs, React Fixes
- PR 83: Improve program READMEs

**Recommendation:** Review PR 86 against this audit's findings. Key merge blockers:
1. Canvas UI sync issues must be addressed
2. Tone modification needs rework
3. TypeScript compilation errors need resolution (see Part 4)

---

## Part 4: Code Quality Assessment

### 4.1 TypeScript Issues

**Build Status:** TypeCheck FAILS

```
Cannot find module 'react' or its corresponding type declarations.
```

**Root Cause:** Missing `node_modules` or incomplete TypeScript configuration.

**Files with Type Errors:**
- `src/App.tsx`: Missing React types, implicit `any` in callbacks
- `src/components/*`: Same React type issues

**Recommendation:** Ensure `npm install` runs in CI and add strict mode checks.

### 4.2 Code Organization

**Strengths:**
- Clear separation: `worker/` (backend) vs `src/` (frontend)
- Model managers encapsulate business logic well
- Consistent file naming conventions

**Weaknesses:**
- `worker/agents/prompts.ts` and `worker/llm/prompts.ts` both exist (duplicate)
- No barrel exports (`index.ts`) for cleaner imports
- Some components (Canvas.tsx) are very large (500+ lines)

### 4.3 Best Practices Adherence

| Practice | Status | Notes |
|----------|--------|-------|
| Parameterized SQL | Yes | `CanvasDO.ts` uses `?` placeholders |
| Error handling | Partial | Catch blocks exist but error shapes inconsistent |
| Logging | Yes | Structured JSON logging in place |
| Input validation | Partial | Zod used in some places, not all |
| Security | Good | No obvious SQL injection or XSS vectors |
| Accessibility | Good | ARIA labels on interactive elements |

### 4.4 Test Coverage

**E2E Tests:** `e2e/user-scenarios.spec.ts`
- Canvas editing flows covered
- Chat interaction flows covered
- Theme, sidebar, export flows covered

**Missing:**
- Unit tests for Model Managers
- Integration tests for RAG pipeline
- Unit tests for tool execution

---

## Part 5: Improvement Recommendations

### 5.1 User Authentication

**Current State:** No authentication. Sessions are UUID-based, anonymous.

**Recommended Implementation Path:**

```
Phase 1: Anonymous + Optional Account Link
├── Continue with UUID sessions (no friction)
├── Add "Save to Account" flow
└── Use Cloudflare Access or Auth0

Phase 2: Full Auth Integration
├── OAuth providers (Google, GitHub, LinkedIn)
├── Session tokens stored in KV with TTL
└── User → Canvas relationship (multiple canvases per user)

Phase 3: File Upload for Context
├── Cloudflare R2 for file storage
├── PDF/DOCX parsing for venture documents
├── Add to RAG context for that session
```

**Cloudflare-Native Options:**
- **Cloudflare Access:** Zero-trust, enterprise-ready
- **Workers Auth:** Roll your own with KV + JWT
- **Third-party:** Auth0, Clerk, Supabase Auth

### 5.2 Onboarding Experience

**Current State:** Users land on empty canvas with chat.

**Recommended Flow:**

```
Page Load
    │
    ├── Check localStorage for sessionId
    │       │
    │       ├── Exists → Check session validity
    │       │       │
    │       │       ├── Valid → Resume session
    │       │       │       └── Show "Welcome back" + canvas progress
    │       │       │
    │       │       └── Invalid → New session flow
    │       │
    │       └── Missing → New session flow
    │
New Session Flow:
    │
    ├── Welcome modal
    │       "Welcome to the SLC AI Advisor!"
    │       "I'll help you build your Social Lean Canvas."
    │
    ├── Initial venture quiz (3-5 questions)
    │       1. "What stage is your venture?"
    │       2. "What problem are you solving?"
    │       3. "Who are you helping?"
    │       → Infer ventureStage, impactArea
    │
    ├── Create canvas with initial entries
    │       Purpose section gets a draft based on answers
    │
    └── Guided tour of UI
        "This is your canvas..." / "Chat here for help..."
```

### 5.3 Sidebar UI Rework

**Current:** Separate Canvas list and Thread list.

**Recommended:** Merge threads under canvases.

```
SIDEBAR
├── CANVASES
│   ├── ★ My Healthcare Venture
│   │   ├── Thread: Initial setup (12/15)
│   │   ├── Thread: Revenue brainstorm (12/20)
│   │   └── + New thread
│   │
│   ├── Education Platform
│   │   └── Thread: Customer model (12/28)
│   │
│   └── + New Canvas
│
└── ARCHIVED (collapsed)
    └── Old Project
```

**Implementation:**
- Add `parentCanvasId` to Thread model
- Group threads in UI by canvas
- Allow creating new thread within canvas context

### 5.4 Agent Guidance Rules

**Problem:** Agent doesn't guide users through the learning program.

**Recommended Rule System:**

```typescript
interface GuidanceRule {
  id: string;
  trigger: 'section_complete' | 'session_start' | 'idle_timeout' | 'question_asked';
  condition: (context: GuidanceContext) => boolean;
  action: (agent: SLCAgent) => Promise<void>;
}

const rules: GuidanceRule[] = [
  {
    id: 'suggest-next-section',
    trigger: 'section_complete',
    condition: (ctx) => ctx.completedSections.length < 11,
    action: async (agent) => {
      const next = getNextRecommendedSection(agent.getState().canvas);
      await agent.sendMessage(
        `Great progress on ${ctx.lastSection}! ` +
        `Based on the SLC methodology, I'd recommend working on **${next}** next. ` +
        `Would you like some guidance on how to approach it?`
      );
    }
  },
  {
    id: 'check-video-sync',
    trigger: 'question_asked',
    condition: (ctx) => ctx.question.includes('confused') || ctx.question.includes('stuck'),
    action: async (agent) => {
      await agent.sendMessage(
        `I notice you might be stuck. Are you following along with the video series? ` +
        `If so, which module are you on? I can align my guidance with the video content.`
      );
    }
  }
];
```

### 5.5 Learning Program Skills

**Problem:** Agent doesn't feel domain-expert.

**Recommended Skill System:**

```typescript
// Skills that progressively unlock as user advances
interface LearningSkill {
  id: string;
  name: string;
  description: string;
  unlocksAt: CanvasSectionId | 'start';
  tools: Tool[];
  systemPromptAddition: string;
}

const skills: LearningSkill[] = [
  {
    id: 'customer-discovery',
    name: 'Customer Discovery Guide',
    unlocksAt: 'customers',
    systemPromptAddition: `
You are now helping with Customer Discovery. Key principles:
- Focus on problems, not solutions
- Ask about existing alternatives
- Quantify the pain (time, money, frustration)
- Identify early adopters vs mainstream customers
    `,
    tools: [
      { name: 'create_customer_persona', ... },
      { name: 'map_customer_journey', ... }
    ]
  },
  {
    id: 'impact-theory',
    name: 'Theory of Change Builder',
    unlocksAt: 'impact',
    systemPromptAddition: `
You are now helping build a Theory of Change. Guide the user through:
1. Issue definition (what's wrong?)
2. Participants (who's affected?)
3. Activities → Outputs → Outcomes → Impact chain
Ensure logical causality at each step.
    `,
    tools: [
      { name: 'validate_impact_chain', ... },
      { name: 'suggest_outcomes', ... }
    ]
  }
];
```

### 5.6 Knowledge Request Handling

**Current:** RAG search on every question.

**Recommended:** Intent classification first.

```typescript
type UserIntent =
  | { type: 'methodology_question'; section?: CanvasSectionId }
  | { type: 'example_request'; dimensions: Partial<VentureProfile> }
  | { type: 'canvas_edit'; section: CanvasSectionId; operation: 'update' | 'review' }
  | { type: 'general_chat' }
  | { type: 'progress_check' };

async function classifyIntent(message: string): Promise<UserIntent> {
  // Use Haiku for fast classification
  const response = await claude.messages.create({
    model: "claude-haiku-3-5-20240307",
    max_tokens: 100,
    messages: [{
      role: "user",
      content: `Classify this user message into one of these intents:
- methodology_question: Asking how to do something
- example_request: Asking for examples
- canvas_edit: Wanting to update their canvas
- general_chat: Chit-chat, greetings
- progress_check: Asking about their progress

Message: "${message}"

Respond with JSON: { "type": "...", ...optional fields }`
    }]
  });

  return JSON.parse(response.content[0].text);
}

// Route based on intent
async function handleMessage(message: string) {
  const intent = await classifyIntent(message);

  switch (intent.type) {
    case 'general_chat':
      // No RAG needed, quick response
      return await generateChatResponse(message);

    case 'methodology_question':
      // Search methodology content only
      const methodologyContext = await searchKnowledge(message, { contentType: 'methodology' });
      return await generateResponse(message, methodologyContext);

    case 'example_request':
      // Full Selection Matrix with venture profile
      const examples = await searchKnowledge(message, { contentType: 'example', profile: ventureProfile });
      return await generateResponse(message, examples);

    case 'canvas_edit':
      // Minimal RAG, focus on tool execution
      return await executeCanvasTool(intent.section, message);
  }
}
```

### 5.7 Human-Readable Observability

**Current:** JSON logs to console, Analytics Engine for metrics.

**Recommended:** Cloudflare Trace integration with user-friendly dashboards.

```typescript
// Enhanced event tracking
interface TraceEvent {
  sessionId: string;
  userId?: string;
  timestamp: string;
  event: string;
  data: {
    userMessage?: string;
    agentResponse?: string;
    toolsUsed?: string[];
    ragQueries?: number;
    tokensUsed?: number;
    latencyMs?: number;
    error?: string;
  };
}

// Write to both console (for debugging) and Analytics Engine (for dashboards)
function traceEvent(event: TraceEvent) {
  // Human-readable console format
  console.log(`[${event.timestamp}] ${event.event}`, {
    session: event.sessionId.slice(0, 8),
    user: event.data.userMessage?.slice(0, 50),
    tools: event.data.toolsUsed,
    latency: `${event.data.latencyMs}ms`
  });

  // Structured for Analytics Engine
  analyticsEngine.writeDataPoint({
    blobs: [event.sessionId, event.event, event.data.userMessage || ''],
    doubles: [event.data.latencyMs || 0, event.data.tokensUsed || 0],
    indexes: [event.sessionId]
  });
}
```

**Dashboard Query Examples:**

```sql
-- User engagement by session
SELECT
  blob1 as session_id,
  COUNT(*) as messages,
  AVG(double1) as avg_latency_ms
FROM slc_events
WHERE blob2 = 'message_received'
GROUP BY blob1
ORDER BY messages DESC
LIMIT 20;

-- Tool usage patterns
SELECT
  blob3 as tool_name,
  COUNT(*) as usage_count
FROM slc_events
WHERE blob2 = 'tool_executed'
GROUP BY blob3;
```

### 5.8 Document Display UI

**Current:** No way to view example ventures/canvases from knowledge base.

**Recommended:** Document viewer component.

```typescript
interface DocumentViewerProps {
  documentId: string;
  type: 'example' | 'methodology';
  onClose: () => void;
}

function DocumentViewer({ documentId, type, onClose }: DocumentViewerProps) {
  const [doc, setDoc] = useState<KnowledgeDocument | null>(null);

  useEffect(() => {
    fetch(`/api/knowledge/${documentId}`).then(r => r.json()).then(setDoc);
  }, [documentId]);

  return (
    <div className="document-viewer-overlay">
      <div className="document-viewer">
        <button onClick={onClose}>Close</button>
        {type === 'example' && (
          <ExampleCanvasView canvas={doc.parsedCanvas} />
        )}
        {type === 'methodology' && (
          <MarkdownRenderer content={doc.content} />
        )}
      </div>
    </div>
  );
}

// Render example canvases in the same visual format as user's canvas
function ExampleCanvasView({ canvas }: { canvas: ExampleCanvas }) {
  return (
    <div className="example-canvas read-only">
      {/* Same grid layout as main canvas, but non-editable */}
      {CANVAS_SECTIONS.map(section => (
        <CanvasSection
          key={section}
          sectionKey={section}
          content={canvas[section]}
          readOnly
        />
      ))}
    </div>
  );
}
```

### 5.9 Chat UI Improvements

**Current Issues:**
- No status indicators
- Agent behavior not observable
- Standard chat UI

**Recommended Enhancements:**

```typescript
// Status types for display
type AgentStatus =
  | { type: 'idle' }
  | { type: 'thinking' }
  | { type: 'searching_knowledge' }
  | { type: 'updating_canvas'; section: string }
  | { type: 'analyzing_venture' }
  | { type: 'generating_response' };

// Status indicator component
function StatusIndicator({ status }: { status: AgentStatus }) {
  const statusMessages: Record<AgentStatus['type'], string> = {
    idle: '',
    thinking: 'Thinking...',
    searching_knowledge: 'Searching knowledge base...',
    updating_canvas: `Updating ${status.type === 'updating_canvas' ? status.section : ''}...`,
    analyzing_venture: 'Analyzing your venture...',
    generating_response: 'Generating response...'
  };

  if (status.type === 'idle') return null;

  return (
    <div className="status-indicator">
      <span className="status-dot pulsing" />
      <span className="status-text">{statusMessages[status.type]}</span>
    </div>
  );
}

// Use Agent state to drive status
const { state } = useAgentChat({ ... });
const agentStatus = useMemo(() => {
  if (state?.isProcessing) {
    return { type: state.processingStep || 'thinking' };
  }
  return { type: 'idle' };
}, [state]);
```

### 5.10 Request Classification (Router Pattern)

**The Pattern:** Use a small, fast model to classify requests before routing to the main model.

**Architecture:**

```
User Message
     │
     ▼
┌─────────────┐
│ Haiku       │ ← Fast, cheap classifier
│ (Router)    │
└──────┬──────┘
       │
       ├── Chit-chat → Haiku responds directly
       │
       ├── Simple question → Sonnet without tools
       │
       ├── Canvas edit → Sonnet with canvas tools
       │
       └── Complex analysis → Opus with full context
```

**Implementation:**

```typescript
type RouteDecision = {
  model: 'haiku' | 'sonnet' | 'opus';
  tools: boolean;
  ragNeeded: boolean;
  directResponse?: string; // For Haiku handling directly
};

async function routeRequest(message: string, context: SessionContext): Promise<RouteDecision> {
  const classification = await claude.messages.create({
    model: "claude-haiku-3-5-20240307",
    max_tokens: 200,
    messages: [{
      role: "user",
      content: `Classify this message and decide how to route it:

Message: "${message}"

Current canvas completion: ${context.completionPercentage}%
Current section: ${context.currentSection}

Options:
1. CHIT_CHAT - Greeting, thanks, simple acknowledgment
2. QUICK_ANSWER - Simple methodology question, no tools needed
3. CANVAS_EDIT - User wants to update their canvas
4. DEEP_ANALYSIS - Complex question requiring examples or detailed guidance
5. EXAMPLE_REQUEST - User asking for venture examples

Respond with JSON:
{
  "category": "CHIT_CHAT|QUICK_ANSWER|CANVAS_EDIT|DEEP_ANALYSIS|EXAMPLE_REQUEST",
  "directResponse": "If CHIT_CHAT, provide friendly response here"
}`
    }]
  });

  const result = JSON.parse(classification.content[0].text);

  switch (result.category) {
    case 'CHIT_CHAT':
      return { model: 'haiku', tools: false, ragNeeded: false, directResponse: result.directResponse };
    case 'QUICK_ANSWER':
      return { model: 'sonnet', tools: false, ragNeeded: true };
    case 'CANVAS_EDIT':
      return { model: 'sonnet', tools: true, ragNeeded: false };
    case 'DEEP_ANALYSIS':
    case 'EXAMPLE_REQUEST':
      return { model: 'sonnet', tools: true, ragNeeded: true };
  }
}

// Main handler uses routing decision
async function handleUserMessage(message: string, context: SessionContext) {
  const route = await routeRequest(message, context);

  if (route.directResponse) {
    // Haiku already handled it
    return route.directResponse;
  }

  const ragContext = route.ragNeeded ? await searchKnowledge(message, context.profile) : '';
  const tools = route.tools ? getCanvasTools() : [];

  return await claude.messages.create({
    model: `claude-${route.model}-...`,
    tools,
    messages: buildMessages(message, context),
    system: buildSystemPrompt(ragContext)
  });
}
```

---

## Part 6: Implementation Priorities

### Immediate (Before MVP Presentation)

1. **Fix Canvas UI Sync** - Critical blocker
   - Implement `setState()` after tool execution
   - Add `lastUpdate` timestamp for frontend reactivity
   - Wire up `isUpdating` animation in CanvasSection

2. **Fix Tone Modification** - High impact on user experience
   - Prepend tone reminders to each message
   - Consider two-pass generation for critical phrases

3. **Verify TypeScript Build** - Must work in CI
   - Run `npm install` and `npm run typecheck`
   - Fix any remaining type errors

### Short-term (First Sprint Post-MVP)

4. **Implement Agent State** - Foundation for many features
5. **Add Status Indicators** - Low effort, high UX value
6. **Token Optimization** - Reduce costs, improve latency

### Medium-term (Following Sprints)

7. **Onboarding Flow** - Important for new user conversion
8. **Request Classification** - Optimize token usage
9. **Enhanced Observability** - Better debugging for production

### Long-term (Post-MVP Roadmap)

10. **User Authentication**
11. **File Upload Context**
12. **Multiple Threads per Canvas**
13. **Learning Program Skills**

---

## Appendix A: File-by-File Notes

| File | Issues | Priority |
|------|--------|----------|
| `worker/agents/SLCAgent.ts` | Missing setState(), no state interface | Critical |
| `worker/agents/tools.ts` | Custom schema instead of Anthropic format | Medium |
| `worker/agents/prompts.ts` | Duplicate with worker/llm/prompts.ts | Low |
| `worker/config/tone-profiles.ts` | Well-structured but ineffective | High |
| `worker/durable-objects/CanvasDO.ts` | Solid implementation, good patterns | - |
| `worker/retrieval/vector-search.ts` | Missing progressive relaxation | Medium |
| `src/components/Canvas.tsx` | Too large, needs splitting | Low |
| `src/components/CanvasSection.tsx` | isUpdating prop unused | High |
| `src/context/CanvasContext.tsx` | No WebSocket state integration | High |

---

## Appendix B: Dependencies Review

| Dependency | Version | Status | Notes |
|------------|---------|--------|-------|
| `agents` | ^0.2.32 | Current | Cloudflare Agents SDK |
| `@anthropic-ai/sdk` | ^0.39.0 | Current | Anthropic SDK |
| `zod` | ^4.0.0 | Current | v4 for JSON Schema export |
| `react` | ^19.0.0 | Current | Latest React |
| `gray-matter` | ^4.0.3 | Current | Frontmatter parsing |

No vulnerable or outdated critical dependencies detected.

---

## Appendix C: Security Considerations

| Area | Status | Notes |
|------|--------|-------|
| SQL Injection | Protected | Parameterized queries used |
| XSS | Protected | React escaping + no dangerouslySetInnerHTML |
| CSRF | N/A | Same-origin API calls |
| Rate Limiting | Configured | 100 req/min in design, verify implementation |
| API Keys | Secure | Using Cloudflare Secrets |
| Session Hijacking | Low Risk | UUID sessions are hard to guess |

---

*End of Audit Report*
