# Knowledge Base Restructuring Guide (Task A2)

## Objective

Restructure `knowledge/tags/` to clearly separate **sections** (the 11 numbered canvas areas) from **models** (conceptual groupings). This prevents confusion for both humans and AI, and enables precise retrieval filtering.

---

## Current Problems

### 1. Inverted Hierarchy
Models contain sections, but sections should be the primary organizational unit:
```
# Current (wrong)
canvas-sections/
├── customer-model/      # Model at top level
│   ├── customers/       # Section nested under model
│   └── solution/
```

### 2. Sub-concepts Mixed with Sections
Jobs to be Done, Early Adopters, and Existing Alternatives are treated as section-level entities, but they're actually sub-concepts within the Customer Model:
```
# Current (confusing)
customer-model/
├── customers/
├── jobs-to-be-done/        # Not a section!
├── existing-alternatives/  # Not a section!
└── solution/
```

### 3. No Curriculum Numbering
Sections have no numbers, making it hard to track curriculum progress or filter by "sections 1-5."

### 4. Naming Inconsistencies
- "Customers" vs "Customer Segments"
- "Costs" vs "Cost Structure"
- "Advantage" vs "Unfair Advantage"

### 5. Deep Nesting
Some paths are 4+ levels deep, making tags unwieldy:
```
canvas-sections/customer-model/customers/early-adopters/early-adopters.md
```

---

## New Structure

```
knowledge/tags/
│
├── canvas-sections/                    # THE 11 SECTIONS (numbered)
│   ├── canvas-sections.md              # Overview with numbered list
│   ├── 01-purpose/
│   │   └── purpose.md
│   ├── 02-customer-segments/
│   │   └── customer-segments.md
│   ├── 03-problem/
│   │   └── problem.md
│   ├── 04-unique-value-proposition/
│   │   └── unique-value-proposition.md
│   ├── 05-solution/
│   │   └── solution.md
│   ├── 06-channels/
│   │   └── channels.md
│   ├── 07-revenue/
│   │   └── revenue.md
│   ├── 08-cost-structure/
│   │   └── cost-structure.md
│   ├── 09-key-metrics/
│   │   └── key-metrics.md
│   ├── 10-unfair-advantage/
│   │   └── unfair-advantage.md
│   └── 11-impact/
│       └── impact.md                   # Links to impact-model for details
│
├── venture-models/                     # CONCEPTUAL GROUPINGS
│   ├── venture-models.md               # Overview explaining models vs sections
│   │
│   ├── customer-model/
│   │   ├── customer-model.md           # Explains model, references sections 2-5
│   │   ├── jobs-to-be-done/            # Sub-concept (NOT a section)
│   │   │   └── jobs-to-be-done.md
│   │   ├── existing-alternatives/      # Sub-concept
│   │   │   └── existing-alternatives.md
│   │   └── customer-types/
│   │       ├── customer-types.md
│   │       └── early-adopters/
│   │           └── early-adopters.md
│   │
│   ├── economic-model/
│   │   ├── economic-model.md           # References sections 6-8, 10
│   │   └── financial-model/            # Sub-concept
│   │       └── financial-model.md
│   │
│   └── impact-model/                   # = Section 11 expanded
│       ├── impact-model.md             # Overview of causality chain
│       ├── issue/
│       │   └── issue.md
│       ├── participants/
│       │   └── participants.md
│       ├── activities/
│       │   └── activities.md
│       ├── outputs/
│       │   └── outputs.md
│       ├── short-term-outcomes/
│       │   └── short-term-outcomes.md
│       ├── medium-term-outcomes/
│       │   └── medium-term-outcomes.md
│       ├── long-term-outcomes/
│       │   └── long-term-outcomes.md
│       └── impact/
│           └── impact.md               # Same content as section 11
│
└── ... (other tag categories unchanged: venture-type, content, etc.)
```

---

## Migration Steps

### Step 1: Create New Directory Structure

```bash
# Create canvas-sections with numbered folders
mkdir -p knowledge/tags/canvas-sections/{01-purpose,02-customer-segments,03-problem,04-unique-value-proposition,05-solution,06-channels,07-revenue,08-cost-structure,09-key-metrics,10-unfair-advantage,11-impact}

# Create venture-models structure
mkdir -p knowledge/tags/venture-models/customer-model/{jobs-to-be-done,existing-alternatives,customer-types/early-adopters}
mkdir -p knowledge/tags/venture-models/economic-model/financial-model
mkdir -p knowledge/tags/venture-models/impact-model/{issue,participants,activities,outputs,short-term-outcomes,medium-term-outcomes,long-term-outcomes,impact}
```

