# API Reference

REST API and WebSocket endpoints for the SLC AI Advisor.

## Base URLs

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:8787` |
| Production | `https://slc-ai-advisor.{account}.workers.dev` |

## Common Patterns

### Request IDs

All requests return `X-Request-ID` header for tracing.

### UUID Validation

Canvas IDs and Thread IDs must be valid UUIDs:
```
^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$
```

### Error Response Format

```json
{
  "error": "Error message",
  "details": "Optional details"
}
```

---

## Session Endpoints

### POST /api/session

Create a new session with canvas and default thread.

```bash
curl -X POST http://localhost:8787/api/session \
  -H "Content-Type: application/json" \
  -d '{"program": "generic"}'
```

**Request:**
```json
{
  "program": "generic"  // optional, defaults to "generic"
}
```

**Response (200):**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "canvasId": "550e8400-e29b-41d4-a716-446655440000",
  "threadId": "550e8400-e29b-41d4-a716-446655440000",
  "program": "generic"
}
```

### GET /api/session/:id

Check if session exists and get current state.

```bash
curl http://localhost:8787/api/session/550e8400-e29b-41d4-a716-446655440000
```

**Response (200):**
```json
{
  "exists": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "canvasId": "550e8400-e29b-41d4-a716-446655440000",
  "threadId": "550e8400-e29b-41d4-a716-446655440000",
  "completionPercentage": 15
}
```

**Response (404):**
```json
{
  "exists": false
}
```

---

## Canvas Endpoints

### POST /api/canvas

Create a new canvas.

```bash
curl -X POST http://localhost:8787/api/canvas
```

**Response (200):**
```json
{
  "canvasId": "550e8400-e29b-41d4-a716-446655440000",
  "canvas": { /* Full canvas object */ }
}
```

### GET /api/canvas/:id

Get full canvas state.

```bash
curl http://localhost:8787/api/canvas/550e8400-e29b-41d4-a716-446655440000
```

**Response (200):**
```json
{
  "name": "Untitled Canvas",
  "sections": {
    "purpose": "",
    "customers": "",
    "jobsToBeDone": "",
    "valueProposition": "",
    "solution": "",
    "channels": "",
    "revenue": "",
    "costs": "",
    "keyMetrics": "",
    "advantage": "",
    "impact": ""
  },
  "impactModel": {
    "issue": "",
    "participants": "",
    "activities": "",
    "outputs": "",
    "shortTermOutcomes": "",
    "mediumTermOutcomes": "",
    "longTermOutcomes": "",
    "impact": "",
    "isComplete": false
  },
  "ventureProfile": {
    "ventureStage": null,
    "impactAreas": [],
    "impactMechanisms": [],
    "legalStructure": null,
    "revenueSources": [],
    "fundingSources": [],
    "industries": []
  },
  "completionPercentage": 0,
  "starred": false,
  "archived": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/canvas/:id/meta

Get canvas metadata only (lighter response).

```bash
curl http://localhost:8787/api/canvas/550e8400-e29b-41d4-a716-446655440000/meta
```

**Response (200):**
```json
{
  "name": "My Venture",
  "starred": false,
  "archived": false,
  "completionPercentage": 45,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### PUT /api/canvas/:id/name

Update canvas name.

```bash
curl -X PUT http://localhost:8787/api/canvas/550e8400-e29b-41d4-a716-446655440000/name \
  -H "Content-Type: application/json" \
  -d '{"name": "My Social Venture"}'
```

**Request:**
```json
{
  "name": "New Canvas Name"
}
```

**Response (200):**
```json
{
  "success": true
}
```

### PUT /api/canvas/:id/section/:key

Update a canvas section.

**Valid section keys:** `purpose`, `customers`, `jobsToBeDone`, `valueProposition`, `solution`, `channels`, `revenue`, `costs`, `keyMetrics`, `advantage`, `impact`

```bash
curl -X PUT http://localhost:8787/api/canvas/550e8400-e29b-41d4-a716-446655440000/section/purpose \
  -H "Content-Type: application/json" \
  -d '{"content": "To help social entrepreneurs build sustainable ventures that create positive impact in their communities."}'
```

**Request:**
```json
{
  "content": "Section content text"
}
```

**Response (200):**
```json
{
  "success": true,
  "section": "purpose",
  "content": "Section content text"
}
```

**Response (422 - Validation Error):**
```json
{
  "success": false,
  "error": "Content too large"
}
```

**Response (413 - Content Too Large):**
```json
{
  "error": "Content too large (max 50KB)"
}
```

### PUT /api/canvas/:id/impact

Update full impact model.

```bash
curl -X PUT http://localhost:8787/api/canvas/550e8400-e29b-41d4-a716-446655440000/impact \
  -H "Content-Type: application/json" \
  -d '{
    "issue": "Climate change affecting rural farmers",
    "participants": "Smallholder farmers in developing regions",
    "activities": "Training programs and technology provision",
    "outputs": "Trained farmers with access to tools",
    "shortTermOutcomes": "Improved farming practices",
    "mediumTermOutcomes": "Increased crop yields",
    "longTermOutcomes": "Economic resilience",
    "impact": "Reduced carbon footprint"
  }'
