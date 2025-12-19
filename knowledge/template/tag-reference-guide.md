---
title: Tag Reference Quick Guide
description: Quick reference guide for manual tag entry when not using the Templater template, including all tag categories and examples
last_updated: 2025-07-06
source:
tags:
  canvas-sections: []
  content: [design, admin]
  venture-stage: []
  venture-type: []
---

# Tag Reference Quick Guide

Quick reference for manual tag entry when not using the Templater template.

## Canvas-Sections Tags

### Purpose
```yaml
canvas-sections: [purpose]
```

### Customer Model
```yaml
# General customer model
canvas-sections: [customer-model]

# Specific components (auto-include parents)
canvas-sections: [customer-model, customers]
canvas-sections: [customer-model, customers, early-adopters]
canvas-sections: [customer-model, jobs-to-be-done]
canvas-sections: [customer-model, jobs-to-be-done, existing-alternatives]
canvas-sections: [customer-model, unique-value-proposition]
canvas-sections: [customer-model, solution]
```

### Impact Model
```yaml
# General impact model
canvas-sections: [impact-model]

# Specific components (auto-include parents)
canvas-sections: [impact-model, issue]
canvas-sections: [impact-model, participants]
canvas-sections: [impact-model, activities]
canvas-sections: [impact-model, outputs]
canvas-sections: [impact-model, short-term-outcomes]
canvas-sections: [impact-model, medium-term-outcomes]
canvas-sections: [impact-model, long-term-outcomes]
canvas-sections: [impact-model, impact]
```

### Economic Model
```yaml
# General economic model
canvas-sections: [economic-model]

# Specific components (auto-include parents)
canvas-sections: [economic-model, channels]
canvas-sections: [economic-model, revenue]
canvas-sections: [economic-model, costs]
canvas-sections: [economic-model, advantage]
canvas-sections: [economic-model, financial-model]
```

### Key Metrics
```yaml
canvas-sections: [key-metrics]
```

## Content Tags

### Examples & Studies
- `canvas-example` - Real venture examples
- `case-study` - In-depth analysis

### Frameworks & Tools
- `template` - Reusable formats
- `concept` - Theoretical frameworks
- `lexicon-entry` - Definitions
- `strategy-model` - Strategic frameworks
- `experiment-test` - Validation methods

### Resources
- `resource` - Additional materials
- `link` - External references

### Administrative
- `design` - Design decisions
- `admin` - Administrative content

## Venture-Stage Tags
- `idea-stage` - Early concept development
- `early-stage` - Initial validation and development
- `growth-stage` - Scaling and expansion
- `scale-stage` - Mature operations

## Venture-Type Tags

### Impact Area
```yaml
venture-type: [health, education, environment, poverty, financial-inclusion, agriculture, energy, water, housing, employment, gender-equality, climate-change, biodiversity, food-security, mental-health, aging, disability, refugees, justice, governance]
```

### Legal Structure
```yaml
venture-type: [for-profit, nonprofit, b-corp, cooperative, social-enterprise, government, hybrid, cic, foundation, charity, llc]
```

### Revenue Source
```yaml
venture-type: [service-fees, product-sales, subscriptions, licensing, advertising, marketplace-fees, grants, donations, membership, consulting, training]
```

### Funding Source
```yaml
venture-type: [grants, impact-investment, traditional-investment, revenue, donations, crowdfunding, government-funding]
```

### Impact Mechanism
```yaml
venture-type: [direct-service, marketplace, platform, advocacy, research, education, technology, infrastructure, policy, awareness]
```

### Industry
```yaml
venture-type: [technology, healthcare, education, agriculture, finance, energy, manufacturing, retail, consulting, media, transportation, real-estate, food, textiles, tourism, construction, telecommunications]
```

## Example Combinations

### Case Study Example
```yaml
---
title: Social Enterprise Healthcare Example
description: Case study analyzing a healthcare social enterprise's business model and impact measurement approach
last_updated: 2025-07-06
source: https://example.com/case-study
tags:
  canvas-sections: [purpose, customer-model, impact-model, economic-model]
  content: [canvas-example, case-study]
  venture-stage: [scale-stage]
  venture-type: [health, nonprofit, service-fees, grants]
---
```

### Framework/Concept Example
```yaml
---
title: Impact Logic Model Framework
description: Framework for designing and mapping activities to outputs and outcomes in impact-driven ventures
last_updated: 2025-07-06
source:
tags:
  canvas-sections: [impact-model, activities, outputs]
  content: [concept, strategy-model]
  venture-stage: [idea-stage, early-stage]
  venture-type: []
---
```

### Template Example
```yaml
---
title: Customer Interview Template
description: Structured template for conducting customer discovery interviews with early adopters and target customers
last_updated: 2025-07-06
source:
tags:
  canvas-sections: [customer-model, customers, early-adopters]
  content: [template, experiment-test]
  venture-stage: [idea-stage]
  venture-type: []
---
```

### Lexicon Entry Example
```yaml
---
title: Theory of Change Definition
description: Definition and explanation of Theory of Change methodology in the context of impact venture planning
last_updated: 2025-07-06
source:
tags:
  canvas-sections: [impact-model]
  content: [lexicon-entry, concept]
  venture-stage: [idea-stage, early-stage, growth-stage]
  venture-type: []
---
```

## Remember:
- Always include the `description` field with a brief summary
- Always include parent tags in hierarchies
- Use empty arrays `[]` for non-applicable categories
- Multiple tags in each category are supported
- Check tag definition files for specific usage rules