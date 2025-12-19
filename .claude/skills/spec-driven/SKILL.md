---
name: spec-driven-development
description: Guides structured feature development through spec documents. Activate when users want to implement, build, add, create, refactor, migrate, or make significant changes. Follows Requirements → Design → Tasks → Implementation with user approval between phases.
---

# Spec-Driven Development

Four phases. Each produces a spec document. Get user approval before moving to the next phase.

1. **Requirements** — Read [requirements.md](requirements.md), create `spec/{feature}/requirements.md`, get approval
2. **Design** — Read [design.md](design.md), create `spec/{feature}/design.md`, get approval
3. **Tasks** — Read [tasks.md](tasks.md), create `spec/{feature}/tasks.md`, get approval
4. **Implementation** — Execute tasks in order, mark done, flag if design needs changes

## Directory Structure

```
spec/
└── {feature-name}/
    ├── requirements.md
    ├── design.md
    └── tasks.md
```
