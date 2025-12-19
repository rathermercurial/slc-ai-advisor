# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Status

**Phase:** Discovery / Pre-development
**Target Platform:** Cloudflare (Workers, D1, Vectorize, Durable Objects)

## Project Overview

An AI advisor for social entrepreneurs using the Social Lean Canvas methodology. The system provides intelligent, contextual support by filtering a knowledge base using multi-dimensional venture analysis.

**Key concepts:**
- **Social Lean Canvas**: One-page framework with 11 sections (10 business model + 1 impact model)
- **138-tag taxonomy**: Encoding domain expertise for categorizing social enterprises
- **7 venture dimensions**: Stage, impact area, mechanism, legal structure, revenue source, funding source, industry

## Knowledge Base Structure

```
knowledge/
├── agent-content/
│   ├── canvas-sections/       # Content for each canvas section
│   ├── program-content/       # Video program scripts
│   └── venture-example-libraries/
│       ├── core-venture-example-library/   # Main examples (Patagonia, Toast Ale, etc.)
│       └── p2p-venture-example-library/    # P2P program examples
├── tags/                      # Tag taxonomy definitions
├── lexicon-entry/             # Terminology definitions
└── brief-for-agent-design/    # Project briefs
```

## Key Files

- `knowledge/` - Knowledge base content (362 files)
- `tmp/agent-discovery.md` - Full discovery document
- `tmp/agent-research.md` - Technical landscape research
- `spec/` - Feature specifications (spec-driven workflow)

## Skills

- **spec-driven** - Guides implementation through Requirements → Design → Tasks → Implementation
- **cloudflare** - Cloudflare Workers development (D1, KV, R2, Durable Objects, Vectorize)
