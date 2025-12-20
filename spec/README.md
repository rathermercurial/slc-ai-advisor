# Feature Specifications

This directory contains specifications for features developed using the spec-driven workflow.

## Current Specifications

### [SLC AI Advisor MVP](slc-ai-advisor-mvp/)

A conversational AI advisor for social entrepreneurs using the Social Lean Canvas methodology. The system provides methodology guidance and contextual example retrieval using a Selection Matrix - multi-dimensional filtering by venture characteristics before semantic search.

**Core Concept:** The Social Lean Canvas has **11 sections** worked through sequentially, organized into **3 models**:

| # | Section | Model |
|---|---------|-------|
| 1 | Purpose | — |
| 2 | Customer Segments | Customer |
| 3 | Problem | Customer |
| 4 | Unique Value Proposition | Customer |
| 5 | Solution | Customer |
| 6 | Channels | Economic |
| 7 | Revenue | Economic |
| 8 | Cost Structure | Economic |
| 9 | Key Metrics | — |
| 10 | Unfair Advantage | Economic |
| 11 | Impact | Impact |

**Key Architecture Decisions:**
- Sections 1-10 store simple string content
- Section 11 (Impact) contains nested Impact Model (8-field causality chain)
- Models are conceptual groupings for retrieval, not storage
- Cloudflare Workers + Durable Objects + Vectorize stack

**Milestones:**
| Milestone | Target | Success Criteria |
|-----------|--------|------------------|
| Demo | ~1 week | Chat + RAG works. Methodology questions answered from KB. |
| MVP | ~2 weeks | Full Selection Matrix, canvas persistence, dimension inference. |
| Integration | Future | Abstracted for any frontend. |

**Spec Files:**
- [`requirements.md`](slc-ai-advisor-mvp/requirements.md) - Problem statement, canvas structure, functional requirements, success criteria
- [`design.md`](slc-ai-advisor-mvp/design.md) - Architecture, data models, SQLite schema, interfaces
- [`tasks.md`](slc-ai-advisor-mvp/tasks.md) - Implementation tasks organized by milestone (Demo-critical vs MVP)
- [`TRANSITION-GUIDE.md`](slc-ai-advisor-mvp/TRANSITION-GUIDE.md) - Git strategy and verification checklist for spec corrections
- [`A2-knowledge-base-restructure.md`](slc-ai-advisor-mvp/A2-knowledge-base-restructure.md) - Detailed guide for Task A2 (critical blocker)

---

## Structure

Each feature has its own subdirectory:

```
spec/
├── README.md             # This file
├── {feature-name}/
│   ├── requirements.md   # What to build
│   ├── design.md         # How to build it
│   ├── tasks.md          # Implementation steps
│   └── *.md              # Additional guides as needed
```

## Workflow

1. **Requirements** - Define scope, success criteria, constraints
2. **Design** - Architecture, components, interfaces
3. **Tasks** - Ordered implementation steps
4. **Implementation** - Execute with tracking

Each phase requires approval before proceeding to the next.

## Templates

Templates are available in `.claude/skills/spec-driven/TEMPLATES/`.
