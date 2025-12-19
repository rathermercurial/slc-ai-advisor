---
title: SLC Knowledge Base Metadata Standards
description: Standardized metadata structure and field definitions for all files in the SLC Knowledge Base
last_updated: 2025-07-06
source:
tags:
  canvas-sections: []
  content: [design, admin]
  venture-stage: []
  venture-type: []
---

# SLC Knowledge Base Metadata Standards

This document defines the standardized metadata structure for all files in the SLC Knowledge Base.

## Required Metadata Structure

Every note in the SLC Knowledge Base must include the following frontmatter structure:

```yaml
---
title: [Descriptive Title]
description: [Brief summary of purpose and contents]
last_updated: YYYY-MM-DD
source: [Source URL or reference - can be empty]
tags:
  canvas-sections: []
  content: []
  venture-stage: []
  venture-type: []
---
```

## Metadata Field Definitions

### 1. Title
- **Purpose**: Human-readable title for the content
- **Format**: Clear, descriptive title in sentence case
- **Example**: `title: Customer Discovery Framework`

### 2. Description
- **Purpose**: Brief summary of the note's purpose and contents
- **Format**: One to two sentences describing what the content covers and its intended use
- **Benefits**: 
  - Provides quick context for human readers
  - Helps LLMs understand content relevance for queries
  - Improves searchability and content discovery
- **Example**: `description: Framework for conducting customer interviews to validate problem-solution fit in early-stage ventures`

### 3. Last Updated
- **Purpose**: Track when content was last modified
- **Format**: ISO date format (YYYY-MM-DD)
- **Example**: `last_updated: 2025-07-06`

### 4. Source
- **Purpose**: Reference original source material if applicable
- **Format**: URL, citation, or reference - can be empty
- **Example**: `source: https://example.com/article` or `source:`

### 5. Tags Structure

#### Canvas Sections (canvas-sections)
Tags related to the core Social Lean Canvas framework components:
- Primary tags: `purpose`, `customer-model`, `impact-model`, `economic-model`, `key-metrics`
- Sub-component tags: `customers`, `early-adopters`, `jobs-to-be-done`, etc.
- Use hierarchical tagging (include parent tags)

#### Content (content)
Tags describing the type and format of content:
- `canvas-example`, `case-study`, `template`, `concept`, `lexicon-entry`
- `strategy-model`, `experiment-test`, `resource`, `link`
- `design`, `design-note`, `prompt`, `admin`

#### Venture Stage (venture-stage)
Tags indicating applicable venture development stages:
- `idea-stage`, `early-stage`, `growth-stage`, `scale-stage`
- Can include multiple stages if content applies broadly

#### Venture Type (venture-type)
Tags categorizing venture characteristics across multiple dimensions:
- **Impact Area**: `health`, `education`, `environment`, etc.
- **Impact Mechanism**: `direct-service`, `marketplace`, `advocacy`, etc.
- **Legal Structure**: `for-profit`, `nonprofit`, `b-corp`, etc.
- **Revenue Source**: `service-fees`, `product-sales`, `subscriptions`, etc.
- **Funding Source**: `grants`, `investment`, `revenue`, etc.
- **Industry**: `technology`, `healthcare`, `education`, etc.

## Example Metadata Structures

### Canvas Section Content
```yaml
---
title: Customer Discovery Interview Guide
description: Template and methodology for conducting customer interviews to validate problem-solution fit and gather market insights
last_updated: 2025-07-06
source:
tags:
  canvas-sections: [customer-model, customers, early-adopters]
  content: [template, experiment-test]
  venture-stage: [idea-stage, early-stage]
  venture-type: []
---
```

### Case Study
```yaml
---
title: Patagonia - Environmental Impact Business Model
description: Analysis of how Patagonia integrates environmental mission with profitable business operations and stakeholder engagement
last_updated: 2025-07-06
source: https://patagonia.com/stories
tags:
  canvas-sections: [purpose, customer-model, impact-model, economic-model]
  content: [canvas-example, case-study]
  venture-stage: [scale-stage]
  venture-type: [environment, for-profit, product-sales, apparel]
---
```

### Concept/Framework
```yaml
---
title: Impact Measurement Frameworks
description: Overview of methodologies and tools for measuring and reporting social and environmental impact across venture stages
last_updated: 2025-07-06
source:
tags:
  canvas-sections: [impact-model, key-metrics]
  content: [concept, strategy-model]
  venture-stage: [early-stage, growth-stage, scale-stage]
  venture-type: []
---
```

### Design Documentation
```yaml
---
title: Tag System Design Decisions
description: Documentation of design rationale and implementation decisions for the SLC knowledge base tagging system
last_updated: 2025-07-06
source:
tags:
  canvas-sections: []
  content: [design, admin]
  venture-stage: []
  venture-type: []
---
```

## Implementation Rules

### 1. Description Guidelines
- Keep descriptions concise but informative (1-2 sentences)
- Focus on the content's purpose and practical application
- Use clear, accessible language
- Include context about target audience or use case when relevant

### 2. Hierarchical Tagging
- Always include parent tags when using child tags
- Example: If using `early-adopters`, also include `customers` and `customer-model`

### 3. Tag Consistency
- Use lowercase only
- Use hyphens for multi-word tags
- No spaces or special characters
- Follow existing tag definitions in `/tags/` directory

### 4. Required Categories
- Every note must have at least one tag in the `content` category
- Canvas-related content should have relevant `canvas-sections` tags
- Venture-specific content should include appropriate `venture-type` tags

### 5. Empty Arrays
- Use empty arrays `[]` for categories that don't apply
- This maintains consistent structure and enables filtering

### 6. Multiple Values
- All tag categories support multiple values
- Separate multiple tags with commas in array format
- Example: `canvas-sections: [customer-model, customers, early-adopters]`

## Benefits of This Structure

### For Human Users
- **Quick Context**: Description field provides immediate understanding of content
- **Consistent Structure**: Predictable metadata across all files
- **Clear Categorization**: Easy to understand content type and scope
- **Filtering Capability**: Structured tags enable advanced queries

### For LLM Processing
- **Enhanced Context**: Description field improves content relevance assessment
- **Semantic Understanding**: Clear content categorization and purpose
- **Context Awareness**: Stage and type information for relevant responses
- **Relationship Mapping**: Hierarchical tags show content relationships
- **Query Optimization**: Structured format enables precise content retrieval

## Migration Strategy

1. **Update Templates**: Templates now include description field prompts
2. **New Content**: All new notes will automatically include description field
3. **Existing Content**: Add description fields during regular content reviews
4. **Validation**: Use tag definitions to ensure consistent implementation

## Validation Tools

Reference the comprehensive tag definitions in:
- `/tags/canvas-section/` - All canvas framework tags
- `/tags/content/` - Content type and format tags  
- `/tags/venture-stage-model/` - Development stage tags
- `/tags/venture-type/` - Venture characteristic tags

This standardized metadata structure ensures consistency, supports advanced filtering and search capabilities, and provides clear context for both human users and LLM processing.