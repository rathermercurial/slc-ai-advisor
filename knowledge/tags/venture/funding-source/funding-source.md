---
title: Funding Source Tags
last_updated: 2025-06-30
source:
tags: [design, admin]
---

# Funding Source Tags

This section defines all tags for categorizing ventures by their primary funding approaches and capital sources. These tags help identify how social enterprises secure initial and ongoing capital.

## Tag Structure

### Parent Tag
- `funding-source` - Must be included with all funding source tags

### Funding Source Types

#### Self-Funded
- `bootstrapped` - Self-funded through personal resources, early revenue, or organic growth

#### Grant-Based Funding
- `grant` - Traditional grants from foundations, government agencies, or other grantmakers
- `recoverable-grant` - Grants with potential repayment requirements based on success

#### Philanthropic Funding
- `donation` - Individual or institutional donations without expectation of return
- `csr-sponsorship` - Corporate social responsibility funding and sponsorship

#### Investment-Based Funding
- `impact-equity` - Equity investment focused on financial and social/environmental returns
- `concessional-debt` - Below-market-rate loans with favorable terms for social ventures

#### Alternative Funding
- `crowdfunding` - Funding raised from large numbers of small contributors
- `blended-finance` - Combining multiple funding sources with different risk-return profiles

## Usage Guidelines

1. **Always include parent tag**: Use `[funding-source, specific-tag]`
2. **Primary funding**: Tag the main funding approach
3. **Multiple sources**: Many ventures use multiple funding sources
4. **Stage-appropriate**: Funding sources often change with venture development stage
5. **Funding vs revenue**: Distinguish between initial/growth funding and ongoing revenue

## Required Combinations

- Must include `venture-type` when using funding source tags
- Must include `funding-source` parent tag
- Often combined with revenue source tags for complete financial picture
- May combine with venture stage tags to show stage-appropriate funding

## Examples

```yaml
# Single funding source
tags: [venture-type, funding-source, impact-equity]

# Multiple funding sources (blended)
tags: [venture-type, funding-source, grant, impact-equity, blended-finance]

# Stage-specific funding
tags: [venture-type, funding-source, bootstrapped, venture-stage-model, idea-stage]
```

## Tag Definitions

### bootstrapped
Self-funded venture using personal resources, early revenue generation, or organic growth without external investment or grants.

**Characteristics**: Founder resources, early sales, organic growth, minimal external capital

### grant
Traditional grant funding from foundations, government agencies, development organizations, or other institutional grantmakers.

**Characteristics**: No repayment required, often project-specific, may have reporting requirements

### donation
Philanthropic funding from individuals or institutions without expectation of financial return.

**Characteristics**: Charitable giving, no repayment, may be one-time or recurring

### csr-sponsorship
Corporate social responsibility funding, sponsorship deals, or partnerships with businesses seeking social impact.

**Characteristics**: Corporate partnership, may include branding/marketing elements, aligned with corporate values

### impact-equity
Equity investment specifically focused on generating both financial returns and measurable social/environmental impact.

**Characteristics**: Ownership stake, dual return expectations, impact measurement requirements

### recoverable-grant
Grant funding with potential repayment requirements based on venture success or achievement of specific milestones.

**Characteristics**: Grant structure with repayment triggers, success-based repayment, patient capital

### concessional-debt
Below-market-rate loans or debt financing with favorable terms designed to support social ventures.

**Characteristics**: Below-market interest rates, flexible repayment terms, social impact focus

### crowdfunding
Funding raised from large numbers of small contributors, typically through online platforms.

**Characteristics**: Many small contributions, platform-based, may include rewards or equity

### blended-finance
Strategic combination of multiple funding sources with different risk-return profiles to optimize capital efficiency.

**Characteristics**: Multiple capital types, risk mitigation, leveraged impact, complex structuring

## Individual Tag Files

See individual files in this folder for detailed definitions of each funding source tag.
