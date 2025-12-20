# Canvas Structure Fix - Transition Guide

## Summary of Changes

The spec had fundamental errors in canvas structure that propagated through all files. This guide explains how to apply the fixes.

### What Was Wrong

1. **Section count confusion:** Mixed "Models" (conceptual groupings) with "Sections" (the 11 numbered areas)
2. **Extra non-sections:** design.md listed `earlyAdopters`, `jobsToBeDone`, `existingAlternatives` as sections (they're concepts within the Customer Model, not sections)
3. **Missing sections:** `problem` was missing or conflated with JTBD
4. **Naming inconsistency:** kebab-case vs camelCase, different names for same thing
5. **Impact Model architecture:** Treated as separate document instead of nested in section 11

### What Is Now Correct

**11 Sections (numbered, sequential):**
1. Purpose
2. Customer Segments
3. Problem
4. Unique Value Proposition
5. Solution
6. Channels
7. Revenue
8. Cost Structure
9. Key Metrics
10. Unfair Advantage
11. Impact (contains nested Impact Model)

**3 Models (conceptual groupings):**
- Customer Model: Sections 2-5 + sub-concepts (Early Adopters, JTBD, Existing Alternatives)
- Economic Model: Sections 6-8, 10 + Financial Model concept
- Impact Model: Section 11 only (the 8-field causality chain nests entirely within it)

**Impact Model is special:** Unlike Customer/Economic Models which span multiple sections, Impact Model maps 1:1 with section 11. The `impact` field of the Impact Model IS section 11's content.

---

## Files to Update

### 1. Spec Files (in order)

| File | Action |
|------|--------|
| `spec/slc-ai-advisor-mvp/requirements.md` | Replace with corrected version |
| `spec/slc-ai-advisor-mvp/design.md` | Replace with corrected version |
| `spec/slc-ai-advisor-mvp/tasks.md` | Update B2 description, add A2 for KB restructure |

### 2. Type Files

| File | Action |
|------|--------|
| `src/types/canvas.ts` | Replace with corrected version |
| `src/types/venture.ts` | No changes needed |
| `src/types/message.ts` | Create if not exists |
| `src/types/index.ts` | Create barrel export |

### 3. Durable Object

| File | Action |
|------|--------|
| `src/durable-objects/UserSession.ts` | Update schema (see below) |

---

## Git Strategy

### Option A: Fix on main, rebase features (Recommended)

```bash
# 1. Ensure you're on main
git checkout main

# 2. Apply spec fixes
# (copy corrected files to spec/)
# (copy corrected canvas.ts to src/types/)

# 3. Commit
git add spec/ src/types/
git commit -m "fix: correct canvas structure (11 sections, nested Impact Model)

- Fix section list: 11 sections, not 12
- Clarify Models as conceptual groupings, not storage
- Impact Model nests within section 11
- JTBD/Early Adopters are concepts, not sections
- Standardize camelCase naming

Resolves foundational spec errors that caused inconsistent implementations."

# 4. Rebase feature branches
git checkout feature/backend-api
git rebase main
# Resolve conflicts in src/types/canvas.ts if any

git checkout feature/frontend
git rebase main
# Resolve conflicts if any

git checkout feature/knowledge-indexing
git rebase main
# Likely no conflicts
```

### Option B: Fix in each branch

More complex, not recommended unless rebasing causes major issues.

---

## Schema Changes for UserSession.ts

The SQLite schema needs these updates:

```sql
-- Session: add current_section
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  current_section INTEGER,      -- ADD: curriculum progress (1-11)
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Venture profile: add created_at
CREATE TABLE IF NOT EXISTS venture_profile (
  session_id TEXT PRIMARY KEY,
  venture_stage TEXT,
  impact_areas TEXT,
  impact_mechanisms TEXT,
  legal_structure TEXT,
  revenue_sources TEXT,
  funding_sources TEXT,
  industries TEXT,
  confidence_json TEXT,
  confirmed_json TEXT,
  created_at TEXT NOT NULL,     -- ADD
  updated_at TEXT NOT NULL
);

-- Canvas sections: no change needed
-- (section_key will now only hold 10 values, not 'impact')

-- Impact model: no change needed
-- (already correct structure)

-- Messages: no change needed
```

---

## Knowledge Base Alignment (Task A2)

The venture examples in `knowledge/` use slightly different naming. Consider aligning:

| Example Uses | Canonical |
|--------------|-----------|
| "Customers" | "Customer Segments" |
| "Jobs to be Done" header | (Remove - it's a sub-concept) |
| "Existing Alternatives" header | (Remove - it's a sub-concept) |
| "Costs" | "Cost Structure" |
| "Advantage" | "Unfair Advantage" |

This is lower priority than code fixes but helps reduce confusion.

---

## GitHub Issues Update

Update Issue #2 (Track B) with a comment explaining:

1. Spec corrections applied
2. B2 task description updated
3. Feature branches will need to rebase after main is fixed

---

## Verification Checklist

After applying fixes:

- [ ] `spec/requirements.md` has correct 11 sections with numbers
- [ ] `spec/design.md` has correct CanvasState interface
- [ ] `spec/design.md` SQLite schema matches
- [ ] `src/types/canvas.ts` has 11 CanvasSectionId values
- [ ] `src/types/canvas.ts` has SimpleSectionId (excludes 'impact')
- [ ] `src/types/canvas.ts` ImpactModel documented as nesting in section 11
- [ ] TypeScript compiles without errors
- [ ] Feature branches rebased successfully

---

## Questions Resolved

| Question | Answer |
|----------|--------|
| Problem vs JTBD | Different. Problem = obstacle/pain point. JTBD = task customer wants to accomplish. |
| Impact sync | Yes. ImpactModel.impact IS section 11's content. They stay in sync. |
| Impact Model storage | Nested within section 11, separate table for the 8 fields. |
| Section count | 11 sections total. |
| Early Adopters | Sub-concept under Customer Model, not a section. |
| Existing Alternatives | Sub-concept under Customer Model, not a section. |
