
# SLC Knowledge Agent — Project Brief

## Overview

Build an AI-powered advisor that helps Social Lean Canvas program participants understand the methodology, improve their canvas content, and learn from venture examples. The agent draws from the SLC knowledge base and responds in a helpful, mentor-like tone.

**Approach:** Get a working version deployed quickly, then iterate on content structure and system prompt based on real usage.

---

## Goals

1. **Answer questions** about SLC methodology, program content, and business model concepts
2. **Provide feedback** on canvas content that users paste into the chat
3. **Reference relevant examples** from the venture library to illustrate concepts
4. **Guide users** through the program's sequential steps when asked

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  CONTENT LAYER                                                   │
│  Obsidian vault → GitHub repository                              │
│  - Program content (~60 documents)                               │
│  - Venture examples (~20 documents)                              │
│  - Templates and models documentation                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ reads content on deploy
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND (Railway)                                               │
│                                                                  │
│  Embedding Generation                                            │
│  - Chunks content by heading                                     │
│  - Generates embeddings via OpenAI (text-embedding-3-small)      │
│  - Stores in LanceDB (file-based vector database)                │
│                                                                  │
│  Chat API                                                        │
│  - Receives user questions                                       │
│  - Retrieves relevant content chunks                             │
│  - Sends to Claude via OpenRouter (enables usage limits,         │
│    model switching, and cost monitoring)                         │
│  - Streams response back                                         │            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API calls
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND                                                        │
│  Chat interface (to be determined)                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Content (Obsidian → GitHub)

Markdown files with YAML frontmatter. Content is indexed when `publish: true` is set.

**Required frontmatter:**

yaml

````yaml
---
title: "Document Title"
description: "Brief description for search context"
publish: true
---
```

**Content types:**
- Program content (methodology, step-by-step guidance)
- Venture examples (real-world SLC applications)
- Template/model explanations

### 2. Embedding Pipeline
Runs automatically on deployment. Processes markdown files, chunks by heading, generates vector embeddings, stores in LanceDB.

**Key behaviours:**
- Only indexes files with `publish: true`
- Ignores folders: `private`, `templates`, `.obsidian`
- Incremental updates (only re-embeds new/changed content)

### 3. RAG Service
Handles the question → retrieval → response flow.

**Process:**
1. Convert user question to embedding
2. Find top 20 most similar content chunks
3. Format chunks as context
4. Send system prompt + context + question to Claude
5. Stream response

### 4. System Prompt
Defines the agent's personality, rules, and response format. Key elements:
- Role: SLC advisor/mentor
- Grounding: Only answer from provided context
- Citations: Link to source documents
- Canvas review: Structured feedback when users paste content
- Tone: Encouraging, practical, honest

### 5. Chat Interface
To be determined based on integration needs. The backend provides a streaming API endpoint that any frontend can consume.

---

## Implementation Steps

### Phase 1: Content Preparation

**1.1 Audit existing content**
- Review ~60 program documents
- Review ~20 venture examples
- Identify what's ready vs needs work

**1.2 Add frontmatter to documents**
- Add `publish: true` to all content for indexing
- Add descriptive `title` and `description` fields
- Structure content with clear `#` and `##` headings

