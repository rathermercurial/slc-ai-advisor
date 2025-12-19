# Tasks Phase

Break design into atomic implementation steps.

## Guidelines

- **Small tasks:** Each should be completable and testable independently
- **Concrete actions:** "Create X that does Y" not "Set up the thing"
- **Specify files:** Which files to create/modify
- **Specify tests:** What to test for each task
- **Order by dependencies:** No circular dependencies
- **Start simple:** First task should be the simplest vertical slice

## Gate

Ask user: *"Does this breakdown look right? Ready to start implementation?"*

---

## Template

```markdown
# {Feature Name} - Tasks

| # | Task | Status |
|---|------|--------|
| 1 | {name} | ⬜ |
| 2 | {name} | ⬜ |
| 3 | {name} | ⬜ |

⬜ pending | ✅ done

---

### 1. {Task Name}
**Do:** 

**Files:** 
- 

**Tests:**
- 

---

### 2. {Task Name}
**Do:**

**Files:**
- 

**Tests:**
- 
```
