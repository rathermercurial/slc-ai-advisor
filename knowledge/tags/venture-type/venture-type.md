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
