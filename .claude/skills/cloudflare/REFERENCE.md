# Cloudflare Quick Reference

## Bindings

### KV (Key-Value)
```typescript
// Read
const value = await env.MY_KV.get("key");
const json = await env.MY_KV.get("key", { type: "json" });

// Write
await env.MY_KV.put("key", "value");
await env.MY_KV.put("key", JSON.stringify(data));

// Delete
await env.MY_KV.delete("key");

// List
const list = await env.MY_KV.list({ prefix: "user:" });
```

### D1 (SQLite)
```typescript
// Query
const { results } = await env.MY_D1.prepare(
  "SELECT * FROM users WHERE id = ?"
).bind(userId).all();

// Insert
await env.MY_D1.prepare(
  "INSERT INTO users (name, email) VALUES (?, ?)"
).bind(name, email).run();

// Batch
await env.MY_D1.batch([
  env.MY_D1.prepare("INSERT INTO users (name) VALUES (?)").bind("Alice"),
  env.MY_D1.prepare("INSERT INTO users (name) VALUES (?)").bind("Bob"),
]);
```

### R2 (Object Storage)
```typescript
// Get
const object = await env.MY_R2.get("file.pdf");
if (object) {
  const data = await object.arrayBuffer();
}

// Put
await env.MY_R2.put("file.pdf", fileData, {
  httpMetadata: { contentType: "application/pdf" }
});

// Delete
await env.MY_R2.delete("file.pdf");

// List
const list = await env.MY_R2.list({ prefix: "uploads/" });
```

### Durable Objects
```typescript
// Get stub
const id = env.MY_DO.idFromName("room-123");
const stub = env.MY_DO.get(id);

// Call method
const response = await stub.fetch(request);

// Durable Object class
export class MyDurableObject extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    // Handle request
  }
}
```

### Queues
```typescript
// Send message
await env.MY_QUEUE.send({ type: "email", to: "user@example.com" });

// Batch send
await env.MY_QUEUE.sendBatch([
  { body: { type: "email", to: "a@example.com" } },
  { body: { type: "email", to: "b@example.com" } },
]);

// Consumer
export default {
  async queue(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      // Process message
      message.ack();
    }
  }
};
```

### Vectorize
```typescript
// Insert vectors
await env.MY_VECTORIZE.insert([
  { id: "doc-1", values: [0.1, 0.2, ...], metadata: { title: "Doc 1" } }
]);

// Query
const results = await env.MY_VECTORIZE.query(queryVector, {
  topK: 10,
  filter: { category: "tech" }
});
```

### Workers AI
```typescript
// Text generation
const response = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
  prompt: "Hello, world!"
});

// Embeddings
const embeddings = await env.AI.run("@cf/baai/bge-base-en-v1.5", {
  text: ["Hello", "World"]
});

// Image generation
const image = await env.AI.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", {
  prompt: "A beautiful sunset"
});
```

## wrangler.jsonc Bindings

```jsonc
{
  "kv_namespaces": [
    { "binding": "MY_KV", "id": "xxx" }
  ],
  "d1_databases": [
    { "binding": "MY_D1", "database_id": "xxx", "database_name": "my-db" }
  ],
  "r2_buckets": [
    { "binding": "MY_R2", "bucket_name": "my-bucket" }
  ],
  "durable_objects": {
    "bindings": [
      { "name": "MY_DO", "class_name": "MyDurableObject" }
    ]
  },
  "queues": {
    "producers": [
      { "binding": "MY_QUEUE", "queue": "my-queue" }
    ]
  },
  "vectorize": [
    { "binding": "MY_VECTORIZE", "index_name": "my-index" }
  ],
  "ai": {
    "binding": "AI"
  }
}
```
