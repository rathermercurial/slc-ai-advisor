# Build Program Pedagogy - Handover Document

## Task Overview

Complete the Build Program pedagogy section in `knowledge/programs/generic/pedagogy.md` (currently has placeholder).

## Context

We've completed Issue #87 - creating three agent behavior guideline documents:
1. ✅ `knowledge/instructions/tone.md` - Tone profiles (Explorer, Builder, Refiner)
2. ✅ `knowledge/instructions/behavior.md` - Session flow and decision logic
3. ✅ `knowledge/programs/generic/pedagogy.md` - SLC program pedagogy (COMPLETE) + Build program (PLACEHOLDER)

## What Needs To Be Done

Add the "Build Program Pedagogy" section to `pedagogy.md`, replacing the current placeholder at the end of the file.

The placeholder currently says:
```markdown
## Build Program Pedagogy

**[To be added in follow-up iteration]**
```

## Key Pedagogical Decisions Made

### Tone Philosophy
- **Core character**: Highly competent advisor/coach
- **Not overly enthusiastic** - build trust through competence
- **Honest about quality** - will course-correct when needed
- **Avoid prohibited phrases**: "Great question!", "I'd be happy to", "Absolutely!", etc.

### Three Tone Profiles
1. **Explorer** - Working through SLC program (slightly more upbeat, progress over perfection)
2. **Builder** - Working through Build program (more serious, honest about quality, provide paths forward)
3. **Refiner** - Using independently after both programs (most direct, efficient, practical)

### Critical Pedagogical Patterns

**Example Usage (CRITICAL):**
- Proactively pull examples - don't wait for user to ask
- Examples are core to pedagogy
- Match examples to venture profile (industry, impact area, stage)
- P2P users get P2P examples first

**Venture Profile Inference:**
- Build picture progressively (impact area, mechanism, revenue sources, industry, stage)
- Ask explicitly when needed for example matching

**Canvas + Impact Model Together:**
- Canvas: 11 sections (purpose, customers, JTBD, UVP, solution, channels, revenue, costs, advantage, key metrics)
- Impact Model: Issue → Participants → Activities → Outcomes (ST/MT/LT) → Impact
- Both must be filled and improved together

**Correct SLC Section Order:**
1. Purpose
2. Customer Model (customers → jobs → UVP → solution)
3. Impact Model (issue → participants → activities → outcomes → impact)
4. Economic Model (channels → revenue → costs → advantage)
5. Key Metrics

### Important Corrections

**Impact Model Causal Chain (CORRECT):**
Issue → Participants → Activities → Outcomes (ST/MT/LT) → Impact

**NO "Outputs"** - earlier versions included this incorrectly

**Framing:**
- Main goal: Help users develop business model and EXECUTE on it
- Learning enables this, but is NOT the primary outcome
- "Venture progress is outcome; learning enables the process"

**Naming Conventions:**
- Do NOT use module numbers
- Use: "Social Lean Canvas program", "Build program", "Pivot to Purpose program"
- Modules: "Business Model Design", "Improving Your Business Model", "Developing Your Strategy"

## Build Program Structure

From user's guidance:

### Module: Improving Your Business Model
Work through each model separately:
1. Customer Model - assess, understand levers, improve
2. Impact Model - assess, understand levers, improve
3. Economic Model - assess, understand levers, improve

**For each:** Learn more → Assess current state → Understand improvement levers → Improvement process

**Output:** Improved canvas/impact model + list of assumptions per model

### Module: Developing Your Strategy

**Section: Designing Your Strategy**
1. Assessing stage (for each model)
2. Understanding validation
3. Creating validation plans (customer, impact, economic - separately)

**Output:** Validation plan for each of the three models

**Section: Building Your Strategy**
1. Introduction to strategy model
2. Building complete strategy (validation plans + business model strategy + organizational strategy + capital strategy)

**Output:** Complete strategy model

### Important Note
**No system state for validation plans or strategy model** - user manages these externally using downloadable templates. Agent can still guide using knowledge of program content and templates.

## What Build Pedagogy Section Should Cover

Based on SLC pedagogy pattern, the Build section should include:

1. **Educational Goals** - What users accomplish in Build program
2. **Core Concepts** - Key ideas to reinforce (beyond SLC basics)
3. **Module-Specific Guidance** - How to guide through:
   - Improving Your Business Model (for each of 3 models)
   - Designing Your Strategy (stage assessment, validation)
   - Building Your Strategy (complete strategy model)
4. **Common Stuck Points** - Where users struggle in Build (different from SLC)
5. **Working Without State** - How to guide validation plans and strategy without system state
6. **Template Usage** - How to reference downloadable templates

## Builder Profile Context

Users in Build program:
- Have completed SLC program (know those concepts)
- May need reinforcement on SLC concepts (might not understand deeply)
- More committed to process and ready for honest feedback
- Want to know agent knows its stuff
- Need paths forward when work isn't good enough, not just critique

**Tone:**
- Less overtly positive than Explorer
- More serious and professional
- Balance encouragement with reality
- Provide specific next steps when quality is insufficient

## Files to Reference

- **Plan file**: `/Users/rowanyeoman/.claude/plans/enumerated-swimming-sundae.md`
- **Completed pedagogy file**: `knowledge/programs/generic/pedagogy.md`
- **Tone guidelines**: `knowledge/instructions/tone.md`
- **Behavior guidelines**: `knowledge/instructions/behavior.md`

## Build Program Content Location

To write good Build pedagogy, you should read:
- `knowledge/programs/generic/content/4.0 improving-your-business-model/` (if exists)
- `knowledge/programs/generic/content/5.0 developing-your-strategy/` (if exists)
- Any Build-related content in generic program

**Use Glob to find:** `knowledge/programs/generic/content/**/*` and look for Build-related modules

## Success Criteria

Build pedagogy section should:
- Match the quality and depth of SLC pedagogy section
- Cover all Build program modules and sections
- Provide practical guidance agent can use during conversations
- Address Builder profile tone (more serious, honest feedback, paths forward)
- Explain how to guide without system state for validation/strategy
- Include common stuck points specific to Build program
- Reference program content appropriately

## Writing Style

- Second person ("you") addressing the agent
- Practical and actionable
- Use tables for structured information
- Include specific examples where helpful
- Match tone and structure of SLC pedagogy section

## Next Steps

1. Read Build program content thoroughly
2. Understand the improvement and validation methodologies
3. Write comprehensive Build pedagogy section
4. Add to `pedagogy.md`, replacing placeholder
5. Ensure consistency with SLC section style and quality

---

**Branch:** 87-agent-behaviour
**Started:** 2026-01-03
**Handover Date:** 2026-01-03
