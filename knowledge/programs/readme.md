# Programs

Learning programs for the Social Lean Canvas. Each program becomes a **Vectorize namespace** for content filtering.

## Available Programs

| Program | Files | Description |
|---------|-------|-------------|
| `generic/` | ~100 | Core SLC methodology (default for all users) |
| `p2p/` | ~36 | Person-to-Person program (extends generic) |

## Directory Structure

```
programs/
├── generic/
│   ├── content/              # Video scripts by module
│   │   ├── 0.0 program-outline/
│   │   ├── 1.0 trailer/
│   │   ├── 2.0 intro/
│   │   ├── 3.0 business-model-design/
│   │   │   ├── 3.1 understanding-business-model-design/
│   │   │   └── 3.2 fill-in-your-canvas/
│   │   ├── 4.0 improving-your-business-model/
│   │   └── 5.0 developing-your-strategy/
│   │
│   └── examples/             # Venture examples
│       ├── patagonia/        # Scale-stage, apparel, trust
│       ├── toast-ale/        # Growth-stage, food-beverage
│       └── ...
│
└── p2p/
    ├── content/              # P2P-specific modules
    ├── examples/             # P2P venture examples
    │   ├── ridwell/
    │   ├── ness-labs/
    │   └── ...
    └── p2p-canvas-program.md # Program overview
```

## Retrieval Priority

When a user selects a program, content retrieval filters by namespace:

1. **Program-specific content** (e.g., p2p/) - highest priority
2. **Generic content** (generic/) - fallback

This ensures contextually relevant guidance while maintaining access to core methodology.

## Content Format

Each file is markdown with YAML frontmatter:

```yaml
---
title: "3.2.1 Purpose"
tags:
  canvas-sections: [purpose]
  content: [program-content]
---

# Purpose

[Video script content...]
```

## See Also

- [tasks.md](../../spec/slc-ai-advisor-mvp/tasks.md) - A2 defines the program structure
- [Example: Patagonia](generic/examples/patagonia/patagonia-slc.md) - Complete venture example
