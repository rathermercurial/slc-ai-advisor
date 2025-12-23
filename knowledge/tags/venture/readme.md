---
title: Venture Type Tags
last_updated: 2025-06-30
source:
tags: [design, admin]
---

# Venture Type Tags

This section defines all tags related to venture typology and classification. These tags enable detailed categorization of social enterprises across multiple dimensions including impact areas, revenue models, funding sources, industries, and legal structures.

## Tag Categories

### [Impact Area Tags](impact-area/impact-area.md)
Tags for categorizing ventures by their primary social or environmental impact focus:
- **UN SDG Tags** - Aligned with the 17 UN Sustainable Development Goals
- **IRIS+ Theme Tags** - Based on IRIS+ impact measurement themes

### [Revenue Source Tags](revenue-source/revenue-source.md)
Tags for categorizing ventures by their primary revenue generation models:
- Product Sales, Service Fees, Membership Dues, Subscriptions
- Licensing/Royalty, Platform Commission, Advertising/Sponsorship
- Government Contracts, Outcome Payments, Philanthropy

### [Industry Tags](industry/industry.md)
Tags for categorizing ventures by their primary industry or sector:
- Agriculture, Apparel, Clean Energy, Education, Healthcare
- Financial Services, Food & Beverage, ICT, Manufacturing, and more

### [Impact Mechanism Tags](impact-mechanism/impact-mechanism.md)
Tags for categorizing ventures by how they create social/environmental impact:
- Product/Service Impact, Employment Model, Reinvest Surplus
- Cross-Subsidy, Direct Service, Policy Advocacy, Systems Change

### [Funding Source Tags](funding-source/funding-source.md)
Tags for categorizing ventures by their primary funding approaches:
- Bootstrapped, Grants, Donations, Impact Equity
- Concessional Debt, Crowdfunding, Blended Finance

### [Legal Structure Tags](legal-structure/legal-structure.md)
Tags for categorizing ventures by their legal organizational form:
- Charity, Nonprofit, Cooperative, Benefit Corporation
- CIC (UK), L3C (US), Standard Company, Trust, Foundation

---


## Tag Definition
The `venture-type` tag is the parent tag for all venture classification and typology tags. It identifies content that categorizes or classifies social enterprises across multiple dimensions including impact areas, revenue models, industries, legal structures, funding sources, and impact mechanisms.

## Usage Criteria
Apply this tag to content that:
- Classifies ventures by type, category, or characteristics
- Provides venture typology frameworks and taxonomies
- Analyzes venture types and business model patterns
- Compares different types of social enterprises
- Discusses venture classification methodologies

## Always Include When
- Any venture-type sub-category tag is used
- Content about venture classification systems
- Venture type analysis and comparison
- Business model type discussions
- Venture taxonomy development

## Never Include When
- General business content not focused on venture types
- Individual venture examples without type classification
- Non-venture content (use appropriate primary tags instead)

## Required Combinations
- Must be included when any venture-type sub-tag is used
- Often combined with canvas section tags for type-specific guidance
- May combine with venture stage tags for type-stage intersections

## Sub-Category Tags

### Impact Area (34 tags)
- UN SDG tags: `sdg-01-no-poverty` through `sdg-17-partnerships-for-the-goals`
- IRIS+ theme tags: `agriculture`, `health`, `education`, `climate`, etc.

### Revenue Source (10 tags)
- `product-sales`, `service-fees`, `membership-dues`, `subscription`
- `licensing-royalty`, `platform-commission`, `advertising-sponsorship`
- `gov-contract`, `outcome-payment`, `philanthropy`

### Industry (16 tags)
- `agriculture`, `apparel`, `clean-energy`, `education`, `healthcare`
- `financial-services`, `ict`, `manufacturing`, and others

### Impact Mechanism (9 tags)
- `product-service-impact`, `employment-model`, `reinvest-surplus`
- `cross-subsidy`, `direct-service`, `capacity-building`
- `policy-advocacy`, `systems-change`, `research-innovation`

### Funding Source (9 tags)
- `bootstrapped`, `grant`, `donation`, `impact-equity`
- `concessional-debt`, `crowdfunding`, `blended-finance`, etc.

### Legal Structure (9 tags)
- `charity`, `nonprofit-inc`, `cooperative`, `benefit-corporation`
- `cic`, `l3c`, `standard-limited-company`, `trust`, `foundation`

## Content Examples
- Venture classification frameworks and typologies
- Business model pattern analysis
- Sector-specific venture characteristics
- Type-based impact measurement approaches
- Venture type comparison studies

## Related Tags
- Often appears with all major tag categories
- Essential for canvas examples and case studies
- Frequently combined with venture stage model tags
- May appear with any canvas section tags

## Multi-Dimensional Classification

Ventures typically require multiple venture-type tags:

```yaml
# Complete venture classification example
tags:
  - venture-type
  - impact-area, sdg-04-quality-education
  - industry, education
  - revenue-source, service-fees
  - funding-source, impact-equity
  - impact-mechanism, direct-service
  - legal-structure, benefit-corporation
```

## Key Concepts
- Multi-dimensional venture classification
- Business model type patterns
- Impact-business model alignment
- Venture typology development
- Type-based analysis and comparison
- Classification system validation

## Usage Notes
- Always use hierarchical tagging with parent tags
- Include multiple dimensions for complete classification
- Ensure accuracy and specificity in tag selection
- Use for precise venture example categorization
- Enable sophisticated search and filtering capabilities


## Usage Guidelines

1. **Multiple Tags**: Ventures typically need multiple venture-type tags
2. **Hierarchical Structure**: Include parent category tags when using specific tags
3. **Version Tracking**: This taxonomy is version-controlled for migration purposes
4. **Validation**: Tag definitions include usage criteria and validation rules

## Tag Hierarchy Rules

When using venture-type tags, always include the parent category:
```
tags: [revenue-source, product-sales]
tags: [industry, apparel]
tags: [impact-area, sdg-02-zero-hunger]
```

## Complete Example

A typical venture might be tagged as:
```yaml
tags:
  - venture-type
  - revenue-source, product-sales
  - funding-source, impact-equity
  - industry, apparel
  - impact-area, sdg-02-zero-hunger
  - impact-mechanism, product-service-impact
  - legal-structure, benefit-corporation
```

## Tag Validation

- All venture-type tags must be from approved taxonomy
- Unknown tags will be rejected with nearest match suggestions
- Regular validation ensures consistency across knowledge base

## Total Venture Type Tags: 75+

This comprehensive taxonomy enables precise classification and retrieval of venture examples and case studies based on multiple business model dimensions.