```

**Response (200):**
```json
{
  "success": true
}
```

### GET /api/canvas/:id/model/:model

Get a specific model view.

**Valid models:** `customer`, `economic`, `impact`

```bash
curl http://localhost:8787/api/canvas/550e8400-e29b-41d4-a716-446655440000/model/customer
```

**Response (200) - Customer Model:**
```json
{
  "customers": "content",
  "jobsToBeDone": "content",
  "valueProposition": "content",
  "solution": "content"
}
```

### GET /api/canvas/:id/venture-profile

Get venture profile (dimension values).

```bash
curl http://localhost:8787/api/canvas/550e8400-e29b-41d4-a716-446655440000/venture-profile
```

**Response (200):**
```json
{
  "ventureStage": {
    "value": "early-stage",
    "confidence": 0.8,
    "confirmed": true,
    "source": "user"
  },
  "impactAreas": {
    "value": ["healthcare", "education"],
    "confidence": 0.7,
    "confirmed": false,
    "source": "inferred"
  },
  "impactMechanisms": { },
  "legalStructure": { },
  "revenueSources": { },
  "fundingSources": { },
  "industries": { }
}
```

### PUT /api/canvas/:id/venture-profile

Update a venture property.

**Valid properties:** `ventureStage`, `impactAreas`, `impactMechanisms`, `legalStructure`, `revenueSources`, `fundingSources`, `industries`

```bash
curl -X PUT http://localhost:8787/api/canvas/550e8400-e29b-41d4-a716-446655440000/venture-profile \
  -H "Content-Type: application/json" \
  -d '{
    "property": "ventureStage",
    "value": "growth-stage",
    "confidence": 0.9,
    "confirmed": true
  }'
```

**Response (200):** Full venture profile (see GET response)

### GET /api/canvas/:id/properties-for-filtering

Get properties suitable for Selection Matrix filtering (high confidence only).

```bash
curl http://localhost:8787/api/canvas/550e8400-e29b-41d4-a716-446655440000/properties-for-filtering
```

**Response (200):**
```json
{
  "ventureStage": "early-stage",
  "impactAreas": ["healthcare"],
  "industries": ["technology"]
}
```

### PUT /api/canvas/:id/current-section

Set the current active section (for UI focus tracking).

```bash
curl -X PUT http://localhost:8787/api/canvas/550e8400-e29b-41d4-a716-446655440000/current-section \
  -H "Content-Type: application/json" \
  -d '{"section": "purpose"}'
```

**Request:**
```json
{
  "section": "purpose"  // or null to clear
}
```

**Response (200):**
```json
{
  "success": true
}
```

### GET /api/canvas/:id/export/:format

Export canvas in specified format.

**Valid formats:** `json`, `md`

```bash
# Export as JSON
curl http://localhost:8787/api/canvas/550e8400-e29b-41d4-a716-446655440000/export/json \
  -o canvas.json

# Export as Markdown
curl http://localhost:8787/api/canvas/550e8400-e29b-41d4-a716-446655440000/export/md \
  -o canvas.md
```

**Response:** File download with appropriate Content-Type and Content-Disposition headers.

### DELETE /api/canvas/:id

Archive (soft-delete) a canvas.

```bash
curl -X DELETE http://localhost:8787/api/canvas/550e8400-e29b-41d4-a716-446655440000
```

**Response (200):**
```json
{
  "success": true
}
```

---

## Thread Endpoints

### POST /api/canvas/:canvasId/threads

Create a new conversation thread.

```bash
curl -X POST http://localhost:8787/api/canvas/550e8400-e29b-41d4-a716-446655440000/threads \
  -H "Content-Type: application/json" \
  -d '{"title": "Revenue discussion"}'
