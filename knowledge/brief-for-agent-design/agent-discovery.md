---
date: December 16, 2025
project: Social Lean Canvas Advisor
status: Discovery Phase
org: Team DB
participants:
  - yeoro.eth
  - heenal.eth
  - rathermercurial.eth
contact: yeoro.eth
author: rathermercurial.eth
---
# Social Lean Canvas AI Advisor - Discovery Document

The Social Lean Canvas AI Advisor provides intelligent, contextual support for social entrepreneurs working through the Social Lean Canvas methodology. Users ask questions about methodology or request relevant examples; the system responds by filtering a knowledge base using multi-dimensional venture analysis.

The breakthrough is a 138-tag taxonomy encoding domain expertise about how to categorize and analyze social enterprises across 7 dimensions (stage, impact area, mechanism, legal structure, revenue source, funding source, industry). This enables intelligent content filtering: instead of generic search, the system retrieves examples and guidance specifically relevant to the user's venture characteristics.

Timeline is critical: Rowan needs a functional demo within approximately one week after Christmas to socialize the work and generate revenue from the Build program. This is tied to his employment prospects in the new year.

Success means demonstrating four capabilities: (1) backend deployed with API calls, (2) content indexed and retrievable, (3) agent answers methodology questions accurately, (4) agent references relevant venture examples based on user's context. The system must remain maintainable by Rowan, an amateur coder, through comprehensive developer tooling.

---

## Problem Statement

### The Challenge

Social entrepreneurs operate under a dual mandate: achieve financial sustainability while creating measurable social or environmental impact. The Social Lean Canvas provides a one-page framework for planning these ventures, combining business model (10 sections) and impact model (1 section).

Completing the canvas effectively requires:

- Understanding which elements matter most at different venture stages (idea vs. early vs. growth vs. scale)
- Learning from relevant examples without getting overwhelmed by irrelevant cases
- Accessing methodology guidance at the moment of need
- Receiving feedback and improvement suggestions during iteration

### Current State

Rowan's learning program delivers structured instruction through video content organized into two tiers:

**Core Program (Open Source)**: "How to fill in your Social Lean Canvas" - freely available video-based instruction walking users through each section.

**Build Program (Paid)**: Deeper iteration work - improving each section, running tests, refining toward product-market fit.

The video drives learning, but users need just-in-time support when questions arise: "How specific should my UVP be?" or "What revenue models work for early-stage healthcare ventures?"

### Why Current Approaches Fall Short

**Static documentation** doesn't adapt to venture characteristics. Healthcare examples aren't relevant for education ventures; idea-stage guidance doesn't help scale-stage organizations.

**Forums and communities** require waiting for responses and searching through irrelevant discussions.

**One-on-one mentorship** doesn't scale and is cost-prohibitive.

### The Opportunity

An AI advisor can provide immediate, contextual responses by intelligently filtering a knowledge base based on the user's venture dimensions. The key innovation is encoding domain expertise (how experts categorize ventures) into a structured taxonomy that enables intelligent filtering before retrieval.

### Business Context

Rowan has committed to a partner that he will secure a job in the new year if this work doesn't generate revenue. The aggressive timeline (~1 week for functional demo) reflects this constraint.

Success enables:

- Demonstrating value to potential Build program participants
- Generating revenue from paid enrollments
- Validating the approach for future development
- Establishing foundation for content player integration

Failure means abandoning this work entirely.

---

## Target Users

**Primary audience**: Anglophone western social entrepreneurs across all venture development stages.

### User Segments by Stage

**Idea stage**: Validating problem, identifying participants, defining purpose. Needs help understanding what questions to ask, which sections to focus on first.

**Early stage**: Developing solution, testing with early adopters, establishing activities and outputs. Needs examples of how others progressed from idea to early implementation.

**Growth stage**: Scaling channels, optimizing revenue model, tracking outcomes and metrics. Needs guidance on when to iterate vs. when to pivot.

**Scale stage**: Leveraging unfair advantage, demonstrating long-term impact, refining financial sustainability. Needs advanced examples and cross-section integration advice.

### User Behavior

Users interact with the system in two ways:

**Methodology questions**: "How do I fill in the revenue section?" "What makes a good UVP?" "Should I focus on customers or participants first?"

**Example requests**: "Show me healthcare ventures" "What revenue models work for early-stage social enterprises?" "How did Patagonia articulate their purpose?"

