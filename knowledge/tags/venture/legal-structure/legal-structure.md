---
title: Legal Structure Tags
aliases:
  - '#legal-structure'
tags:
  - venture/property
  - venture/legal-structure
---

# Legal Structure Tags

This section defines all tags for categorizing ventures by their legal organizational form. These tags help identify the legal framework within which social enterprises operate.

## Tag Structure

### Parent Tag
- `legal-structure` - Must be included with all legal structure tags

### Legal Structure Types

#### Traditional Nonprofit Structures
- `charity` - Registered charitable organization with tax-exempt status
- `nonprofit-inc` - Incorporated nonprofit organization
- `trust` - Legal trust structure for social purposes
- `foundation` - Private or public foundation structure

#### Cooperative Structures
- `cooperative` - Member-owned and democratically controlled organization

#### Hybrid Structures
- `benefit-corporation` - For-profit corporation with legal social/environmental purpose requirements
- `cic` - Community Interest Company (UK hybrid structure)
- `l3c` - Low-profit Limited Liability Company (US hybrid structure)

#### Traditional For-Profit Structures
- `standard-limited-company` - Traditional for-profit limited company/corporation structure

## Usage Guidelines

1. **Always include parent tag**: Use `[legal-structure, specific-tag]`
2. **Single structure**: Most ventures have one primary legal structure
3. **Jurisdiction-specific**: Some structures are specific to certain countries/regions
4. **Purpose alignment**: Legal structure should align with venture's mission and funding needs

## Required Combinations

- Must include `venture-properties` when using legal structure tags
- Must include `legal-structure` parent tag
- Often combined with funding source tags (some structures limit funding options)
- May combine with impact mechanism tags to show purpose-structure alignment

## Examples

```yaml
# Nonprofit structure
tags: [venture-properties, legal-structure, charity]

# Hybrid structure
tags: [venture-properties, legal-structure, benefit-corporation]

# Cooperative model
tags: [venture-properties, legal-structure, cooperative]
```

## Tag Definitions

### charity
Registered charitable organization with tax-exempt status, dedicated to public benefit purposes.

**Characteristics**: Tax-exempt status, public benefit purpose, regulatory oversight, donation eligibility

### nonprofit-inc
Incorporated nonprofit organization that may or may not have charitable status but operates for social purposes.

**Characteristics**: Nonprofit incorporation, mission-driven, may have tax advantages, restricted profit distribution

### cooperative
Member-owned and democratically controlled organization where members share ownership, control, and benefits.

**Characteristics**: Member ownership, democratic governance, shared benefits, cooperative principles

### benefit-corporation
For-profit corporation legally required to consider social and environmental impact alongside financial returns.

**Characteristics**: For-profit structure, legal benefit purpose, stakeholder governance, impact reporting

### cic
Community Interest Company - UK legal structure combining limited company flexibility with social purpose lock.

**Characteristics**: UK-specific, asset lock, community purpose, regulated dividends, public reporting

### l3c
Low-profit Limited Liability Company - US hybrid structure prioritizing social purpose while allowing profit.

**Characteristics**: US-specific, social purpose priority, limited profit distribution, Program Related Investment eligible

### standard-limited-company
Traditional for-profit limited company or corporation structure without specific social purpose requirements.

**Characteristics**: For-profit focus, shareholder primacy, flexible operations, traditional corporate law

### trust
Legal trust structure where assets are held for specific social or charitable purposes.

**Characteristics**: Trustee governance, asset protection, specific purposes, beneficiary focus

### foundation
Private or public foundation structure focused on grantmaking or direct charitable activities.

**Characteristics**: Endowment-based, grantmaking focus, perpetual existence, charitable purposes

## Jurisdictional Considerations

- **CIC**: Specific to UK and some other Commonwealth jurisdictions
- **L3C**: Available in select US states
- **Benefit Corporation**: Available in most US states with variations
- **Other structures**: Available with variations across different jurisdictions

## Individual Tag Files

See individual files in this folder for detailed definitions of each legal structure tag.
