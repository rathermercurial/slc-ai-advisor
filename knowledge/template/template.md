---
title: SLC Knowledge Base Templates
description: Comprehensive templating resources and guidelines for consistent structure, metadata, and optimal LLM integration in the SLC Knowledge Base
last_updated: 2025-07-06
source:
tags:
  canvas-sections: []
  content: [template, design, admin]
  venture-stage: []
  venture-type: []
---

# SLC Knowledge Base Templates

This section provides comprehensive templating resources for the Social Lean Canvas Knowledge Base, ensuring consistent structure, proper metadata, and optimal LLM integration.

## **Metadata Template System**

### **Primary Metadata Template**
**Location**: `slc-knowledgebase/docs/slc-knowledge/template/SLC-Metadata-Template-PRODUCTION.md`

The production Templater template provides:
- **Interactive Metadata Creation**: Guided multi-select workflows with description field
- **Hierarchical Tag Management**: Automatic parent tag inclusion
- **Complete Taxonomy Coverage**: All canvas-sections, content, venture-stage, and venture-type categories
- **Consistent Structure**: Standardized frontmatter format with description summaries
- **Error Prevention**: Robust validation and user guidance

### **Template Features**
- **Description Field**: Brief content summary for context and searchability
- **Multi-Select Capability**: Choose multiple options in each category
- **Hierarchical Auto-Completion**: Parent tags automatically included
- **Categorized Venture Types**: Uses `/` separator format for clear organization
- **User-Friendly Workflow**: Step-by-step guidance through tag selection
- **Source Attribution**: Optional URL field for content references

## **How to Use the Metadata Template**

### **For New Files**
1. Create new file in Obsidian
2. Open command palette (`Cmd/Ctrl + P`)
3. Search for "Templater: Insert Template"
4. Select `SLC-Metadata-Template-PRODUCTION`
5. Follow the interactive prompts:
   - Enter description (brief summary)
   - Select canvas sections
   - Choose content types
   - Pick venture stages
   - Select venture types
   - Add source URL if applicable
6. Complete with your content

### **Template Workflow**
1. **Description**: Brief summary of content purpose and contents
2. **Canvas Sections**: Select framework components (purpose, customer-model, etc.)
3. **Content Types**: Choose content format (case-study, concept, template, etc.)
4. **Venture Stages**: Pick applicable development phases
5. **Venture Types**: Select from categorized taxonomy
6. **Source URL**: Add reference if applicable

## **Content Templates and Guidelines**

### **Canvas Example Template Structure**
```yaml
---
title: [Venture Name] - Social Lean Canvas Analysis
description: Analysis of [venture name]'s social lean canvas model including business model, impact strategy, and key metrics
last_updated: YYYY-MM-DD
source: [venture website or source]
tags:
  canvas-sections: [purpose, customer-model, impact-model, economic-model]
  content: [canvas-example, case-study]
  venture-stage: [current-stage]
  venture-type: [relevant-categorizations]
---

# [Venture Name] - Social Lean Canvas Analysis

## Purpose
[One sentence describing the venture's social/environmental purpose]

## Customer Model
### Problem/Jobs to be Done
[Customer needs and problems]

### Customers & Early Adopters
[Target customer segments and early adopter characteristics]

### Existing Alternatives
[Current solutions customers use]

### Unique Value Proposition
[How this venture uniquely addresses the problem]

### Solution
[High-level solution approach]

## Impact Model
[Theory of change from activities to long-term impact]

## Economic Model
### Channels
[How the venture reaches customers]

### Revenue Streams
[How the venture generates income]

### Cost Structure
[Key costs required to operate]

### Unfair Advantage
[What makes this venture difficult to replicate]

## Key Metrics
[Measures of success and impact]

## Analysis Notes
[Additional insights and observations]
```

### **Concept/Framework Template Structure**
```yaml
---
title: [Framework/Concept Name]
description: Explanation of [concept/framework] and its application to impact venture development within the SLC framework
last_updated: YYYY-MM-DD
source: [original source if applicable]
tags:
  canvas-sections: [relevant-sections]
  content: [concept, strategy-model]
  venture-stage: [applicable-stages]
  venture-type: []
---

# [Framework/Concept Name]

## Overview
[Brief description of the concept]

## Application to SLC
[How this applies to the Social Lean Canvas framework]

## When to Use
[Appropriate contexts and stages]

## Implementation Steps
[How to apply this concept]

## Examples
[Relevant examples or applications]

## Related Concepts
[Links to related frameworks or concepts]
```

