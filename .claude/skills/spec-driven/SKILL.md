---
name: spec-driven-development
description: Use this skill when the user requests implementation of a new feature, asks to build something, or wants to add functionality. Guide them through a structured workflow: Requirements → Design → Tasks → Implementation. This ensures proper planning before coding.
---

# Spec-Driven Development

This skill enforces structured development through four phases with approval gates.

## When to Use

Activate this skill when:
- User requests a new feature or capability
- User asks to "implement", "build", "add", or "create" something
- User wants to make significant changes to the codebase

## Workflow Phases

### 1. Requirements
Before any implementation, define:
- What problem this solves
- Who the users are
- Success criteria
- Constraints and scope boundaries

Create: `spec/{feature-name}/requirements.md`

### 2. Design
After requirements are approved:
- Architecture decisions
- Component structure
- Data models and interfaces
- Integration points

Create: `spec/{feature-name}/design.md`

### 3. Tasks
After design is approved:
- Ordered implementation steps
- Dependencies between tasks
- Estimated complexity
- Testing approach

Create: `spec/{feature-name}/tasks.md`

### 4. Implementation
After tasks are approved:
- Execute tasks in order
- Track progress
- Update spec if discoveries require changes

## Phase Gates

Each phase requires explicit user approval before proceeding:
1. Present phase output
2. Ask user to review and approve
3. Only proceed to next phase after approval

## Directory Structure

```
spec/
├── {feature-name}/
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
```

## Templates

See `TEMPLATES/` directory for file templates.
