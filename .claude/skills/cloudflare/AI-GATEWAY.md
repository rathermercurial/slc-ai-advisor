# AI Gateway

Patterns for routing AI requests through Cloudflare AI Gateway.

## Overview

AI Gateway provides:
- Unified endpoint for multiple AI providers
- Caching to reduce costs and latency
- Rate limiting and access control
- Request/response logging
- Analytics and cost tracking

---

## Endpoint Formats

### Unified API (OpenAI-Compatible)

```
https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/compat/chat/completions
```

Works with OpenAI SDK by changing base URL:

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/anthropic`
});
```

### Provider-Specific Endpoints

```
# Anthropic
https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/anthropic

# OpenAI
https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai

# Workers AI
https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/workers-ai
```

---

## Workers Integration

### Using AI Binding with Gateway

```typescript
const response = await env.AI.run(
  "@cf/meta/llama-3.1-8b-instruct",
  { prompt: "Hello, world!" },
  {
    gateway: {
      id: "my-gateway-id",
      skipCache: false,
      cacheTtl: 3600
    }
  }
);
```

### Get Log ID from Response

```typescript
const response = await env.AI.run(/* ... */);
const logId = env.AI.aiGatewayLogId; // For feedback/debugging
```

### Submit Feedback

```typescript
await env.AI.gateway("my-gateway-id").patchLog(logId, {
  feedback: 1, // 1 = positive, -1 = negative, 0 = neutral
  metadata: {
    userId: "123",
    sessionId: "abc"
  }
});
```

---

## Caching

### Enable Caching

Caching is automatic for supported endpoints. Control via headers:

```typescript
const response = await fetch(gatewayUrl, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "cf-aig-cache-ttl": "3600" // Cache for 1 hour
  },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    messages: [{ role: "user", content: "Hello" }]
  })
});

// Check cache status
const cacheStatus = response.headers.get("cf-aig-cache-status");
// "HIT" | "MISS" | "BYPASS"
```

### Skip Cache

```typescript
headers: {
  "cf-aig-skip-cache": "true"
}
```

### Custom Cache Key

```typescript
headers: {
  "cf-aig-cache-key": `user-${userId}-query-${queryHash}`
}
```

---

## Rate Limiting

### Configure in Dashboard

1. Go to AI Gateway → Select Gateway
2. Configure rate limits per gateway or per-request

### Per-Request Headers

```typescript
headers: {
  "cf-aig-rate-limit-key": userId // Rate limit per user
}
```

---

## Logging and Analytics

### View Logs via MCP

```typescript
// List recent logs
mcp__cloudflare-ai-gateway__list_logs({
  gateway_id: "my-gateway",
  per_page: 20
});

// Filter by status
mcp__cloudflare-ai-gateway__list_logs({
  gateway_id: "my-gateway",
  success: false // Only errors
});

// Get log details
mcp__cloudflare-ai-gateway__get_log_details({
  gateway_id: "my-gateway",
  log_id: "abc123"
});

// Get request/response bodies
mcp__cloudflare-ai-gateway__get_log_request_body({
  gateway_id: "my-gateway",
  log_id: "abc123"
});
```

### Log Fields

| Field | Description |
|-------|-------------|
| `id` | Unique log ID |
| `created_at` | Timestamp |
| `provider` | AI provider (anthropic, openai, workers-ai) |
| `model` | Model used |
| `success` | Request succeeded |
| `cached` | Response from cache |
| `tokens_in` | Input tokens |
| `tokens_out` | Output tokens |
| `cost` | Estimated cost |
| `duration` | Response time (ms) |

---

## Provider Configuration

### Anthropic via Gateway

```typescript
const response = await fetch(
  `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/anthropic/v1/messages`,
  {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY,
      "Content-Type": "application/json",
      "anthropic-version": "2024-01-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: "Hello" }]
    })
  }
);
```

### Workers AI via Gateway

```typescript
const response = await fetch(
  `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/workers-ai/@cf/meta/llama-3.1-8b-instruct`,
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Hello" }]
    })
  }
);
```

---

## Fallback Configuration

### Universal Endpoint with Fallbacks

```typescript
const response = await fetch(
  `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([
      {
        provider: "anthropic",
        endpoint: "v1/messages",
        headers: { "x-api-key": env.ANTHROPIC_API_KEY },
        query: {
          model: "claude-sonnet-4-20250514",
          messages: [{ role: "user", content: "Hello" }]
        }
      },
      {
        provider: "openai",
        endpoint: "chat/completions",
        headers: { "Authorization": `Bearer ${env.OPENAI_API_KEY}` },
        query: {
          model: "gpt-4",
          messages: [{ role: "user", content: "Hello" }]
        }
      }
    ])
  }
);

// Check which provider was used
const step = response.headers.get("cf-aig-step"); // "0" or "1"
```

---

## Debugging Workflow

### 1. Check Recent Errors

```typescript
// Via MCP
mcp__cloudflare-ai-gateway__list_logs({
  gateway_id: "my-gateway",
  success: false,
  per_page: 10
});
```

### 2. Get Error Details

```typescript
mcp__cloudflare-ai-gateway__get_log_details({
  gateway_id: "my-gateway",
  log_id: errorLogId
});
```

### 3. Inspect Request/Response

```typescript
// What was sent
mcp__cloudflare-ai-gateway__get_log_request_body({
  gateway_id: "my-gateway",
  log_id: errorLogId
});

// What was returned
mcp__cloudflare-ai-gateway__get_log_response_body({
  gateway_id: "my-gateway",
  log_id: errorLogId
});
```

---

## Best Practices

1. **Use caching** - Reduce costs for repeated queries
2. **Enable logging** - Debug issues with request/response bodies
3. **Set TTL appropriately** - Balance freshness vs. cost
4. **Rate limit by user** - Prevent abuse
5. **Monitor costs** - Use analytics dashboard
6. **Configure fallbacks** - Ensure reliability with backup providers