The system responds conversationally, maintaining context so users don't repeat themselves across queries.

---

## The Domain Expertise: 138-Tag Taxonomy

The core intellectual property is a comprehensive taxonomy encoding how expert advisors think about social ventures. This isn't generic metadata - it's a structured ontology representing analytical frameworks used by practitioners.

### Two Distinct Tag Systems

**Venture Characterization Tags (96 tags, 7 dimensions)**: Describe ventures themselves, enable intelligent filtering

**Knowledge Base Organization Tags (42 tags)**: Categorize content (which canvas section, what type of content)

### Venture Characterization: The 7 Dimensions

**1. Venture Stage (5 tags)**

- Idea, Early, Growth, Scale + parent tag
- Each stage has specific priorities (what sections matter most)
- Idea stage: Purpose, Problem, Participants, Customers
- Early stage: Solution, Activities, Early Adopters, Outputs
- Growth stage: Channels, Revenue, Outcomes, Key Metrics
- Scale stage: Advantage, Long-term Impact, Financial Model

**2. Impact Area (34 tags)**

- SDG-aligned (17 UN Sustainable Development Goals)
- IRIS+ themes (health, education, climate, etc.)
- Must handle both frameworks

**3. Impact Mechanism (10 tags)**

- How ventures create impact
- Examples: product-service-impact, employment-model, direct-service, capacity-building, policy-advocacy, systems-change

**4. Legal Structure (11 tags)**

- Organizational forms: charity, nonprofit, cooperative, benefit-corporation, CIC (UK), L3C (US), standard-limited-company
- Note: Some structures are jurisdiction-specific

**5. Revenue Source (11 tags)**

- Income models: product-sales, service-fees, subscriptions, government-contracts, philanthropy, etc.

**6. Funding Source (7 tags)**

- Capital acquisition: bootstrapped, grants, impact-equity, crowdfunding, blended-finance, etc.

**7. Industry (17 tags)**

- Sector classifications: agriculture, healthcare, education, clean-energy, financial-services, etc.

### Knowledge Base Organization Tags

**Canvas Section Tags (27 tags)**: Which section(s) content relates to (purpose, problem, solution, revenue, etc.)

**Content Type Tags (15 tags)**: What kind of content (canvas-example, case-study, template, concept, lexicon-entry, etc.)

### Hierarchical Tag Rules

All tags follow strict parent-child relationships. Child tags cannot be used without their parent:

```yaml
# INVALID - missing parent tags
tags: [product-sales, sdg-03-good-health]

# VALID - includes required parents  
tags: [venture-type, revenue-source, product-sales, 
       impact-area, sdg-03-good-health]
```

This hierarchy must be respected throughout the system.

### Why This Matters

The taxonomy represents **codified domain expertise**. Expert advisors mentally categorize ventures across these dimensions when providing guidance. The tag system makes this explicit and machine-readable, enabling filtering that mimics expert reasoning: "This venture is early-stage, health-focused, using direct-service delivery - find similar examples and relevant guidance."

This is the intellectual property that makes contextual retrieval possible.

---

## What Users Need to Accomplish

### Core User Workflows

**1. Getting Started**

- User arrives with venture idea or existing venture
- System needs to understand venture characteristics (7 dimensions)
- Can happen through conversation ("I'm starting a healthcare clinic") or explicit questions
- Understanding stored so user doesn't repeat context

**2. Asking Methodology Questions**

- "How do I fill in the revenue section?"
- "What makes a good UVP?"
- "Should I focus on purpose or problem first?"
- System provides guidance from methodology content, adapted to user's stage

**3. Requesting Examples**

- "Show me healthcare ventures"
- "What revenue models work for nonprofits?"
- "How did Patagonia describe their purpose?"
- System filters knowledge base by relevant dimensions, provides examples

**4. Building Their Canvas**

- System maintains canvas state (content for 11 sections)
- User can edit through conversation or directly
- Canvas visible and interactive
- Progress tracked (which sections completed)

**5. Iterating and Refining**

- User returns to improve specific sections
- System remembers venture characteristics and previous work
- Provides contextual feedback and suggestions
- Helps identify inconsistencies across sections

### Example User Journey

**User**: "I'm starting a healthcare clinic for low-income communities. Show me revenue models."

**What needs to happen**:

1. System infers or asks about venture characteristics (early-stage, health, direct-service, healthcare)
2. System filters knowledge base using these dimensions plus "revenue" section
3. System retrieves examples from similar ventures (dimensionally, not just semantically)
4. System provides response combining examples, methodology guidance, and templates
5. System stores venture characteristics for future queries