```

**Request:**
```json
{
  "title": "Optional title"  // auto-generated if omitted
}
```

**Response (201):**
```json
{
  "id": "661e8400-e29b-41d4-a716-446655440001",
  "title": null,
  "summary": null,
  "starred": false,
  "archived": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastMessageAt": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/canvas/:canvasId/threads

List all threads for a canvas.

```bash
# Exclude archived
curl http://localhost:8787/api/canvas/550e8400-e29b-41d4-a716-446655440000/threads

# Include archived
curl "http://localhost:8787/api/canvas/550e8400-e29b-41d4-a716-446655440000/threads?includeArchived=true"
```

**Query Parameters:**
- `includeArchived=true` - Include archived threads

**Response (200):**
```json
{
  "threads": [
    {
      "id": "661e8400-e29b-41d4-a716-446655440001",
      "title": "Revenue discussion",
      "summary": "Explored subscription models...",
      "starred": true,
      "archived": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastMessageAt": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

### GET /api/canvas/:canvasId/threads/:threadId

Get a specific thread.

```bash
curl http://localhost:8787/api/canvas/550e8400-e29b-41d4-a716-446655440000/threads/661e8400-e29b-41d4-a716-446655440001
```

**Response (200):**
```json
{
  "id": "661e8400-e29b-41d4-a716-446655440001",
  "title": "Revenue discussion",
  "summary": "Explored subscription models...",
  "starred": false,
  "archived": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastMessageAt": "2024-01-02T00:00:00.000Z"
}
```

**Response (404):**
```json
{
  "error": "Thread not found"
}
```

### GET /api/canvas/:canvasId/threads/:threadId/messages

Get messages from a thread.

```bash
curl "http://localhost:8787/api/canvas/550e8400-e29b-41d4-a716-446655440000/threads/661e8400-e29b-41d4-a716-446655440001/messages?limit=20"
```

**Query Parameters:**
- `limit` - Number of messages (1-50, default: 10)

**Response (200):**
```json
{
  "threadId": "661e8400-e29b-41d4-a716-446655440001",
  "messages": [
    {
      "role": "user",
      "content": "How should I define my revenue model?",
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    {
      "role": "assistant",
      "content": "Based on your impact-first approach...",
      "timestamp": "2024-01-01T00:00:01.000Z"
    }
  ]
}
```

### PUT /api/canvas/:canvasId/threads/:threadId

Update thread metadata.

```bash
curl -X PUT http://localhost:8787/api/canvas/550e8400-e29b-41d4-a716-446655440000/threads/661e8400-e29b-41d4-a716-446655440001 \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated title", "starred": true}'
```

**Request:**
```json
{
  "title": "New title",
  "summary": "Updated summary",
  "starred": true
}
```

**Response (200):**
```json
{
  "id": "661e8400-e29b-41d4-a716-446655440001",
  "title": "New title",
  "summary": "Updated summary",
  "starred": true,
  "archived": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastMessageAt": "2024-01-02T00:00:00.000Z"
}
```

### DELETE /api/canvas/:canvasId/threads/:threadId

Archive (soft-delete) a thread.

```bash
curl -X DELETE http://localhost:8787/api/canvas/550e8400-e29b-41d4-a716-446655440000/threads/661e8400-e29b-41d4-a716-446655440001
```

**Response (200):**
```json
{
  "success": true
}
```

---

## WebSocket Endpoints

### /agents/slc-agent/:threadId

Connect to the AI agent for a conversation thread.

**URL Pattern:**
```
ws://localhost:8787/agents/slc-agent/{threadId}?canvasId={canvasId}
```

**Query Parameters:**
- `canvasId` (required) - The canvas this thread belongs to

**Protocol:** Uses Cloudflare Agents SDK WebSocket protocol.

**Example (JavaScript):**
```javascript
const ws = new WebSocket(
  `ws://localhost:8787/agents/slc-agent/${threadId}?canvasId=${canvasId}`
);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle AgentState sync, text streaming, etc.
};

// Send message
ws.send(JSON.stringify({
  role: 'user',
  content: 'Help me define my purpose statement'
}));
```

**AgentState (synced to clients):**
```typescript
{
  status: 'idle' | 'thinking' | 'searching' | 'updating' | 'error';
  statusMessage: string;
  canvas: CanvasState | null;
  canvasUpdatedAt: string | null;
  canvasId: string | null;
  threadId: string | null;
  // P1: Configuration & State
  toneProfile: 'beginner' | 'experienced';
  sessionStatus: 'new' | 'in_progress' | 'paused' | 'complete';
  sessionStartedAt: string | null;
  completionPercentage: number;
}
```

**Message Metadata (optional):**

Messages can include metadata to configure agent behavior:
```json
{
  "role": "user",
  "content": "...",
  "metadata": {
    "toneProfile": "experienced"
  }
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (invalid input) |
| 404 | Not Found |
| 413 | Payload Too Large |
| 422 | Unprocessable Entity (validation failed) |
| 500 | Internal Server Error |

---

## Rate Limiting

- 100 requests/minute per session
- WebSocket connections limited to 1 per thread

---

## Testing with curl

### Full Workflow Example

```bash
# 1. Create a session
SESSION=$(curl -s -X POST http://localhost:8787/api/session | jq -r '.sessionId')
echo "Session: $SESSION"

# 2. Update purpose
curl -X PUT "http://localhost:8787/api/canvas/$SESSION/section/purpose" \
  -H "Content-Type: application/json" \
  -d '{"content": "To empower underserved communities through accessible financial education and tools."}'

# 3. Check completion
curl "http://localhost:8787/api/canvas/$SESSION/meta" | jq '.completionPercentage'

# 4. Export as markdown
curl "http://localhost:8787/api/canvas/$SESSION/export/md"
```
