---
title: Venture Stage Dimension
last_updated: 2025-12-26
tags:
  - venture/dimension
  - design
aliases:
  - '#stage'
  - '#venture/stage'
---

# Venture Stage Dimension

> ⚡ **This is a Venture Dimension**
>
> Stage is currently the **only** venture dimension. Unlike venture properties (which accept open-ended tag values), dimensions have:
>
> | Characteristic | Stage Dimension |
> |----------------|------------------|
> | Valid values | Exactly 4: idea, early, growth, scale |
> | Mutual exclusivity | Yes - one stage at a time |
> | Assessment criteria | Defined transition criteria below |
> | Non-canonical values | Not allowed |
>
> See [Venture Properties](../readme.md) for the full properties vs. dimensions ontology.

## Valid Stage Values

| Tag | Aliases | Description |
|-----|---------|-------------|
| `idea-stage` | `stage/idea` | Concept development and problem validation |
| `early-stage` | `stage/early` | Solution validation and initial operations |
| `growth-stage` | `stage/growth` | Scaling operations and expanding impact |
| `scale-stage` | `stage/scale` | Systemic impact and sustainable operations |

A venture is in **exactly one stage** at any time. These are the only valid values.

---

## Framework Overview

The Social Lean Canvas approach recognizes four distinct venture development stages, each requiring different strategic focus, resource allocation, and measurement approaches.

### Stage Progression
```
Idea Stage → Early Stage → Growth Stage → Scale Stage
```

Each stage represents a fundamental shift in venture priorities, capabilities, and operating context.

---

## Stage Definitions

### Idea Stage
**Focus**: Concept development and problem validation
- **Primary Goal**: Validate that a significant problem exists
- **Key Activities**: Problem research, stakeholder discovery, concept testing
- **Canvas Priority**: Purpose and Issue definition
- **Success Metrics**: Problem validation, stakeholder engagement
- **Duration**: 3-12 months typically
- **Resources**: Minimal, primarily time and research

### Early Stage  
**Focus**: Solution validation and initial operations
- **Primary Goal**: Prove the solution works and creates value
- **Key Activities**: Solution development, pilot programs, early customer acquisition
- **Canvas Priority**: Customer Model and basic Impact Model
- **Success Metrics**: Solution effectiveness, early traction indicators
- **Duration**: 6-24 months typically
- **Resources**: Seed funding, small team, basic infrastructure

### Growth Stage
**Focus**: Scaling operations and expanding impact
- **Primary Goal**: Achieve sustainable growth and proven impact
- **Key Activities**: Process optimization, team building, market expansion
- **Canvas Priority**: Economic Model refinement and impact measurement
- **Success Metrics**: Growth rates, operational efficiency, impact evidence
- **Duration**: 1-3 years typically
- **Resources**: Growth capital, established team, systematic operations

### Scale Stage
**Focus**: Systemic impact and sustainable operations
- **Primary Goal**: Achieve widespread impact and long-term sustainability
- **Key Activities**: Market leadership, systemic influence, knowledge sharing
- **Canvas Priority**: Full canvas optimization and ecosystem development
- **Success Metrics**: Market penetration, systemic change indicators, financial sustainability
- **Duration**: Ongoing
- **Resources**: Significant capital, mature organization, established partnerships

---

## Stage Transition Criteria

These criteria define when a venture has completed one stage and is ready to progress. They serve as the assessment framework for determining stage.

### Idea → Early Stage
✅ Problem clearly defined and validated  
✅ Target customers identified and engaged  
✅ Initial solution concept developed  
✅ Theory of change articulated  
✅ Basic team and resources secured

### Early → Growth Stage
✅ Solution effectiveness demonstrated  
✅ Product-market fit achieved  
✅ Initial impact evidence collected  
✅ Revenue model validated  
✅ Operational processes established

### Growth → Scale Stage
✅ Sustainable growth demonstrated  
✅ Impact at scale proven  
✅ Financial sustainability achieved  
✅ Market position established  
✅ Organizational maturity reached

---

## Stage Characteristics

