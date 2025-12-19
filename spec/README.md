# Feature Specifications

This directory contains specifications for features developed using the spec-driven workflow.

## Structure

Each feature has its own subdirectory:

```
spec/
├── {feature-name}/
│   ├── requirements.md   # What to build
│   ├── design.md         # How to build it
│   └── tasks.md          # Implementation steps
```

## Workflow

1. **Requirements** - Define scope, success criteria, constraints
2. **Design** - Architecture, components, interfaces
3. **Tasks** - Ordered implementation steps
4. **Implementation** - Execute with tracking

Each phase requires approval before proceeding to the next.

## Templates

Templates are available in `.claude/skills/spec-driven/TEMPLATES/`.
