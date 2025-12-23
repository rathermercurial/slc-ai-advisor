---
title: Impact Mechanism Tags
last_updated: 2025-06-30
source:
tags: [design, admin]
---

# Impact Mechanism Tags

This section defines all tags for categorizing ventures by how they create social or environmental impact. These tags identify the specific mechanisms through which ventures generate positive change.

## Tag Structure

### Parent Tag
- `impact-mechanism` - Must be included with all impact mechanism tags

### Impact Mechanism Types

#### Direct Product/Service Impact
- `product-service-impact` - Impact embedded directly in the core offering (e.g., solar lanterns, clean water filters)

#### Employment-Based Impact
- `employment-model` - Creating impact through providing jobs for target populations (e.g., hiring formerly incarcerated individuals)

#### Financial Model Impact
- `reinvest-surplus` - Channeling profits back into social programs and impact activities
- `cross-subsidy` - Using revenue from one segment to subsidize services for underserved populations

#### Service Delivery Impact
- `direct-service` - Providing direct services to beneficiaries (e.g., healthcare, education)
- `capacity-building` - Building skills, knowledge, and capabilities in individuals or organizations

#### Systemic Impact
- `policy-advocacy` - Working to change policies, regulations, or institutional practices
- `systems-change` - Addressing root causes and changing underlying systems
- `research-innovation` - Generating new knowledge, technologies, or approaches to social problems

## Usage Guidelines

1. **Always include parent tag**: Use `[impact-mechanism, specific-tag]`
2. **Primary mechanism**: Tag the main way impact is created
3. **Multiple mechanisms**: Many ventures use multiple impact mechanisms
4. **Mechanism clarity**: Choose tags that clearly describe how change happens

## Required Combinations

- Must include `venture-type` when using impact mechanism tags
- Must include `impact-mechanism` parent tag
- Often combined with impact area tags to show what impact is created
- May combine with impact model canvas section tags

## Examples

```yaml
# Single impact mechanism
tags: [venture-type, impact-mechanism, product-service-impact]

# Multiple mechanisms
tags: [venture-type, impact-mechanism, employment-model, capacity-building]

# Complex impact model
tags: [venture-type, impact-mechanism, direct-service, policy-advocacy, systems-change]
```

## Tag Definitions

### product-service-impact
Impact is embedded directly in the core product or service offering. The act of purchasing/using the product creates the social or environmental benefit.

**Examples**: Solar lanterns providing clean energy, water purification tablets, educational software

### employment-model
Impact is created by providing employment opportunities to specific target populations, often those facing barriers to employment.

**Examples**: Hiring formerly incarcerated individuals, employing people with disabilities, creating jobs in underserved communities

### reinvest-surplus
Impact is created by channeling financial surpluses (profits) back into social programs, impact activities, or organizational mission.

**Examples**: Profit-sharing with communities, funding additional programs, reinvesting in impact expansion

### cross-subsidy
Impact is created by using revenue from paying customers to subsidize services for underserved populations who cannot afford full price.

**Examples**: "Buy one, give one" models, premium services funding free services, market-rate housing funding affordable housing

### direct-service
Impact is created through direct provision of services to beneficiaries, typically addressing immediate needs.

**Examples**: Healthcare clinics, educational programs, social services, emergency assistance

### capacity-building
Impact is created by building skills, knowledge, capabilities, and organizational strength in individuals or communities.

**Examples**: Training programs, mentorship, organizational development, leadership development

### policy-advocacy
Impact is created by working to change policies, regulations, laws, or institutional practices that affect the target issue.

**Examples**: Lobbying for policy changes, advocacy campaigns, regulatory reform, institutional change

### systems-change
Impact is created by addressing root causes and changing underlying systems that perpetuate social or environmental problems.

**Examples**: Changing market structures, altering incentive systems, transforming institutional norms

### research-innovation
Impact is created by generating new knowledge, developing innovative technologies, or creating novel approaches to social problems.

**Examples**: R&D for social innovation, developing new methodologies, creating breakthrough technologies

## Individual Tag Files

See individual files in this folder for detailed definitions of each impact mechanism tag.
