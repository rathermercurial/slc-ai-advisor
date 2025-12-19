---
title: Revenue Source Tags
last_updated: 2025-06-30
source:
tags: [design, admin]
---

# Revenue Source Tags

This section defines all tags for categorizing ventures by their primary revenue generation models. These tags help identify how social enterprises sustain themselves financially.

## Tag Structure

### Parent Tag
- `revenue-source` - Must be included with all revenue source tags

### Revenue Source Types

#### Direct Sales Revenue
- `product-sales` - Revenue from selling tangible goods
- `service-fees` - Revenue from B2C or B2B services (time-based, SaaS, consulting)

#### Membership and Subscription Revenue
- `membership-dues` - Revenue from unions, cooperatives, associations
- `subscription` - Recurring revenue from digital or physical deliveries

#### Platform and Licensing Revenue
- `licensing-royalty` - Revenue from intellectual property or franchising
- `platform-commission` - Revenue from marketplace take-rates

#### Media and Advertising Revenue
- `advertising-sponsorship` - Revenue from media, content, and sponsorship deals

#### Public Sector Revenue
- `gov-contract` - Fee-for-service revenue from public agencies
- `outcome-payment` - Revenue from Social Impact Bonds (SIBs), Development Impact Bonds (DIBs), Pay-for-Success contracts

#### Philanthropic Revenue
- `philanthropy` - Revenue from one-off or recurring donations (distinct from grants)

## Usage Guidelines

1. **Always include parent tag**: Use `[revenue-source, specific-tag]`
2. **Primary revenue source**: Tag the main revenue generation model
3. **Multiple sources**: Use multiple tags for diversified revenue models
4. **Revenue vs funding**: Distinguish between ongoing revenue and initial funding

## Required Combinations

- Must include `venture-type` when using revenue source tags
- Must include `revenue-source` parent tag
- Often combined with funding source tags for complete financial picture

## Examples

```yaml
# Single revenue source
tags: [venture-type, revenue-source, product-sales]

# Multiple revenue sources
tags: [venture-type, revenue-source, service-fees, platform-commission]

# Public sector focus
tags: [venture-type, revenue-source, gov-contract, outcome-payment]
```

## Tag Definitions

### product-sales
Revenue generated from selling tangible goods directly to customers.

### service-fees
Revenue from providing services, including B2C and B2B models, time-based billing, SaaS subscriptions, and consulting services.

### membership-dues
Revenue from membership organizations such as unions, cooperatives, professional associations, and community organizations.

### subscription
Recurring revenue from ongoing delivery of digital or physical products/services.

### licensing-royalty
Revenue from licensing intellectual property, franchising, or royalty agreements.

### platform-commission
Revenue from facilitating transactions between parties, typically as a percentage of transaction value.

### advertising-sponsorship
Revenue from advertising placements, content sponsorship, and media monetization.

### gov-contract
Revenue from contracts with government agencies for fee-for-service arrangements.

### outcome-payment
Revenue tied to achieving specific social or environmental outcomes, including impact bonds and pay-for-success contracts.

### philanthropy
Revenue from charitable donations, both one-time and recurring (distinct from grants which are typically for specific projects).

## Individual Tag Files

See individual files in this folder for detailed definitions of each revenue source tag.
