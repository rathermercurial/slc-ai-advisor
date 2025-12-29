---
title: Venture Properties
last_updated: 2025-12-26
tags: [design, admin]
aliases:
  - '#venture-properties'
---

# Venture Properties

> ⚡ **Properties vs. Dimensions**
>
> | Concept | Values | Assessment | Current Examples |
> |---------|--------|------------|------------------|
> | **Venture Properties** | Open-ended (any valid tag) | Descriptive classification | `industry/apparel`, `legal-structure/dao` |
> | **Venture Dimensions** | Strictly pre-defined, mutually exclusive | Framework-based assessment criteria | `stage` (only: idea/early/growth/scale) |
>
> **Dimensions are a special subset of properties.** A dimension has:
> - Pre-enumerated valid values (no arbitrary values allowed)
> - Assessment criteria for determining which value applies
> - Mutual exclusivity (exactly one value at a time)
>
> Currently, **[stage](stage/readme.md)** is the only venture dimension.

This directory defines tags for classifying ventures across multiple property categories. These tags enable:
- Precise categorization of venture examples
- Selection Matrix filtering in retrieval
- Multi-dimensional venture profile building

---

## Property Categories

| Category | Path | Count | Type | Description |
|----------|------|-------|------|-------------|
| [Stage](stage/readme.md) | `venture/stage/` | 4 | ⚡ **Dimension** | Development phase with assessment criteria |
| [Impact Area](impact-area/impact-area.md) | `venture/impact-area/` | 34 | Property | SDG + IRIS+ impact themes |
| [Industry](industry/industry.md) | `venture/industry/` | 16 | Property | Sector classification |
| [Impact Mechanism](impact-mechanism/) | `venture/impact-mechanism/` | 9 | Property | How impact is created |
| [Legal Structure](legal-structure/) | `venture/legal-structure/` | 9 | Property | Organizational form |
| [Revenue Source](revenue-source/) | `venture/revenue-source/` | 10 | Property | Revenue models |
| [Funding Source](funding-source/) | `venture/funding-source/` | 9 | Property | Capital sources |

**Total tags: 91+**

---

## Understanding Properties vs. Dimensions

### Venture Properties (Open-Ended)

Properties describe venture characteristics without strict validation:

```yaml
# Any valid tag is acceptable
tags:
  - industry/apparel           # Canonical tag
  - industry/space-tech        # Non-canonical but valid
  - legal-structure/dao        # Emerging structure, valid
```

Properties are:
- **Descriptive** - they describe what something IS
- **Additive** - multiple values per category allowed
- **Open** - non-canonical values accepted when appropriate

### Venture Dimensions (Strictly Defined)

Dimensions have assessment frameworks that determine the correct value:

```yaml
# Only these 4 values are valid for stage:
tags:
  - idea-stage      # Concept development, problem validation
  - early-stage     # Solution validation, initial operations
  - growth-stage    # Scaling operations, expanding impact
  - scale-stage     # Systemic impact, sustainable operations
```

Dimensions are:
- **Assessed** - criteria determine the value (see [stage assessment criteria](stage/readme.md#stage-transition-criteria))
- **Exclusive** - exactly one value at a time
- **Closed** - only pre-defined values are valid

### Why This Distinction Matters

For **retrieval filtering**:
- Dimension values (stage) can be exact-matched with high confidence
- Property values should use flexible matching (partial, semantic)

For **venture profile building**:
- Dimensions can be inferred with clear criteria
- Properties require more nuanced understanding

For **Vectorize indexing**:
- Dimensions could have dedicated metadata fields
- Properties are better stored as flat tags for flexible querying

---

## Tagging Conventions

### Flat Tag Format (Preferred)
```yaml
tags:
  - growth-stage                   # Dimension - exactly one
  - industry/apparel               # Property - can have multiple
  - legal-structure/trust
  - impact-area/sdg-12-responsible-consumption-and-production
  - revenue-source/product-sales
  - impact-mechanism/product-service-impact
```

### Hierarchical Tag Format (Also Valid)
```yaml
tags:
  - stage/growth
  - industry/apparel
```

Both formats are normalized during indexing. Prefer flat format for clarity.

### Complete Example

A typical venture example might be tagged as:
```yaml
tags:
  # Dimension (exactly one)
  - scale-stage
  
  # Properties (multiple allowed)
  - industry/apparel
  - legal-structure/trust
  - impact-area/sdg-12-responsible-consumption-and-production
  - impact-area/sdg-13-climate-action
  - revenue-source/product-sales
  - impact-mechanism/product-service-impact
  - impact-mechanism/reinvest-surplus
  - funding-source/bootstrapped
```

---

## For Vectorize Indexing

Venture properties are stored as flat tags in markdown frontmatter. The indexing script:

1. Extracts all tags from frontmatter
2. Normalizes stage tags to canonical form (`growth-stage` not `stage/growth`)
3. Stores in Vectorize metadata for Selection Matrix filtering

### Metadata Strategy

Stage is elevated to its own metadata field for exact matching:
```
venture_stage: "growth-stage"
```

Other properties are stored as a flat `tags` field for flexible matching:
```
tags: "industry/apparel legal-structure/trust impact-area/sdg-12..."
```

---

## Usage Guidelines

1. **Always include relevant properties**: Tag all applicable categories
2. **Stage is required**: Every venture example needs exactly one stage tag
3. **Be specific**: Use most specific applicable tags
4. **Multiple values allowed**: Ventures often span multiple impact areas, industries, etc.
5. **Non-canonical values**: Accept when legitimate (e.g., emerging legal structures)

---

## Related

- [Tag System Overview](../readme.md) - Tagging rules and conventions
- [Canvas Section Tags](../canvas/) - Canvas structure tags
- [Content Type Tags](../content/) - Content classification tags
- [Stage Dimension](stage/readme.md) - The only current venture dimension
