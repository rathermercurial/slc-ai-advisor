# SLC Knowledge Base

This folder contains the organized knowledge base for the Social Lean Canvas AI advisor, structured to enable intelligent filtering and retrieval.

**Current state:** 291 markdown files ready for indexing.

## Content Overview

| Directory | Files | Purpose |
|-----------|-------|---------|
| `programs/` | 136 | Learning content (video scripts, guides, venture examples) |
| `tags/` | 155 | Concept definitions and dimension taxonomies |
| `attachments/` | 7 | PNG diagrams referenced by content |

## Hierarchical Structure

The knowledge base follows a program-centric hierarchy designed for both human navigation and LLM retrieval:

### Programs (`/programs/`)

Learning journeys that become Vectorize namespaces:

- **generic/** - Core SLC methodology (default for all users)
  - `content/` - Video scripts organized by module (0.0 through 5.0)
  - `examples/` - Venture examples (Patagonia, Toast Ale, Too Good To Go, etc.)
- **p2p/** - Pivot-to-Purpose program (extends generic)
  - `content/` - P2P-specific learning modules
  - `examples/` - P2P venture examples (Ridwell, Ness Labs, Plausible, etc.)

### Tags (`/tags/`)

Concept definitions that become Vectorize metadata:

- **canvas/** - Section concepts (purpose, customers, jobsToBeDone, valueProposition, solution, channels, revenue, costs, keyMetrics, advantage, impact)
- **model/** - Model groupings (customer, economic, impact)
- **venture/** - Venture properties and dimensions for the Selection Matrix
  - `stage/` - ⚡ **Dimension** - Venture stages (idea, early, growth, scale) - strictly validated
  - `impact-area/` - SDG alignment and IRIS+ themes
  - `industry/` - Sector classification
  - `impact-mechanism/`, `legal-structure/`, `revenue-source/`, `funding-source/`

See [tags/venture/readme.md](tags/venture/readme.md) for the properties vs. dimensions distinction.

### Attachments (`/attachments/`)

Images and diagrams referenced by content files.

## Content Format

Every content file has YAML frontmatter for Vectorize indexing:

```yaml
---
title: "Patagonia - Social Lean Canvas"
last_updated: 2025-07-02
tags:
  # Content type
  - canvas-example
  - case-study
  # Canvas sections covered
  - customer-model
  - economic-model
  - impact-model
  # Venture dimension (exactly one)
  - scale-stage
  # Venture properties (multiple allowed)
  - industry/apparel
  - legal-structure/trust
  - impact-area/sdg-12-responsible-consumption-and-production
  - revenue-source/product-sales
---
```

See [programs/generic/examples/patagonia/patagonia-slc.md](programs/generic/examples/patagonia/patagonia-slc.md) for a complete example.

## Design Benefits

### For Human Navigation

- **Logical Hierarchy**: Programs group related content by learning journey
- **Clear Organization**: Examples live with their program context
- **Consistent Naming**: Predictable file locations based on content type

### For LLM/RAG Processing

- **Namespace Filtering**: Programs enable coarse filtering before semantic search
- **Dimensional Metadata**: Tags enable fine-grained Selection Matrix filtering
- **Structured Frontmatter**: Every file has machine-readable metadata

## Usage Guidelines

1. **Adding Content**: Place new files in the appropriate program and directory
2. **Tagging**: Include all relevant tags in frontmatter (see [tags/readme.md](tags/readme.md))
3. **Linking**: Use relative paths within the knowledge base
4. **Consistency**: Follow established naming conventions (kebab-case, lowercase)

## See Also

- [tasks.md](../spec/slc-ai-advisor-mvp/tasks.md) - A1-A7 task details
- [design.md](../spec/slc-ai-advisor-mvp/design.md) - Vectorize metadata mapping
- [tags/readme.md](tags/readme.md) - Tag system documentation
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Track A workflow
