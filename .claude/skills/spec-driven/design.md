# Design Phase

Define HOW to build it before starting implementation.

## Questions to Answer

- **Approach:** What's the high-level approach in 2-3 sentences?
- **Components:** What are they? Where do they live? What are their interfaces?
- **Data models:** What structures/schemas are needed?
- **Integration:** How does this connect to existing code?
- **Risks:** What could go wrong? What's the mitigation?

## Gate

Ask user: *"Does this architecture make sense? Any concerns before I break it into tasks?"*

---

## Template

```markdown
# {Feature Name} - Design

## Overview

## Components

### {ComponentName}
- **Location:** `src/path/to/file.ts`
- **Purpose:** 
- **Interface:**
\`\`\`typescript
\`\`\`

## Data Models
\`\`\`typescript
\`\`\`

## Integration

## Risks
| Risk | Mitigation |
|------|------------|
| | |
```