### Step 2: Migrate Section Files

| From | To |
|------|-----|
| `canvas-sections/purpose/` | `canvas-sections/01-purpose/` |
| `canvas-sections/customer-model/customers/` | `canvas-sections/02-customer-segments/` |
| (new) | `canvas-sections/03-problem/` |
| `canvas-sections/customer-model/unique-value-proposition/` | `canvas-sections/04-unique-value-proposition/` |
| `canvas-sections/customer-model/solution/` | `canvas-sections/05-solution/` |
| `canvas-sections/economic-model/channels/` | `canvas-sections/06-channels/` |
| `canvas-sections/economic-model/revenue/` | `canvas-sections/07-revenue/` |
| `canvas-sections/economic-model/costs/` | `canvas-sections/08-cost-structure/` |
| `canvas-sections/key-metrics/` | `canvas-sections/09-key-metrics/` |
| `canvas-sections/economic-model/advantage/` | `canvas-sections/10-unfair-advantage/` |
| `canvas-sections/impact-model/impact/` | `canvas-sections/11-impact/` |

### Step 3: Migrate Model Files

| From | To |
|------|-----|
| `canvas-sections/customer-model/` | `venture-models/customer-model/` |
| `canvas-sections/customer-model/jobs-to-be-done/` | `venture-models/customer-model/jobs-to-be-done/` |
| `canvas-sections/customer-model/customers/early-adopters/` | `venture-models/customer-model/customer-types/early-adopters/` |
| `canvas-sections/economic-model/` | `venture-models/economic-model/` |
| `canvas-sections/economic-model/financial-model/` | `venture-models/economic-model/financial-model/` |
| `canvas-sections/impact-model/` (except /impact/) | `venture-models/impact-model/` |

### Step 4: Create New Problem Section

The "Problem" section (3) doesn't exist in current structure. Create:

```markdown
---
title: Problem Tag Definition
last_updated: 2025-12-19
tags: [design, admin]
---

# problem

## Definition
The `problem` tag identifies content about the Problem section (Section 3) of the Social Lean Canvas - the specific pain point, obstacle, or challenge that customers face which the venture's solution addresses.

## Distinction from Jobs to be Done
- **Problem**: The obstacle or pain point (e.g., "No car wash facilities at apartment")
- **Jobs to be Done**: The task the customer wants to accomplish (e.g., "Wash my car")

The Problem prevents customers from completing their Job to be Done. The Solution removes this obstacle.

## Usage Criteria
Apply this tag to content that:
- Defines or validates customer problems
- Discusses problem-solution fit
- Analyzes problem severity and urgency
- Provides frameworks for problem identification

## Section Details
- **Number:** 3
- **Model:** Customer Model
- **Curriculum Position:** After Customer Segments (2), before UVP (4)

## Related Tags
- Parent model: `customer-model`
- Related section: `05-solution` (the answer to the problem)
- Related concept: `jobs-to-be-done` (what customer wants to achieve)
```

### Step 5: Update Overview Files

**canvas-sections/canvas-sections.md:**
```markdown
---
title: Canvas Sections Overview
last_updated: 2025-12-19
---

# Canvas Sections

The Social Lean Canvas has **11 sections** worked through in sequence. Section numbers track curriculum progress.

## The 11 Sections

| # | Section | Model | Description |
|---|---------|-------|-------------|
| 1 | [Purpose](01-purpose/purpose.md) | — | Why the venture exists |
| 2 | [Customer Segments](02-customer-segments/customer-segments.md) | Customer | Who the venture serves |
| 3 | [Problem](03-problem/problem.md) | Customer | Pain point customers face |
| 4 | [Unique Value Proposition](04-unique-value-proposition/unique-value-proposition.md) | Customer | Why customers choose this |
| 5 | [Solution](05-solution/solution.md) | Customer | What the venture provides |
| 6 | [Channels](06-channels/channels.md) | Economic | How customers are reached |
| 7 | [Revenue](07-revenue/revenue.md) | Economic | How income is generated |
| 8 | [Cost Structure](08-cost-structure/cost-structure.md) | Economic | Major expenses |
| 9 | [Key Metrics](09-key-metrics/key-metrics.md) | — | How success is measured |
| 10 | [Unfair Advantage](10-unfair-advantage/unfair-advantage.md) | Economic | What can't be copied |
| 11 | [Impact](11-impact/impact.md) | Impact | Long-term social/environmental change |

## Sections vs Models

**Sections** are the 11 numbered areas users complete sequentially. They are the primary organizational unit.

**Models** are conceptual groupings that help understand how sections relate. See [Venture Models](../venture-models/venture-models.md).

## Tagging Rules

1. Content about a specific section should use that section's tag (e.g., `03-problem`)
2. Content spanning multiple sections in a model can also use the model tag
3. Section tags can be filtered by number for curriculum-based queries
```

