# SLC Knowledge Base

This folder contains the organized knowledge base for the Social Lean Canvas framework, structured according to the hierarchical tag system defined in the main documentation.

## Hierarchical Structure

The knowledge base follows the exact hierarchy from `slc-knowledgebase/docs/tags/readme.md`:

### 1. Canvas Section (`/canvas-section/`)
The core framework structure:
- **Purpose** (`purpose.md`)
- **Customer Model** (`/customer-model/`)
  - Customers (`/customers/`)
    - Early Adopters (`early-adopters.md`)
  - Jobs to be Done (`/jobs-to-be-done/`)
    - Existing Alternatives (`existing-alternatives.md`)
  - Unique Value Proposition (`unique-value-proposition.md`)
  - Solution (`solution.md`)
  - Assumption Risk (`assumption-risk.md`)
- **Impact Model** (`/impact-model/`)
  - Issue, Participants, Activities, Outputs
  - Short/Medium/Long-term Outcomes, Impact
  - Assumption Risk (`assumption-risk.md`)
- **Economic Model** (`/economic-model/`)
  - Channels, Revenue, Costs, Advantage, Financial Model
  - Assumption Risk (`assumption-risk.md`)
- **Key Metrics** (`key-metrics.md`)

### 2. Supporting Categories
- **Canvas Example** (`/canvas-example/`) - Real venture examples
- **Case Study** (`/case-study/`) - Detailed studies
- **Venture Stage Model** (`/venture-stage-model/`) - Idea/Early/Growth/Scale stages
- **Strategy Model** (`/strategy-model/`) - Business/Organizational/Capital strategies
- **Concept** (`/concept/`) - Core concepts including Leverage with Network Effects
- **Template** (`/template/`) - Reusable templates
- **Lexicon Entry** (`/lexicon-entry/`) - Definitions and terminology
- **Resource** (`/resource/`) - Additional materials
- **Design** (`/design/`) - Design notes, prompts, admin
- **Experiment Test** (`/experiment-test/`) - Testing methodologies
- **Link** (`/link/`) - External references

## File Structure Benefits

### For Human Navigation
- **Logical Hierarchy**: Easy to browse and understand relationships
- **Clear Organization**: Related concepts are grouped together
- **Consistent Naming**: Predictable file locations

### For LLM Processing
- **Structured Tags**: Every file has hierarchical tags for filtering
- **Path-based Logic**: File paths reflect conceptual relationships
- **Scalable Architecture**: Easy to add new content in appropriate locations

## Usage Guidelines

1. **Adding Content**: Place new files in the appropriate hierarchical location
2. **Tagging**: Include all relevant hierarchical tags in front matter
3. **Linking**: Use relative paths that respect the folder structure
4. **Consistency**: Follow the established naming conventions

This hierarchical structure enables powerful navigation, filtering, and analysis while maintaining clear conceptual relationships throughout the knowledge base.