### **Lexicon Entry Template Structure**
```yaml
---
title: [Term Name]
description: Definition and explanation of [term] in the context of impact ventures and the Social Lean Canvas framework
last_updated: YYYY-MM-DD
source: [definition source]
tags:
  canvas-sections: [relevant-sections]
  content: [lexicon-entry]
  venture-stage: [applicable-stages]
  venture-type: []
---

# [Term Name]

## Definition
[Clear, concise definition]

## Context in SLC
[How this term relates to the Social Lean Canvas framework]

## Usage Examples
[Examples of how this term is used]

## Related Terms
[Links to related lexicon entries]

## Further Reading
[Additional resources]
```

### **Template/Tool Template Structure**
```yaml
---
title: [Template/Tool Name]
description: [Tool/template] for [specific purpose] to support [target users] in [context/stage]
last_updated: YYYY-MM-DD
source: [source if adapted from elsewhere]
tags:
  canvas-sections: [relevant-sections]
  content: [template, experiment-test]
  venture-stage: [applicable-stages]
  venture-type: []
---

# [Template/Tool Name]

## Purpose
[What this tool helps accomplish]

## When to Use
[Appropriate timing and context]

## Instructions
[Step-by-step guidance]

## Template/Framework
[The actual template or tool]

## Tips for Success
[Best practices and guidance]

## Related Resources
[Links to complementary tools]
```

## **Best Practices for Template Usage**

### **Metadata Consistency**
- **Always Use Template**: Use the Templater template for consistent metadata
- **Meaningful Descriptions**: Write clear, informative 1-2 sentence summaries
- **Complete All Fields**: Don't leave metadata incomplete
- **Hierarchical Tagging**: Let the template handle parent tag inclusion
- **Accurate Categorization**: Choose tags that genuinely reflect content

### **Description Field Guidelines**
- **1-2 Sentences**: Keep descriptions concise but informative
- **Purpose Focus**: Describe what the content is and its intended use
- **Context Awareness**: Include relevant audience or application context
- **Search Optimization**: Use keywords that improve discoverability
- **LLM Context**: Provide sufficient context for AI understanding

### **Content Structure**
- **Clear Headings**: Use descriptive section headers
- **Concise Content**: Follow one-sentence rule for canvas sections where applicable
- **Proper Linking**: Connect related content with internal links
- **Source Attribution**: Always credit original sources

### **Version Control**
- **Update Dates**: Change `last_updated` when modifying content
- **Maintain History**: Consider noting major changes
- **Consistent Naming**: Use clear, descriptive file names
- **Tag Updates**: Review and update tags when content evolves

## **Advanced Template Features**

### **Multi-Select Capabilities**
The production template supports selecting multiple options in each category:
- **Canvas Sections**: Can select multiple framework components
- **Content Types**: Mix categories like `[case-study, resource]`
- **Venture Stages**: Include all applicable development phases
- **Venture Types**: Comprehensive characterization across all categories

### **Automatic Hierarchy Management**
- **Parent Inclusion**: Child tags automatically include parents
- **Consistency**: Ensures proper hierarchical structure
- **Error Prevention**: Prevents incomplete tag hierarchies

### **Category Organization**
Venture types use clear categorization:
```yaml
venture-type: [
  impact-area/health,
  legal-structure/nonprofit-inc,
  revenue-source/service-fees,
  funding-source/grants,
  impact-mechanism/direct-service,
  industry/healthcare
]
```

## **Integration with Knowledge Base**

### **For Human Users**
- **Quick Context**: Description field provides immediate content understanding
- **Consistent Navigation**: Predictable structure across all content
- **Easy Discovery**: Rich tagging enables filtering and search
- **Clear Context**: Immediate understanding of content type and scope

### **For LLM Processing**
- **Enhanced Context**: Description field improves content relevance assessment
- **Semantic Understanding**: Rich metadata provides context for appropriate responses
- **Content Categorization**: Precise identification of content types
- **Relationship Mapping**: Understanding of how content connects to framework
- **Query Optimization**: Structured data enables efficient content retrieval

## **Template Maintenance**

### **Regular Updates**
- Review template functionality quarterly
- Update taxonomy as framework evolves
- Gather user feedback for improvements
- Maintain documentation currency

### **Quality Assurance**
- Test template workflow regularly
- Validate output format consistency
- Check for broken functionality
- Monitor tag taxonomy completeness

### **Documentation**
- Keep usage guides current
- Update examples with real content
- Maintain clear instructions
- Provide troubleshooting guidance

This comprehensive template system ensures all content in the SLC Knowledge Base maintains consistent structure, proper categorization, meaningful descriptions, and optimal integration for both human learning and LLM-assisted guidance.