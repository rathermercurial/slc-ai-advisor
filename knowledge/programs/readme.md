# Programs

Learning programs for the Social Lean Canvas methodology. Each program becomes a Vectorize namespace.

## Available Programs

- `generic/` - Core SLC methodology (default for all users)
- `p2p/` - Person-to-Person program (extends generic with P2P-specific content)

## Structure

Each program contains:
- `content/` - Video scripts, guides, section content
- `examples/` - Venture examples with filled canvases

## Retrieval Priority

When a user is enrolled in a specific program (e.g., p2p), content retrieval prioritizes:
1. Program-specific content (p2p/)
2. Generic content (generic/)

This ensures contextually relevant guidance while falling back to core methodology.
