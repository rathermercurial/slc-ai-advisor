# API Contracts

REST API endpoints for the SLC AI Advisor.

## Base URL

- Development: `http://localhost:8787`
- Production: `https://slc-ai-advisor.{account}.workers.dev`

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

**Request:**
```json
{
  "program": "generic"  // optional, defaults to "generic"
}
```

**Response (200):**
```json
{
  "sessionId": "uuid",
  "canvasId": "uuid",      // Same as sessionId
  "threadId": "uuid",      // Default thread ID
  "program": "generic"
}
```

### GET /api/session/:id

Check if session exists and get current state.

**Response (200):**
```json
{
  "exists": true,
  "sessionId": "uuid",
  "canvasId": "uuid",
  "threadId": "uuid",
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

**Response (200):**
```json
{
  "canvasId": "uuid",
  "canvas": { /* Full canvas object */ }
}
```

### GET /api/canvas/:id

Get full canvas state.

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

**Request:**
```json
{
  "issue": "Climate change",
  "participants": "Rural farmers",
  "activities": "Training programs",
  "outputs": "Trained farmers",
  "shortTermOutcomes": "Improved practices",
  "mediumTermOutcomes": "Increased yields",
  "longTermOutcomes": "Economic resilience",
  "impact": "Reduced carbon footprint"
}
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
  "impactMechanisms": { /* ... */ },
  "legalStructure": { /* ... */ },
  "revenueSources": { /* ... */ },
  "fundingSources": { /* ... */ },
  "industries": { /* ... */ }
}
```

### PUT /api/canvas/:id/venture-profile

Update a venture property.

**Valid properties:** `ventureStage`, `impactAreas`, `impactMechanisms`, `legalStructure`, `revenueSources`, `fundingSources`, `industries`

**Request:**
```json
{
  "property": "ventureStage",
  "value": "growth-stage",
  "confidence": 0.9,
  "confirmed": true
}
```

**Response (200):** Full venture profile (see GET response)

### GET /api/canvas/:id/properties-for-filtering

Get properties suitable for Selection Matrix filtering.

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

**Response:** File download with appropriate Content-Type and Content-Disposition headers.

### DELETE /api/canvas/:id

Archive (soft-delete) a canvas.

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

**Request:**
```json
{
  "title": "Optional title"  // auto-generated if omitted
}
```

**Response (201):**
```json
{
  "id": "uuid",
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

**Query Parameters:**
- `includeArchived=true` - Include archived threads

**Response (200):**
```json
{
  "threads": [
    {
      "id": "uuid",
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

**Response (200):**
```json
{
  "id": "uuid",
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

**Query Parameters:**
- `limit` - Number of messages (1-50, default: 10)

**Response (200):**
```json
{
  "threadId": "uuid",
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
  "id": "uuid",
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
