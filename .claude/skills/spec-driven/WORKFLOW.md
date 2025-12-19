# Spec-Driven Workflow Details

## Phase 1: Requirements

### Purpose
Define WHAT needs to be built before deciding HOW.

### Key Questions
- What problem does this solve?
- Who are the users/beneficiaries?
- What does success look like?
- What's out of scope?
- What constraints exist (time, tech, budget)?

### Output Format
```markdown
# {Feature Name} - Requirements

## Problem Statement
What problem are we solving?

## Users
Who benefits from this?

## Success Criteria
How do we know when it's done correctly?

## Scope
### In Scope
- ...

### Out of Scope
- ...

## Constraints
- ...
```

## Phase 2: Design

### Purpose
Define HOW to build it before starting implementation.

### Key Questions
- What's the overall architecture?
- What components are needed?
- How do components interact?
- What data models are required?
- What external dependencies exist?

### Output Format
```markdown
# {Feature Name} - Design

## Architecture Overview
High-level approach

## Components
### Component A
- Purpose:
- Interface:

## Data Models
```

## Interfaces
How components communicate

## Dependencies
External systems, libraries, APIs
```

## Phase 3: Tasks

### Purpose
Break design into actionable implementation steps.

### Guidelines
- Tasks should be small enough to complete in one session
- Order tasks by dependencies
- Include testing for each task
- Mark complexity (S/M/L)

### Output Format
```markdown
# {Feature Name} - Tasks

## Task List

### 1. [S] Task name
- Description:
- Files:
- Tests:
- Depends on: none

### 2. [M] Task name
- Description:
- Files:
- Tests:
- Depends on: Task 1
```

## Phase 4: Implementation

### Purpose
Execute tasks with tracking.

### Guidelines
- Work through tasks in order
- Mark each task complete when done
- Update spec if design changes discovered
- Commit after each task

### Progress Tracking
Use the TodoWrite tool to track task progress during implementation.
