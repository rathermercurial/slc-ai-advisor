# Vectorize with Metadata Filtering

Patterns for Vectorize vector database with metadata filtering for the Selection Matrix.

## Configuration

### wrangler.jsonc

```jsonc
{
  "vectorize": [
    { "binding": "VECTORIZE", "index_name": "slc-knowledge" }
  ],
  "ai": {
    "binding": "AI"
  }
}
```

### Create Index (CLI)

```bash
# Create index with bge-m3 dimensions (1024)
npx wrangler vectorize create slc-knowledge \
  --dimensions 1024 \
  --metric cosine

# Create with metadata indexes for filtering
npx wrangler vectorize create slc-knowledge \
  --dimensions 1024 \
  --metric cosine \
  --metadata-index stage:string \
  --metadata-index impact_area:string \
  --metadata-index mechanism:string
```

---

## Project-Specific: Selection Matrix Dimensions

The SLC AI Advisor filters knowledge by 7 venture dimensions:

| Dimension | Type | Example Values |
|-----------|------|----------------|
| `stage` | string | "idea", "validation", "growth", "scale" |
| `impact_area` | string | "healthcare", "education", "environment" |
| `mechanism` | string | "direct", "advocacy", "platform" |
| `legal_structure` | string | "nonprofit", "b-corp", "cooperative" |
| `revenue_source` | string | "sales", "grants", "subscriptions" |
| `funding_source` | string | "bootstrapped", "venture", "foundation" |
| `industry` | string | "tech", "services", "manufacturing" |

---

## Generating Embeddings

### Using Workers AI (bge-m3)

```typescript
// Generate embedding for query
const response = await env.AI.run("@cf/baai/bge-m3", {
  text: [userQuery]
});

// IMPORTANT: Extract from .data[0]
const queryVector = response.data[0];
```

### Batch Embeddings

```typescript
const texts = ["Document 1 content", "Document 2 content"];
const response = await env.AI.run("@cf/baai/bge-m3", {
  text: texts
});

// response.data is array of embeddings
const embeddings = response.data; // [embedding1, embedding2]
```

---

## Inserting Vectors

### Single Insert

```typescript
await env.VECTORIZE.insert([{
  id: "doc-123",
  values: embedding, // number[] from bge-m3
  metadata: {
    title: "Patagonia Case Study",
    stage: "scale",
    impact_area: "environment",
    mechanism: "direct",
    program: "generic",
    content: "First 500 chars of content..."
  }
}]);
```

### Batch Insert

```typescript
const vectors = documents.map((doc, i) => ({
  id: doc.id,
  values: embeddings[i],
  metadata: {
    title: doc.title,
    stage: doc.stage,
    impact_area: doc.impactArea,
    program: doc.program
  }
}));

// Insert in batches of 100
for (let i = 0; i < vectors.length; i += 100) {
  await env.VECTORIZE.insert(vectors.slice(i, i + 100));
}
```

### Upsert (Insert or Replace)

```typescript
await env.VECTORIZE.upsert([{
  id: "doc-123",
  values: newEmbedding,
  metadata: { /* updated metadata */ }
}]);
```

---

## Querying Vectors

### Basic Query

```typescript
const results = await env.VECTORIZE.query(queryVector, {
  topK: 10,
  returnMetadata: "all"
});

// results.matches: Array<{ id, score, metadata }>
for (const match of results.matches) {
  console.log(match.id, match.score, match.metadata?.title);
}
```

### With Metadata Filtering (Selection Matrix)

```typescript
// Filter by venture dimensions
const results = await env.VECTORIZE.query(queryVector, {
  topK: 10,
  returnMetadata: "all",
  filter: {
    stage: "validation",
    impact_area: "healthcare"
  }
});
```

### Complex Filters

```typescript
// Multiple values (OR within field)
const results = await env.VECTORIZE.query(queryVector, {
  topK: 10,
  filter: {
    stage: { $in: ["idea", "validation"] },
    impact_area: "healthcare"
  }
});

// Exclude values
const results = await env.VECTORIZE.query(queryVector, {
  topK: 10,
  filter: {
    stage: { $ne: "scale" }
  }
});
```

### With Namespace Filtering

```typescript
// Filter by program namespace
const results = await env.VECTORIZE.query(queryVector, {
  topK: 10,
  namespace: "generic", // or "p2p"
  returnMetadata: "all"
});
```

---

## Selection Matrix Query Pattern

```typescript
interface SelectionMatrix {
  stage?: string;
  impactArea?: string;
  mechanism?: string;
  legalStructure?: string;
  revenueSource?: string;
  fundingSource?: string;
  industry?: string;
}

async function queryWithMatrix(
  env: Env,
  query: string,
  matrix: SelectionMatrix,
  program: string = "generic"
): Promise<VectorizeMatch[]> {
  // Generate query embedding
  const response = await env.AI.run("@cf/baai/bge-m3", {
    text: [query]
  });
  const queryVector = response.data[0];

  // Build filter from matrix
  const filter: Record<string, string> = {};
  if (matrix.stage) filter.stage = matrix.stage;
  if (matrix.impactArea) filter.impact_area = matrix.impactArea;
  if (matrix.mechanism) filter.mechanism = matrix.mechanism;
  if (matrix.legalStructure) filter.legal_structure = matrix.legalStructure;
  if (matrix.revenueSource) filter.revenue_source = matrix.revenueSource;
  if (matrix.fundingSource) filter.funding_source = matrix.fundingSource;
  if (matrix.industry) filter.industry = matrix.industry;

  // Query with filters
  const results = await env.VECTORIZE.query(queryVector, {
    topK: 10,
    namespace: program,
    filter: Object.keys(filter).length > 0 ? filter : undefined,
    returnMetadata: "all"
  });

  return results.matches;
}
```

---

## Metadata Indexing

### Configure Before Inserting

```bash
# Add metadata indexes to existing index
npx wrangler vectorize update slc-knowledge \
  --metadata-index stage:string \
  --metadata-index impact_area:string
```

**Key points:**
- Index metadata fields BEFORE inserting vectors with those fields
- Up to 10 metadata indexes per Vectorize index
- String indexes store first 64 bytes
- Use low-cardinality values for best performance

### Cardinality Considerations

**Good (low cardinality):**
- `stage`: 4 values (idea, validation, growth, scale)
- `impact_area`: ~10 values

**Avoid (high cardinality):**
- Unique IDs
- Timestamps
- Free-form text

---

## Deleting Vectors

### By ID

```typescript
await env.VECTORIZE.deleteByIds(["doc-123", "doc-456"]);
```

### All in Namespace

```typescript
// List all, then delete
const listed = await env.VECTORIZE.list({ namespace: "old-program" });
const ids = listed.vectors.map(v => v.id);
await env.VECTORIZE.deleteByIds(ids);
```

---

## Listing Vectors

```typescript
// Paginated listing
let cursor: string | undefined;
do {
  const result = await env.VECTORIZE.list({
    namespace: "generic",
    cursor,
    limit: 100
  });

  for (const vector of result.vectors) {
    console.log(vector.id);
  }

  cursor = result.cursor;
} while (cursor);
```

---

## Best Practices

1. **Use bge-m3 for multilingual** - 1024 dimensions, good quality
2. **Batch inserts** - Up to 100 vectors per call
3. **Index metadata early** - Before inserting vectors
4. **Low cardinality filters** - Best performance
5. **Namespace by program** - Clean separation
6. **Store content snippet** - Avoid extra lookups
7. **Cosine metric** - Standard for text embeddings