### Problem Understanding
| Stage | Characteristic |
|-------|----------------|
| Idea | Problem hypothesis and validation |
| Early | Problem confirmation and solution fit |
| Growth | Problem solution at scale |
| Scale | Problem addressed systemically |

### Customer Development
| Stage | Characteristic |
|-------|----------------|
| Idea | Customer discovery and validation |
| Early | Early adopter engagement |
| Growth | Mainstream market penetration |
| Scale | Market leadership and influence |

### Impact Development
| Stage | Characteristic |
|-------|----------------|
| Idea | Theory of change development |
| Early | Initial impact evidence |
| Growth | Proven impact measurement |
| Scale | Systemic impact demonstration |

### Economic Model Evolution
| Stage | Characteristic |
|-------|----------------|
| Idea | Revenue model hypothesis |
| Early | Initial revenue validation |
| Growth | Sustainable business model |
| Scale | Optimized and diversified revenue |

---

## Canvas Evolution Across Stages

### Canvas Completeness by Stage
- **Idea**: Purpose, Issue, basic Customer segments
- **Early**: + Solution, Activities, early Metrics
- **Growth**: + Revenue model, Impact measurement, Channels
- **Scale**: Complete canvas with optimization and ecosystem connections

### Stage-Specific Canvas Focus

**Idea Stage Priority:**
1. Purpose (why does this matter?)
2. Issue (what problem are we solving?)
3. Participants (who is affected?)
4. Customers (who will we serve?)

**Early Stage Priority:**
1. Solution (how do we solve it?)
2. Activities (what do we do?)
3. Early Adopters (who adopts first?)
4. Outputs (what do we produce?)

**Growth Stage Priority:**
1. Channels (how do we reach more people?)
2. Revenue (how do we sustain growth?)
3. Outcomes (what change do we create?)
4. Key Metrics (how do we measure success?)

**Scale Stage Priority:**
1. Advantage (what makes us unique?)
2. Impact (what systemic change do we create?)
3. Financial Model (how do we optimize resources?)
4. Ecosystem connections (how do we influence the field?)

---

## Common Transition Challenges

### Idea to Early Transition
- **Resource Gap**: Moving from concept to implementation
- **Team Building**: Assembling initial capabilities
- **Solution Development**: Translating ideas into reality
- **Stakeholder Management**: Engaging early supporters

### Early to Growth Transition
- **Scaling Operations**: Moving beyond pilot programs
- **Financial Sustainability**: Achieving consistent revenue
- **Team Expansion**: Building organizational capabilities
- **Impact Measurement**: Proving effectiveness at scale

### Growth to Scale Transition
- **Market Leadership**: Establishing dominant position
- **Systemic Influence**: Moving beyond direct impact
- **Organizational Maturity**: Developing institutional capabilities
- **Knowledge Transfer**: Sharing learnings with the field

---

## Tagging Usage

### For Content Creators
- Use stage tags to indicate applicable venture phases
- A single stage tag = content specific to that stage
- Multiple stage tags = content spanning stages (rare)
- Address transition challenges explicitly

### For Vectorize Indexing
Stage can be stored as a flat tag without a dedicated metadata field:
```yaml
tags:
  - growth-stage           # Valid
  - stage/growth           # Also valid (hierarchical form)
```

Both forms are equivalent for retrieval. The indexing script should normalize to the canonical form (`growth-stage`).

### For LLM Processing
- Stage tags enable developmentally appropriate responses
- Stage progression informs sequencing of guidance
- Transition criteria guide support recommendations

---

## Usage Criteria

Apply this tag to content that:
- Explains the venture stage model framework
- Discusses stage transitions and characteristics
- Provides cross-stage analysis and guidance
- Analyzes venture evolution patterns

### Always Include When
- Content covers multiple venture stages or stage transitions
- Stage model framework and methodology
- Cross-stage comparison and analysis

### Never Include When
- Content is specific to only one stage (use specific stage tag instead)
- General business development content not tied to stage model
- Content about venture properties rather than stages

### Required Combinations
- Often combined with specific stage tags when content spans multiple stages
- May include canvas section tags when discussing stage-specific canvas approaches