**User**: "Which of those would work best for my stage?"

**What needs to happen**:

1. System already knows venture is early-stage
2. System emphasizes examples/guidance most relevant to early-stage ventures
3. System doesn't require user to re-state context

This demonstrates: contextual understanding, intelligent filtering, conversational continuity, stage-appropriate guidance.

---

## Success Criteria

### MVP Demo Requirements (End of ~Week 2)

Must demonstrate these four capabilities:

**1. Backend deployed with API calls**

- System is live and accessible
- Handles requests and responses
- Maintains state across sessions

**2. Content indexed and retrievable**

- Knowledge base (10 ventures, video scripts, templates) is indexed
- System can search and retrieve content
- Returns results to queries

**3. Agent answers methodology questions accurately**

- Draws from indexed methodology content
- Provides clear, actionable guidance
- Adapts to user's venture stage

**4. Agent references relevant venture examples based on context**

- Filters examples using venture dimensions (the selection matrix)
- Retrieved examples are dimensionally similar to user's venture
- Not just keyword matching - true multi-dimensional relevance

**Plus: Canvas interaction**

- Canvas renders with 11 sections
- User can edit sections
- State persists across sessions
- User can export their work

### Quality Indicators (Qualitative Assessment)

**Retrieval relevance**: Do retrieved examples feel relevant to user's venture characteristics? Are they dimensionally similar (same stage, similar impact area, comparable mechanism)?

**Methodology clarity**: Are explanations clear and actionable? Does guidance match venture stage appropriately?

**Conversational flow**: Can users ask follow-up questions without repeating context? Does the system maintain understanding?

**Canvas usability**: Is editing smooth? Do updates reflect properly? Are exports usable?

**Developer accessibility**: Can Rowan navigate and understand the codebase? Can Rowan make a simple change?

### Demonstration Scenarios

Prepare these scenarios for demo:

1. **New user, general question**: System guides dimensional understanding through conversation
2. **Established context, specific query**: System retrieves dimensionally-relevant examples
3. **Canvas editing through conversation**: Updates reflect in canvas
4. **Direct canvas editing**: State persists
5. **Export and import**: Canvas can be saved and resumed

---

## Known Constraints

### Timeline

**Hard deadline**: Approximately 1 week after Christmas for functional demo.

This is not flexible. Rowan needs to demonstrate the system to generate revenue or secure alternative employment. Missing this deadline means abandoning the project.

Implications:

