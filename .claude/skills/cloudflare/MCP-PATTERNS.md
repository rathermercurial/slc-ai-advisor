# Cloudflare MCP Server Patterns

When to use each MCP server and common tool combinations.

## Available MCP Servers

| Server | Purpose | Best For |
|--------|---------|----------|
| `cloudflare-docs` | Documentation search | "How do I..." questions, API reference |
| `cloudflare-bindings` | Resource management | Create/list/manage Workers, KV, D1, R2 |
| `cloudflare-builds` | CI/CD debugging | Build failures, deployment status |
| `cloudflare-ai-gateway` | AI request monitoring | Log analysis, cost tracking |
| `cloudflare-browser` | External URL fetching | Fetch docs, screenshots |
| `cloudflare-observability` | Production monitoring | Logs, metrics, traces |

---

## cloudflare-docs

**Use for:** Finding documentation, patterns, API references

```
mcp__cloudflare-docs__search_cloudflare_documentation
  query: "Durable Objects SQLite storage"
```

**When to use:**
- "How do I configure..."
- "What's the syntax for..."
- Looking up API methods
- Finding best practices

---

## cloudflare-bindings

**Use for:** Managing Cloudflare resources

### Workers
```
mcp__cloudflare-bindings__workers_list          # List all workers
mcp__cloudflare-bindings__workers_get_worker    # Get worker details
  scriptName: "slc-ai-advisor"
mcp__cloudflare-bindings__workers_get_worker_code  # Get source code
  scriptName: "slc-ai-advisor"
```

### KV Namespaces
```
mcp__cloudflare-bindings__kv_namespaces_list    # List all KV namespaces
mcp__cloudflare-bindings__kv_namespace_get      # Get KV details
  namespace_id: "xxx"
mcp__cloudflare-bindings__kv_namespace_create   # Create new KV
  title: "my-namespace"
```

### D1 Databases
```
mcp__cloudflare-bindings__d1_databases_list     # List all D1 databases
mcp__cloudflare-bindings__d1_database_get       # Get D1 details
  database_id: "xxx"
mcp__cloudflare-bindings__d1_database_query     # Run SQL query
  database_id: "xxx"
  sql: "SELECT * FROM users LIMIT 10"
```

### R2 Buckets
```
mcp__cloudflare-bindings__r2_buckets_list       # List all R2 buckets
mcp__cloudflare-bindings__r2_bucket_get         # Get bucket details
  name: "my-bucket"
```

### Hyperdrive
```
mcp__cloudflare-bindings__hyperdrive_configs_list  # List Hyperdrive configs
mcp__cloudflare-bindings__hyperdrive_config_get    # Get config details
  hyperdrive_id: "xxx"
```

---

## cloudflare-builds

**Use for:** CI/CD and deployment debugging

```
mcp__cloudflare-builds__workers_list            # List workers
mcp__cloudflare-builds__workers_builds_set_active_worker
  workerId: "xxx"
mcp__cloudflare-builds__workers_builds_list_builds  # List builds
  workerId: "xxx"
mcp__cloudflare-builds__workers_builds_get_build    # Get build details
  buildUUID: "xxx"
mcp__cloudflare-builds__workers_builds_get_build_logs  # Get build logs
  buildUUID: "xxx"
```

**When to use:**
- Deployment failed
- Build errors
- Checking deployment status

---

## cloudflare-ai-gateway

**Use for:** AI request monitoring and debugging

```
mcp__cloudflare-ai-gateway__list_gateways       # List all gateways
mcp__cloudflare-ai-gateway__list_logs           # List request logs
  gateway_id: "xxx"
  per_page: 20
mcp__cloudflare-ai-gateway__get_log_details     # Get log details
  gateway_id: "xxx"
  log_id: "xxx"
mcp__cloudflare-ai-gateway__get_log_request_body   # Get request payload
  gateway_id: "xxx"
  log_id: "xxx"
mcp__cloudflare-ai-gateway__get_log_response_body  # Get response payload
  gateway_id: "xxx"
  log_id: "xxx"
```

**When to use:**
- Debugging AI responses
- Cost analysis
- Token usage tracking
- Error investigation

---

## cloudflare-browser

**Use for:** Fetching external content

```
mcp__cloudflare-browser__get_url_markdown       # Fetch as markdown
  url: "https://developers.cloudflare.com/..."
mcp__cloudflare-browser__get_url_html_content   # Fetch raw HTML
  url: "https://..."
mcp__cloudflare-browser__get_url_screenshot     # Take screenshot
  url: "https://..."
  viewport: { width: 1280, height: 720 }
```

**When to use:**
- Fetching external documentation
- Checking rendered output
- Capturing UI state

---

## Common Workflows

### Debug a Failed Deployment

1. List workers: `workers_list`
2. Set active worker: `workers_builds_set_active_worker`
3. List recent builds: `workers_builds_list_builds`
4. Get failed build logs: `workers_builds_get_build_logs`

### Investigate AI Gateway Issues

1. List gateways: `list_gateways`
2. Filter logs by error: `list_logs` with `success: false`
3. Get details: `get_log_details`
4. Check request/response: `get_log_request_body`, `get_log_response_body`

### Find API Reference

1. Search docs: `search_cloudflare_documentation`
2. If needed, fetch full page: `get_url_markdown`

### Check Production Resources

1. List workers: `workers_list`
2. Get worker details: `workers_get_worker`
3. Check bindings in response
