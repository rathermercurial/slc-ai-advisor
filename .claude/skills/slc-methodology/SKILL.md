---
name: slc-methodology
description: |
  Social Lean Canvas methodology guidance for development-time assistance.
  Helps Claude Code understand the 11 sections, 3 models, and 8-field Impact Model.
  Use when building features related to canvas content or AI prompts.
---

# SLC Methodology Reference

This skill provides development-time guidance for the Social Lean Canvas methodology. It helps when building prompts, tools, or responses related to canvas content.

## Canvas Structure Overview

The Social Lean Canvas has **11 sections** organized into **3 conceptual models**:

### Standalone Sections (bookends)
| Section | When to Complete | Purpose |
|---------|------------------|---------|
| **Purpose** | First | Why does your venture exist? Core mission. |
| **Key Metrics** | Last | How do you measure success? KPIs. |

### Customer Model (4 sections)
| Section | Question |
|---------|----------|
| Customers | Who are you serving? |
| Jobs To Be Done | What problems do they need solved? |
| Value Proposition | How do you uniquely solve their problems? |
| Solution | What is your product/service? |

### Economic Model (4 sections)
| Section | Question |
|---------|----------|
| Channels | How do you reach customers? |
| Revenue | How do you make money? |
| Costs | What are your major expenses? |
| Advantage | What makes you hard to copy? |

### Impact Model (8-field causality chain)
```
Issue → Participants → Activities → Outputs
      → Short-term Outcomes → Medium-term Outcomes → Long-term Outcomes → Impact
```

## 7 Venture Dimensions (Selection Matrix)

Used for filtering knowledge base examples:

| Dimension | Values |
|-----------|--------|
| Stage | idea, prototype, early-revenue, scaling, mature |
| Impact Area | health, education, environment, poverty, etc. |
| Mechanism | product, service, platform, marketplace |
| Legal Structure | nonprofit, forprofit, hybrid, coop |
| Revenue Source | grants, donations, earned, hybrid |
| Funding Source | bootstrapped, grant-funded, investor-backed |
| Industry | healthcare, edtech, cleantech, fintech, etc. |

## Reference Files

| File | Purpose |
|------|---------|
| [customer-model.md](customer-model.md) | Customer Model guidance |
| [economic-model.md](economic-model.md) | Economic Model guidance |
| [impact-model.md](impact-model.md) | Impact Model 8-field causality chain |

## Code References

- Canvas types: `src/types/canvas.ts`
- Venture dimensions: `src/types/venture.ts`
- System prompts: `worker/agents/prompts.ts`
- Example venture: `knowledge/programs/generic/examples/patagonia/`
