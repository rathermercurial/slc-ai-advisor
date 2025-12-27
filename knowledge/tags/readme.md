---
title: Tag System Overview
last_updated: 2025-12-26
source:
tags: [design, admin]
---

# SLC Knowledge Base Tag System

This directory contains detailed definitions for every tag used in the SLC Knowledge Base. Each tag has its own definition file with usage criteria, examples, and relationships to other tags.

Tags are the basis of the advisor's intelligent recall ability. Where Programs are used to pre-filter content by the user's current learning course (using simple Vectorize namespaces), tags utilize Vectorize metadata indexes to add more nuanced filtering and interpretation capabilities.

## Tag Structure

- Tags indicate that a page is related to some other page and/or concept.
  - To understand what a tag means, read its Tag Page (see "Aliases" below)
    - The documents in this directory are typically Tag Pages.
- Aliases indicate that a page is a "Tag Page", and holds the canonical definition for a tag.
  - Aliases are indicated by including the tag in the `aliases` frontmatter property for the Tag Page.

### Tag Hierarchies (Nested Tags)

Tag hierarchies exist where Tag Pages are nested within folders. They're useful for understanding the relationship between tags in a linear, syntactic manner.

Tag hierarchies are strict and exclusive. A single tag page can't belong to more than one hierarchy.

Tag hierarchies can be inferred by simply reading the tags or tag page's name. Tag hierarchies can be used for informally describing nested objects like canvas sections, models, ventures, etc.

### Tag Heterarchies (Tagged Tag Pages)

Tag Heterarchies exist where Tag Pages are tagged with other tags. They're useful for understanding the relationship between tags in a networked, semantic manner.

Tag heterarchies are non-strict and non-exclusive. A single tag page can belong to many heterarchies.

Tag heterarchies often cannot be found without analyzing the metadata of many tag pages in relation to each other. Tag heterarchies can be used to quickly indicate abstract relationships between concepts without making the knowledge system structurally dependant on those relationships as with tag hierarchies.

---

## Venture Properties vs Dimensions

When tagging ventures, understand the distinction between **properties** and **dimensions**:

### Venture Properties (Open-Ended)
Arbitrary tags describing venture characteristics. Users can apply any tag—even non-canonical values.

- `impact-area/sdg-04-quality-education`
- `industry/apparel`
- `legal-structure/benefit-corporation`
- `legal-structure/dao` ← valid even if not in canonical list

### Venture Dimensions (Strict)
A subset of properties with pre-defined, validated values aligned with an assessment framework. Currently only **stage** is a dimension:

- Valid values: `idea-stage`, `early-stage`, `growth-stage`, `scale-stage`
- Mutually exclusive (venture is in exactly one stage)
- See [venture/stage/readme.md](venture/stage/readme.md) for criteria

Dimensions don't require separate metadata fields—they're discovered via tags like any other property.

---

## Tagging Rules

1. **Required Tags**: Every note must have at least one primary category tag

2. **Consistent Naming**: 
   - Lowercase only
   - Use hyphens for multi-word tags
   - No spaces or special characters

3. **Tag Inheritance**: Sub-category tags should include their parent tags

4. **Multi-property Tagging**: Ventures can be tagged across multiple property categories
   - Example: `[venture-properties, impact-area/health, legal-structure/nonprofit-inc, revenue-source/service-fees, growth-stage]`

5. **Dimension Validation**: Stage tags must use canonical values (`idea-stage`, `early-stage`, `growth-stage`, `scale-stage`)

## Usage Guidelines

- **Before adding tags**: Check the relevant definition file
- **When in doubt**: Err on the side of more specific tags
- **For new content**: Follow the hierarchical pattern
- **For cross-cutting content**: Use multiple category tags appropriately
- **For venture properties**: Use multiple categories to fully characterize ventures
- **For stage**: Use exactly one stage tag per venture

## Tag Validation

Use this directory to:
- Verify correct tag usage before publishing
- Understand tag meanings and relationships
- Maintain consistency across the knowledge base
- Train LLMs on proper tagging approaches
