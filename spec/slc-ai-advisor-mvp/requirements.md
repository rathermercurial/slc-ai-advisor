# SLC AI Advisor MVP - Requirements

## Problem Statement

### The Challenge

Social entrepreneurs operate under a dual mandate: achieve financial sustainability while creating measurable social or environmental impact. The Social Lean Canvas provides a one-page framework for planning these ventures, combining business model (10 sections) and impact model (1 section).

Completing the canvas effectively requires:

- Understanding which elements matter most at different venture stages (idea vs. early vs. growth vs. scale)
- Learning from relevant examples without getting overwhelmed by irrelevant cases
- Accessing methodology guidance at the moment of need
- Receiving feedback and improvement suggestions during iteration

### Current State

The Social Lean Canvas learning program delivers structured instruction through video content organized into two tiers:

**Core Program (Open Source):** "How to fill in your Social Lean Canvas" - freely available video-based instruction walking users through each section.

**Build Program (Paid):** Deeper iteration work - improving each section, running tests, refining toward product-market fit.

The video drives learning, but users need just-in-time support when questions arise: "How specific should my UVP be?" or "What revenue models work for early-stage healthcare ventures?"

### Why Current Approaches Fall Short

**Static documentation** doesn't adapt to venture characteristics. Healthcare examples aren't relevant for education ventures; idea-stage guidance doesn't help scale-stage organizations.

**Forums and communities** require waiting for responses and searching through irrelevant discussions.

**One-on-one mentorship** doesn't scale and is cost-prohibitive.

### The Opportunity

An AI advisor can provide immediate, contextual responses by intelligently filtering a knowledge base based on the user's venture dimensions. The key innovation is encoding domain expertise (how experts categorize ventures) into a structured taxonomy that enables intelligent filtering before retrieval.

### Business Context

Timeline is critical: A functional demo is needed within approximately one week after Christmas to socialize the work and generate revenue from the Build program.

Success enables:
- Demonstrating value to potential Build program participants
- Generating revenue from paid enrollments
- Validating the approach for future development

## Users

**Primary audience:** Anglophone western social entrepreneurs across all venture development stages.

### User Segments by Stage

**Idea stage:** Validating problem, identifying participants, defining purpose. Needs help understanding what questions to ask, which sections to focus on first.

**Early stage:** Developing solution, testing with early adopters, establishing activities and outputs. Needs examples of how others progressed from idea to early implementation.

**Growth stage:** Scaling channels, optimizing revenue model, tracking outcomes and metrics. Needs guidance on when to iterate vs. when to pivot.

**Scale stage:** Leveraging unfair advantage, demonstrating long-term impact, refining financial sustainability. Needs advanced examples and cross-section integration advice.

### User Behavior

Users interact with the system in two ways:

**Methodology questions:** "How do I fill in the revenue section?" "What makes a good UVP?" "Should I focus on customers or participants first?"

**Example requests:** "Show me healthcare ventures" "What revenue models work for early-stage social enterprises?" "How did Patagonia articulate their purpose?"

The system responds conversationally, maintaining context so users don't repeat themselves across queries.

### Example User Journey

**User:** "I'm starting a healthcare clinic for low-income communities. Show me revenue models."

**What needs to happen:**
1. System infers or asks about venture characteristics (early-stage, health, direct-service, healthcare)
2. System filters knowledge base using these dimensions plus "revenue" section
3. System retrieves examples from similar ventures (dimensionally, not just semantically)
4. System provides response combining examples, methodology guidance, and templates
5. System stores venture characteristics for future queries

**User:** "Which of those would work best for my stage?"

**What needs to happen:**
1. System already knows venture is early-stage
2. System emphasizes examples/guidance most relevant to early-stage ventures
3. System doesn't require user to re-state context

This demonstrates: contextual understanding, intelligent filtering, conversational continuity, stage-appropriate guidance.

## Functional Requirements

### 1. Contextual Understanding

The system must understand the user's venture across 7 dimensions:

| Dimension | Examples | Purpose |
|-----------|----------|---------|
| **Venture Stage** | idea, early, growth, scale | Determines which sections matter most |
| **Impact Area** | health, education, climate, biodiversity | SDG-aligned + IRIS+ themes |
| **Impact Mechanism** | direct service, product-based, employment model, policy advocacy | How the venture creates impact |
| **Legal Structure** | nonprofit, benefit corp, cooperative, CIC | Organizational form |
| **Revenue Source** | product sales, service fees, grants, subscriptions | Income generation approach |
| **Funding Source** | bootstrapped, grants, impact equity, crowdfunding | Capital acquisition |
| **Industry** | healthcare, agriculture, technology, education | Sector classification |

This understanding should be:
- Inferred progressively from natural conversation (not interrogating users)
- Stored so users don't repeat context
- Updateable as the venture evolves

### 2. Methodology Guidance

The system must answer methodology questions:
- "How do I fill in the revenue section?"
- "What makes a good UVP?"
- "Should I focus on purpose or problem first?"

Responses must:
- Draw from the existing methodology content (video scripts, canvas section guides)
- Adapt guidance to the user's venture stage
- Be clear and actionable

### 3. Relevant Example Retrieval (The Selection Matrix)

