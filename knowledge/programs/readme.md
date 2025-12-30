# Programs

The Social Lean Canvas (SLC) methodology is delivered through learning programs. Each program provides structured educational content tailored to specific entrepreneurial contexts. It is designed to guide a user through a set of simple steps to develop an idea into a business model that can succeed. It is for social entreprenerus, people who want to build a venture that incorporates an Impact component with a Business model.

## Program Overview

| Program                    | Files | Target Audience                         | Structure                 | Modules |
| -------------------------- | ----- | --------------------------------------- | ------------------------- | ------- |
| **Generic/Core**           | ~100  | Broad social entrepreneur focus         | Two-part program          | 2.0-5.3 |
| **P2P** (Pivot-to-Purpose) | ~36   | Solo/small team purpose-driven ventures | Single continuous program | 2.0-5.8 |

### Generic/Core Program

The Core program serves a broad social entrepreneur audience and is structured as **two distinct sub-programs**:

1. **The Social Lean Canvas** (Modules 2.0-3.2)

   - Introduces business model fundamentals
   - Guides users through completing a first draft of their social lean canvas
     - Purpose
     - Customers
     - JTBD
     - UVP
     - Solution
     - Impact
     - Channels
     - Revenue
     - Costs
     - Advantage
     - Key Metrics

2. **Build** (Modules 4.0-5.3) May be connected to the Social Lean Canvas program as a single program or sold separately as a follow-up program
   - Systematic business model improvement - works though improving the first draft canvas working through Customer model, Impact Model and Economic Model
   - Strategy development and validation planning -
     - Validation planning - works through creating validation plans for Customer model, Impact model and Economic model
     - Strategy development - builds a strategy to validate and build the venture

### P2P Program

The P2P program targets **solo founders and small teams** building purpose-aligned ventures. It runs as a **single continuous program** (Modules 2.0-5.8) and uses a distinctive pedagogical approach:

**Content Structure:**

- **Follows the Generic/Core program structure**: It follows the core program using the same content but contextualizes this content for the P2P audience
- **Sandwich approach**: Content follows this format - P2P introduction → Core content → P2P commentary
- **Selective replacement**: Some sections (intros, conclusions) use P2P-specific content instead of core
- **Content inheritance**: Core content and resources (like venture examples) are incorporated where relevant
- **Linked content**: Core content is referenced in the P2P content but is found in the core content directory

This approach contextualizes the universal SLC methodology for the specific needs of solo/small-team entrepreneurs.

## Directory Structure

```
programs/
├── generic/                  # ~100 files
│   ├── content/              # Core educational modules
│   │   ├── 2.0 intro/
│   │   ├── 3.0 business-model-design/
│   │   │   ├── 3.1 understanding-business-model-design/
│   │   │   └── 3.2 fill-in-your-canvas/
│   │   ├── 4.0 improving-your-business-model/
│   │   └── 5.0 developing-your-strategy/
│   │
│   └── examples/             # Generic venture example library
│       └── [venture-folders]/
│
└── p2p/                      # ~36 files
    ├── content/              # P2P program modules
    │   ├── 2.0 intro/       # P2P-specific introduction
    │   ├── 3.0 business-model-design/
    │   │   ├── 3.1 understanding-business-model-design/
    │   │   └── 3.2 fill-in-your-canvas/
    │   ├── 4.0 improving-your-business-model/
    │   └── 5.0 strategy/
    │
    └── examples/             # P2P venture example library
        └── [venture-folders]/
```

## Venture Example Libraries

Each program includes a curated library of real-world venture examples demonstrating how to apply the SLC framework.

**Structure:**

- Each venture has its own folder which contains 3 files:
  - The venture's completed **social lean canvas**
  - The venture's completed **impact model**
  - A report explaining the venture and it's canvas and impact models
- Examples are tagged with relevant venture stage and type information
- Library index file links to all examples

**Purpose:**

- To provide real examples that are specific to a particular venture type
- Demonstrate practical application of theoretical concepts
- Provide inspiration for the development of venture's business model

**Location:**

- Generic examples: `generic/examples/`
- P2P examples: `p2p/examples/`

## Content Format

All content files use markdown with YAML frontmatter for metadata and filtering:

```yaml
---
title: "Module Title"
tags:
  - program:generic
  - canvas-sections: [purpose]
  - content: [program-content]
---
# Module Content

[Script content...]
```

## Using This README

**For the AI Advisor:**

- Understand program structure to navigate to correct content
- Filter content by program namespace when serving user requests
- Access appropriate venture examples for user context

**For Human Maintainers:**

- Understand how programs relate to each other
- Know where to add/modify content
- Manage program-specific resources

## See Also

- [Tags](../tags/) - Content tagging system for filtering