**1.3 Organise folder structure**
```
content/
├── program/          # Methodology and guidance
├── ventures/         # Example ventures with SLC breakdowns
├── models/           # Canvas, strategy, stage model explanations
└── private/          # Working files (won't be indexed)
````

### Phase 2: Backend Setup

**2.1 Create repository**

- Set up clean repo with server files only (not full Quartz setup)
- Copy essential files: `server/`, `Dockerfile`, `railway.json`, `start.sh`, `package.json`, `tsconfig.json`

**2.2 Configure for SLC**

- Update `system-prompt.ts` with SLC-specific instructions
- Update `IGNORE_PATTERNS` if needed
- Review chunking logic in `embeddings.ts` for SLC content structure

**2.2.5 Configure OpenRouter**

Modify `rag-service.ts` to use OpenRouter instead of direct Anthropic API:

typescript

```typescript
// Replace Anthropic client with OpenRouter (OpenAI-compatible)
const openrouter = new OpenAI({ 
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

// Use model string: "anthropic/claude-sonnet-4"
```

In OpenRouter dashboard:

- Set up spending limits per API key
- Enable usage alerts
- Note: Can switch models easily (e.g., `anthropic/claude-sonnet-4`, `openai/gpt-4o`) by changing the model string

**2.3 Deploy to Railway**

- Create Railway project
- Configure environment variables:
	- OPENAI_API_KEY (for embeddings)
	- OPENROUTER_API_KEY (for Claude chat via OpenRouter)
	- LANCEDB_PATH (for vector storage)
- Create persistent volume for LanceDB
- Connect to GitHub repo for auto-deploy

**2.4 Test the API**

- Verify embeddings generate on deploy
- Test chat endpoint with sample questions
- Check that citations and sources work correctly

### Phase 3: System Prompt Development

**3.1 Draft initial prompt**

- Define SLC advisor role and expertise
- Set grounding rules (only answer from context)
- Specify citation format
- Define canvas feedback structure
- Set tone and length guidelines

**3.2 Test and refine**

- Ask representative questions
- Paste sample canvas content for review
- Adjust prompt based on response quality
- Iterate until responses feel right

### Phase 4: Frontend Integration

Scope to be determined. Backend provides streaming API endpoint ready for integration.

---

## Content Formatting Guidelines

### Program Content

markdown

```markdown
---
title: "Customer Model: Identifying Segments"
description: "How to identify and define customer segments for your venture"
publish: true
---

# Overview

Brief introduction to this topic...

## Key Concepts

Detailed explanation...

## How To Apply This

Step-by-step guidance...

## Common Mistakes

What to avoid...
```

### Venture Examples

markdown

````markdown
---
title: "FoodShare"
description: "Urban food redistribution social enterprise"
publish: true
venture_type: social-enterprise
impact_area: food-security
stage: growth
---

# About FoodShare

Brief synopsis...

## Customer Model

Who they serve and why...

## Impact Model

How they create change...

## Economic Model

How they sustain the venture...

## Key Lessons

What makes this model effective...
```

---

## API Endpoints

**Chat endpoint:**
```
POST https://[railway-app].up.railway.app/api/chat

Body:
{
  "message": "How do I identify my customer segments?",
  "history": []  // Previous messages for context
}

Response: Streamed text
````

---

## Key Files Reference

| File                            | Purpose                                                          |
| ------------------------------- | ---------------------------------------------------------------- |
| `server/system-prompt.ts`       | Agent personality and rules                                      |
| `server/embeddings.ts`          | Content parsing and chunking logic                               |
| `server/rag-service.ts`         | Question → retrieval → response flow **(modify for OpenRouter)** |
| `server/generate-embeddings.ts` | Startup script for indexing                                      |
| `server/vector-store.ts`        | LanceDB interface                                                |
| `start.sh`                      | Deployment startup (re-indexes then starts server)               |
| `.env`                          | API keys (not committed to repo)                                 |

---

## Success Criteria (Initial Version)

- [ ]  Backend deployed and responding to API calls
- [ ]  Content successfully indexed (~60 docs, ~20 ventures)
- [ ]  Agent answers methodology questions accurately
- [ ]  Agent cites sources in responses
- [ ]  Agent provides useful feedback on pasted canvas content
- [ ]  Agent references relevant venture examples when appropriate


## Future Improvements (Out of Scope for v1)

- Experiment with alternative models via OpenRouter to compare performance
- Custom chunking for YAML slug content
- Analytics/logging for common questions
- Refined content structure based on usage patterns
- Full platform integration






%% Begin notes: %%

---

## Remaining Information to Collect

Updated discovery document with your answers. Here are the outstanding questions organized by priority:

### **Critical (Block Design Decisions)**

**Quality Standards & Assessment:**
1. What defines "high-quality" canvas content? (rubric, scoring criteria, assessment guidelines)
	1. tbd
2. Where do quality standards documentation exist?
	1. tbd
3. Can you provide examples of excellent vs. poor canvas content for each section?
	1. tbd
4. How should the agent handle methodology boundaries? (too creative vs. appropriately adaptive)
	1. tbd

**Discovery Process:** 
5. What's the minimum context needed before agent can provide useful feedback?
	1. tbd
6. What's the standard discovery question sequence for new users? 
	1. tbd
7. How should the agent handle users who skip or resist discovery questions?
	1. tbd

**Learning Program Structure:** 
8. Is the program linear or can users choose their own path? 
	1. tbd
9. Should the agent enforce sequential learning or allow free exploration? 
	1. tbd
10. Are there prerequisites or dependencies between sections? 
	1. tbd
11. Does the program include assessments or checkpoints?
	1. tbd

**Scope Clarification:** 
12. What's in scope for "general business consulting" vs. SLC-specific guidance?
	1. tbd

### **High Priority (Affects Implementation)**

**User Context:** 
13. What venture development stages are relevant? (idea, launch, growth, established?) 
	1. All. It's important that the agent (if possible) assess the venture stage to appropriately inform its response according to the assessment framework
14. Does geographic location matter for methodology application?
	1. Not particularly. Let's assume the audience is anglophone westerner

**Technical Architecture:** 
15. AI Model selection (Sonnet vs. Opus) and budget constraints? 
	1. We'd probably want to use Opus 4.5 for any reasoning tasks and detailed advice, but the system should be able to leverage various models as needed.
	2. For general purposes, it would be nice to leverage sonnet and/or haiku for interactions which don't require advanced reasoning or keeping large context across long conversations. Tasks like fetching information, answering simple questions or updating the canvas state probably don't need Opus when sonnet and haiku are so good at general tasks now. Refer to model selection advice here: https://platform.claude.com/docs/en/about-claude/models/choosing-a-model#model-selection-matrix
	3. Be sure to implement new 4.5 features and best practices https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-5
16. Vector database choice and embedding strategy? 
	1. Cloudflare vectorize preferred: https://developers.cloudflare.com/vectorize/
	2. Open to embedding strategy/model. We should probably test these out.
17. Knowledge base update mechanism? 
	1. Updates are typically pushed to git. We can use various sync/update strategies from there as needed.
18. R2 for file storage needs?
	1. We should minimize the amount of user data we need to hold by default. But yes otherwise we should keep it as close to the edge as possible so r2 would be a good option.

**Error Handling:** 
19. What happens if knowledge base search fails? 
	1. tbd
20. How to handle conflicting information in knowledge base? 
	1. tbd
21. Graceful degradation strategies?
	1. tbd

### **Medium Priority (Refinement & Features)**

**Control Flow Details:** 
22. Client preference on reference vs. generate balance? 
	1. clarify this question please
23. Should agent wait for full section completion before providing feedback? 
	1. No, the agent should do its best to serve the user even when given partially-complete data, while clearly communicating to the user along the way. Like "I have enough information to give some basic advice. or provide these additional details for a more in-depth answer", or "I don't yet have a clear understanding of your project, but I'll try to give some basic advice.."
24. Prerequisites for certain sections/topics?
	1. tbd
25. Recommended time commitment per section/module?
	1. tbd

**Integration Features:** 
26. Email delivery of exports? 
	1. no
27. Progress reports generation? 
	1. probably not. Canvas export would be good though.
28. Design specs for artifact view (stretch goal)?
	1. Yeah, that should be included in the spec as a stretch goal

**Success Metrics:** 
29. How will you measure if the agent is successful? 
	1. tbd
30. What usage metrics should be tracked? 
	1. tbd
31. How will you measure response quality? 
	1. tbd
32. User satisfaction measurement approach? 
	1. tbd
33. Analytics/logging requirements? 
	1. tbd
34. Performance/latency targets?
	1. tbd

### **Administrative:**

35. Project timeline and key milestones?
	1. tbd
