---
title: Impact Area Tags
last_updated: 2025-06-30
source:
tags: [design, admin]
---

# Impact Area Tags

This section defines all tags for categorizing ventures by their primary social or environmental impact focus. Impact area tags are organized into two main frameworks: UN Sustainable Development Goals (SDGs) and IRIS+ impact themes.

## Tag Structure

### Parent Tag
- `impact-area` - Must be included with all impact area tags

### UN SDG Tags
Tags aligned with the 17 UN Sustainable Development Goals:

- `sdg-01-no-poverty`
- `sdg-02-zero-hunger`
- `sdg-03-good-health-and-well-being`
- `sdg-04-quality-education`
- `sdg-05-gender-equality`
- `sdg-06-clean-water-and-sanitation`
- `sdg-07-affordable-and-clean-energy`
- `sdg-08-decent-work-and-economic-growth`
- `sdg-09-industry-innovation-and-infrastructure`
- `sdg-10-reduced-inequalities`
- `sdg-11-sustainable-cities-and-communities`
- `sdg-12-responsible-consumption-and-production`
- `sdg-13-climate-action`
- `sdg-14-life-below-water`
- `sdg-15-life-on-land`
- `sdg-16-peace-justice-and-strong-institutions`
- `sdg-17-partnerships-for-the-goals`

### IRIS+ Theme Tags
Tags based on IRIS+ impact measurement themes:

- `agriculture`
- `air`
- `biodiversity-and-ecosystems`
- `climate`
- `diversity-and-inclusion`
- `education`
- `employment`
- `energy`
- `financial-services`
- `health`
- `infrastructure`
- `land`
- `oceans-and-coastal-zones`
- `pollution`
- `real-estate`
- `waste`
- `water`

## Usage Guidelines

1. **Always include parent tag**: Use `[impact-area, specific-tag]`
2. **Multiple impact areas**: Ventures may have multiple impact focus areas
3. **Primary vs secondary**: Tag primary impact area first
4. **Framework alignment**: Choose SDG or IRIS+ based on venture's measurement approach

## Required Combinations

- Must include `venture-type` when using impact area tags
- Must include `impact-area` parent tag
- Can combine with impact mechanism tags for how impact is created

## Examples

```yaml
# Single SDG focus
tags: [venture-type, impact-area, sdg-04-quality-education]

# Multiple IRIS+ themes
tags: [venture-type, impact-area, water, health]

# Mixed framework
tags: [venture-type, impact-area, sdg-13-climate-action, energy]
```

## Individual Tag Definitions

See individual files in this folder for detailed definitions of each impact area tag, including:
- Specific impact focus descriptions
- Example ventures and use cases
- Related impact mechanisms
- Measurement approaches