- Ruthless scope prioritization required
- Selection matrix (multi-dimensional filtering) must work - it's the core value proposition
- Other features can be simplified or deferred
- Use existing components where possible (Heenal's UI prototype if available)
- Parallel development essential - teams can't wait on each other

### Budget

**Development costs**: Covered by SuperBenefit AI budget allocation

**Operating costs**: AI model API usage, infrastructure, storage must remain reasonable

**Cost sensitivity**: Early stage, variable usage, need to prove value before scaling

Implications:

- Consider cost-per-query from day one
- Architecture should support model experimentation for cost optimization
- Track costs to inform future decisions

### Skills and Maintainability

**Primary maintainer**: Rowan, amateur/vibe coder

**Other contributors**: Phil limited to 1-hour tasks maximum

Implications:

- Codebase must be accessible to amateur coders
- Comprehensive developer tooling required (not optional)
- Clear functional separation between components
- Extensive documentation and examples
- Simplicity valued over cleverness

**Critical test**: Can Rowan make a simple change (add canvas section, modify tag, adjust content) without extensive help?

If Rowan can't maintain the system, the project fails long-term even if the demo succeeds.

### Content State

**Current knowledge base**: Mixed completion state

- 10 example ventures with varying tag completeness
- Video scripts in modular "slugs"
- Canvas templates
- Some content needs work

Implications:

- Focus on completing 10 core ventures for MVP
- Additional content can be added incrementally
- Document minimum viable completeness
- Test early to identify gaps

### Team Structure

**Three independent teams** with different skills:

- Front-end: UI/UX, canvas rendering, chat interface
- Back-end: API, state management, retrieval system, model integration
- Content: Tagging ventures, validating taxonomy, preparing content

**Coordination challenge**: Teams working in parallel need clear contracts to avoid blocking each other.

Implication: Specification document is critical path item - defines interfaces so teams can work independently.

---

## What Makes This Hard

### The Selection Matrix Challenge

The core technical challenge is intelligent content filtering based on multi-dimensional venture analysis. This is not standard semantic search.

**Standard approach** (doesn't work):

- Index all content with embeddings
- User asks "show me revenue models"
- Retrieve semantically similar content
- Problem: Returns irrelevant examples (wrong stage, wrong impact area, wrong mechanism)

**Required approach** (what makes this work):

- Understand user's venture dimensions (7 coordinates)
- Filter knowledge base using hierarchical tags BEFORE semantic search
- Rank by dimensional similarity when exact matches don't exist
- Retrieve examples that are dimensionally relevant, not just semantically similar

**Example**:

- User: early-stage, healthcare, direct-service, asking about revenue
- Good match: early-stage health clinic example (6/7 dimensions match)
- Bad match: scale-stage education platform (semantically about "revenue" but wrong context)

**Why this is hard**:

- Extracting dimensions from natural conversation (not interrogating users)
- Constructing hierarchical tag queries correctly
- Determining relevance when no exact match exists (is 5/7 match better than 3/7?)
- Balancing dimensional similarity with semantic relevance
- Making this fast enough for good user experience

This is where domain expertise encoded in the taxonomy meets technical execution. Get this wrong and the system provides generic, unhelpful responses. Get it right and responses feel like talking to an expert advisor.

### State Management Complexity

System must track three types of state:

**Venture metadata**: 7-dimensional coordinates, inferred progressively through conversation

**Canvas content**: 11 sections, each with content and completion status, editable through conversation or directly

**Conversation context**: Recent exchanges to maintain continuity

Without state management: User repeats context every query, no canvas persistence, no progressive understanding, poor user experience.

With state management: Natural conversation, contextual responses, canvas continuity, but added complexity.

### Developer Experience as Requirement

Most systems treat developer experience as nice-to-have. This project treats it as core requirement because Rowan must maintain the system.

Typical approach: Write code, add comments, maybe some docs.

Required approach:

- Comprehensive tooling for code navigation
- Skills for understanding architecture and components
- Commands for common tasks
- Extensive documentation with examples
- Clear patterns and conventions
- Simple enough for amateur coder to modify

This isn't about dumbing down the system - it's about organizing and documenting so complexity is manageable.

---
## Conclusion

This project builds an AI advisor that helps social entrepreneurs complete their Social Lean Canvas by providing contextually-relevant guidance and examples. The breakthrough is encoding domain expertise (the 138-tag taxonomy) into a system that filters content based on multi-dimensional venture analysis, not just semantic similarity.

### What Success Looks Like

**Short-term (Week 2)**: Functional demo showing intelligent content retrieval (the selection matrix working), canvas interaction, and conversational interface. Convincing enough to socialize with potential Build program participants.

**Medium-term (Months 1-3)**: Revenue from Build program enrollments, user feedback driving iteration, integration with content player, cost optimization through model experimentation.

**Long-term (Year 1)**: Established tool supporting social entrepreneurs globally, proven methodology for encoding domain expertise, foundation for other applications (DAO Primitives also needs selection matrix).

### What Failure Looks Like

- Retrieved examples feel random or irrelevant (selection matrix doesn't work)
- User experience requires constant context repetition (state management broken)
- Rowan can't understand or modify code (developer experience failed)
- Timeline missed, opportunity lost, project abandoned

### The Path Forward

**Immediate next step**: Draft specification document answering open questions and defining:

- API contracts between layers
- Data models for venture metadata, canvas state, conversation format
- Tag taxonomy reference documentation
- Integration points and interfaces
- Developer tooling requirements

This specification enables three teams to work in parallel without blocking each other. Without it, development is sequential and timeline is at risk.

**Critical insight**: The specification is not implementation documentation - it's a coordination mechanism. It defines WHAT needs to happen at each boundary, not HOW to implement it.

### Why This Matters

Social entrepreneurs need tools that adapt to their specific context. Generic advice doesn't help; relevant examples from similar ventures do. This system encodes expert reasoning (how to categorize ventures) into a structured approach that makes contextual guidance accessible to anyone with internet access.

If successful, this demonstrates a model for AI-augmented expertise: codify how experts think (the taxonomy), use it to filter knowledge (the selection matrix), provide it through natural conversation (the interface). This approach applies beyond social enterprises to any domain where context determines relevance.