**venture-models/venture-models.md:**
```markdown
---
title: Venture Models Overview
last_updated: 2025-12-19
---

# Venture Models

Models are **conceptual groupings** that organize sections and related concepts into domains useful for understanding the venture holistically.

## Key Distinction

- **Sections**: The 11 numbered areas users complete (see [Canvas Sections](../canvas-sections/canvas-sections.md))
- **Models**: Lenses for understanding how sections relate

Users progress through **sections** sequentially. Models help zoom out and think about multiple sections together.

## The 3 Models

### [Customer Model](customer-model/customer-model.md)
How the venture creates value for customers.

**Sections:** 2 (Customer Segments), 3 (Problem), 4 (UVP), 5 (Solution)

**Sub-concepts:**
- [Jobs to be Done](customer-model/jobs-to-be-done/jobs-to-be-done.md) - What customers want to accomplish
- [Existing Alternatives](customer-model/existing-alternatives/existing-alternatives.md) - Current solutions customers use
- [Customer Types](customer-model/customer-types/) - Including Early Adopters

### [Economic Model](economic-model/economic-model.md)
How customer value translates to financial sustainability.

**Sections:** 6 (Channels), 7 (Revenue), 8 (Cost Structure), 10 (Unfair Advantage)

**Sub-concepts:**
- [Financial Model](economic-model/financial-model/financial-model.md) - Projections and unit economics

### [Impact Model](impact-model/impact-model.md)
How the venture creates measurable social/environmental change.

**Section:** 11 (Impact)

The Impact Model is unique - it maps 1:1 with Section 11 and contains a complete causality chain:

Issue → Participants → Activities → Outputs → Short-term Outcomes → Medium-term Outcomes → Long-term Outcomes → **Impact**

The final "Impact" field IS Section 11's content.

## Tagging Rules

1. Model tags (`customer-model`, `economic-model`, `impact-model`) are for content spanning multiple sections within that model
2. Sub-concept tags (e.g., `jobs-to-be-done`) are for content about that specific concept
3. Impact Model field tags (e.g., `activities`, `outputs`) are for content about those specific fields
```

### Step 6: Update Each Section File

Each section definition file should include:
- Section number
- Parent model reference  
- Curriculum position
- Clear distinction from similar concepts

Example update for `02-customer-segments/customer-segments.md`:
```markdown
## Section Details
- **Number:** 2
- **Model:** Customer Model  
- **Curriculum Position:** After Purpose (1), before Problem (3)

## Distinction from Related Concepts
- **Customer Segments**: WHO the venture serves
- **Early Adopters**: A subset - first customers who will try the solution
- **Participants** (Impact Model): Who experiences the social issue being addressed

Customer Segments is about the business relationship; Participants is about impact.
```

### Step 7: Update References Throughout

Search and replace outdated tag paths:
- `canvas-sections/customer-model/customers` → `canvas-sections/02-customer-segments`
- `canvas-sections/economic-model/costs` → `canvas-sections/08-cost-structure`
- `canvas-sections/economic-model/advantage` → `canvas-sections/10-unfair-advantage`
- `canvas-sections/impact-model/` → `venture-models/impact-model/`

### Step 8: Delete Old Structure

After migration is complete and verified:
```bash
# Remove old nested model directories from canvas-sections
rm -rf knowledge/tags/canvas-sections/customer-model
rm -rf knowledge/tags/canvas-sections/economic-model
rm -rf knowledge/tags/canvas-sections/impact-model
```

---

## Validation Checklist

- [ ] All 11 section folders exist with correct numbering
- [ ] Each section has a definition file with section number and model reference
- [ ] Problem section (03) created from scratch
- [ ] All models moved to `venture-models/`
- [ ] Sub-concepts (JTBD, Early Adopters, etc.) under correct model
- [ ] Impact Model fields preserved under `venture-models/impact-model/`
- [ ] Overview files updated with correct links
- [ ] No broken internal references
- [ ] Venture examples still parse (frontmatter tags resolve)

---

## Impact on Retrieval

After restructuring, Vectorize metadata can include:

```json
{
  "canvas_section": "03-problem",
  "section_number": 3,
  "venture_model": "customer",
  "content_type": "methodology"
}
```

This enables queries like:
- "All content for sections 1-5" (curriculum-based)
- "All Customer Model content" (model-based)
- "Problem section methodology" (specific section + content type)
- "Impact Model activities" (Impact Model field-specific)