This is the core value proposition. The system must retrieve venture examples that match the user's context - not just by keywords, but by dimensional similarity.

**Standard approach (doesn't work):**
- User asks "show me revenue models"
- System returns semantically similar content
- Problem: Returns irrelevant examples (wrong stage, wrong impact area, wrong mechanism)

**Required approach:**
- Understand user's venture dimensions (7 coordinates)
- Filter knowledge base using hierarchical tags BEFORE general search
- Rank by dimensional similarity when exact matches don't exist
- Retrieve examples that are dimensionally relevant, not just semantically similar

**Example:**
- User: early-stage, healthcare, direct-service, asking about revenue
- Good match: early-stage health clinic example (6/7 dimensions match)
- Bad match: scale-stage education platform (semantically about "revenue" but wrong context)

**Why this matters:** The taxonomy represents codified domain expertise. Expert advisors mentally categorize ventures across these dimensions when providing guidance. The system makes this explicit, enabling filtering that mimics expert reasoning.

### 4. Canvas Interaction

Users must be able to:
- View their canvas with all 11 sections visible
- Edit sections through conversation ("Update my purpose to...") or directly
- See which sections are complete vs. incomplete
- Track progress across the canvas
- Have their work persist across sessions
- Export their canvas for sharing or backup

### 5. Conversational Continuity

The system must maintain three types of state:

**Venture metadata:** 7-dimensional coordinates, inferred progressively through conversation

**Canvas content:** 11 sections, each with content and completion status

**Conversation context:** Recent exchanges to maintain continuity

Without this: User repeats context every query, no canvas persistence, poor experience.

With this: Natural conversation, contextual responses, canvas continuity.

## Success Criteria

### Must Demonstrate (MVP)

1. **Backend operational**
   - [ ] System is live and accessible
   - [ ] Handles requests and responses
   - [ ] Maintains state across sessions

2. **Content retrieval working**
   - [ ] Knowledge base (16 ventures, video scripts, templates) is indexed
   - [ ] System can search and retrieve content
   - [ ] Returns results to queries

3. **Methodology guidance accurate**
   - [ ] Draws from indexed methodology content
   - [ ] Provides clear, actionable guidance
   - [ ] Adapts to user's venture stage

4. **Selection matrix functional**
   - [ ] Filters examples using venture dimensions
   - [ ] Retrieved examples are dimensionally similar to user's venture
   - [ ] Not just keyword matching - true multi-dimensional relevance

5. **Canvas interaction working**
   - [ ] Canvas renders with 11 sections
   - [ ] User can edit sections
   - [ ] State persists across sessions
   - [ ] User can export their work

### Quality Indicators

**Retrieval relevance:** Do retrieved examples feel relevant to user's venture characteristics? Are they dimensionally similar (same stage, similar impact area, comparable mechanism)?

**Methodology clarity:** Are explanations clear and actionable? Does guidance match venture stage appropriately?

**Conversational flow:** Can users ask follow-up questions without repeating context? Does the system maintain understanding?

**Canvas usability:** Is editing smooth? Do updates reflect properly? Are exports usable?

**Developer accessibility:** Can an amateur coder navigate and understand the codebase? Can they make a simple change (add canvas section, modify tag, adjust content)?

### Demonstration Scenarios

Prepare these scenarios for demo:

1. **New user, general question:** System guides dimensional understanding through conversation
2. **Established context, specific query:** System retrieves dimensionally-relevant examples
3. **Canvas editing through conversation:** Updates reflect in canvas
4. **Direct canvas editing:** State persists
5. **Export and import:** Canvas can be saved and resumed

## Scope

### In Scope

- Conversational AI advisor (user-driven, responds to queries)
- Knowledge base access (methodology content, 16 venture examples)
- Multi-dimensional content filtering (138-tag taxonomy across 7 dimensions)
- Canvas viewing, editing, persistence, export (11 sections)
- Basic demo interface for testing and demonstration
- State management for venture context, canvas content, conversation

### Out of Scope (MVP)

- Advanced analytics and usage tracking
- Multi-user collaboration
- Content authoring/editing tools
- Mobile-optimized interface
- Integration with content player (future phase)
- User authentication beyond basic session management

## Constraints

### Timeline

**Hard deadline:** Approximately 1 week after Christmas for functional demo.

Implications:
- Ruthless scope prioritization required
- Selection matrix (multi-dimensional filtering) must work - it's the core value proposition
- Other features can be simplified or deferred

### Maintainability

**Primary maintainer:** Amateur/vibe coder

Implications:
- Codebase must be accessible to amateur coders
- Clear functional separation between components
- Simplicity valued over cleverness

**Critical test:** Can the maintainer make a simple change (add canvas section, modify tag, adjust content) without extensive help?

### Content State

**Current knowledge base:** Ready for use
- 16 example ventures with tags
- Video scripts in modular "slugs"
- Canvas templates
- 138-tag taxonomy defined across 7 dimensions
- 349 markdown files total

## Open Questions

1. How should the canvas be displayed to users in the demo interface?
2. How should dimensional matching work when no exact match exists? (Is 5/7 dimensions better than 3/7? How much better?)
3. What's the minimum viable demo interface needed?

---

*Source: tmp/agent-discovery.md, tmp/discovery-meeting-transcript.md*
