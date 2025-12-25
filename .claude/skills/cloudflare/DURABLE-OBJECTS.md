# Durable Objects with SQLite

Patterns for Durable Objects with SQLite storage backend, WebSocket hibernation, and alarms.

## Configuration

### wrangler.jsonc

```jsonc
{
  "durable_objects": {
    "bindings": [
      { "name": "USER_SESSION", "class_name": "UserSession" }
    ]
  },
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["UserSession"] }
  ]
}
```

**Key points:**
- Use `new_sqlite_classes` for SQLite backend (not `new_classes`)
- Migration tags must be unique and sequential
- Each class needs explicit binding

---

## Basic Structure

```typescript
import { DurableObject } from "cloudflare:workers";

export class UserSession extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  // RPC method (called directly, no fetch needed)
  async getSessionData(): Promise<SessionData> {
    const result = this.ctx.storage.sql.exec<SessionData>(
      `SELECT * FROM sessions WHERE id = ?`,
      this.ctx.id.toString()
    ).one();
    return result;
  }
}
```

---

## SQLite Storage API

### Basic Queries

```typescript
// Execute query, get all results
const results = this.ctx.storage.sql.exec<Row>(
  `SELECT * FROM users WHERE active = ?`,
  true
).toArray();

// Get single result
const user = this.ctx.storage.sql.exec<User>(
  `SELECT * FROM users WHERE id = ?`,
  userId
).one();

// Insert/Update (no return value needed)
this.ctx.storage.sql.exec(
  `INSERT INTO users (id, name) VALUES (?, ?)`,
  id, name
);
```

### Table Creation

```typescript
// In constructor or lazy initialization
this.ctx.storage.sql.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    data TEXT
  )
`);
```

### Transactions

```typescript
// All operations between awaits are atomic
const balance = this.ctx.storage.sql.exec<{balance: number}>(
  `SELECT balance FROM accounts WHERE id = ?`, accountId
).one()?.balance ?? 0;

this.ctx.storage.sql.exec(
  `UPDATE accounts SET balance = ? WHERE id = ?`,
  balance - amount, accountId
);
// Atomic commit happens here
```

---

## WebSocket Hibernation

Hibernation reduces memory by persisting WebSocket connections when idle.

### Accept Connection

```typescript
async fetch(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/websocket") {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept with hibernation
    this.ctx.acceptWebSocket(server);

    // Optionally attach data
    server.serializeAttachment({ userId: "123" });

    return new Response(null, { status: 101, webSocket: client });
  }

  return new Response("Not Found", { status: 404 });
}
```

### Hibernation Handlers

```typescript
// Called when message received (wakes from hibernation)
async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
  const data = JSON.parse(message as string);
  const attachment = ws.deserializeAttachment() as { userId: string };

  // Process message
  if (data.type === "chat") {
    this.broadcast({ type: "message", from: attachment.userId, text: data.text });
  }
}

// Called when connection closes
async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
  // Cleanup
}

// Called on error
async webSocketError(ws: WebSocket, error: unknown) {
  console.error("WebSocket error:", error);
}
```

### Broadcast to All Connections

```typescript
broadcast(message: object) {
  const sockets = this.ctx.getWebSockets();
  for (const ws of sockets) {
    ws.send(JSON.stringify(message));
  }
}
```

### Tagged WebSockets

```typescript
// Accept with tags for filtering
this.ctx.acceptWebSocket(server, ["room:123", "user:456"]);

// Get sockets by tag
const roomSockets = this.ctx.getWebSockets("room:123");
for (const ws of roomSockets) {
  ws.send(JSON.stringify({ type: "room_update" }));
}
```

---

## Alarms API

Schedule deferred execution within a Durable Object.

### Set Alarm

```typescript
// Schedule for specific time
await this.ctx.storage.setAlarm(Date.now() + 60000); // 1 minute

// Check existing alarm
const currentAlarm = await this.ctx.storage.getAlarm();
if (!currentAlarm) {
  await this.ctx.storage.setAlarm(Date.now() + 60000);
}

// Cancel alarm
await this.ctx.storage.deleteAlarm();
```

### Alarm Handler

```typescript
async alarm(alarmInfo: { retryCount: number; isRetry: boolean }): Promise<void> {
  // Execute scheduled task
  const pendingTasks = this.ctx.storage.sql.exec<Task>(
    `SELECT * FROM tasks WHERE due_at <= ?`,
    Date.now()
  ).toArray();

  for (const task of pendingTasks) {
    await this.processTask(task);
    this.ctx.storage.sql.exec(
      `DELETE FROM tasks WHERE id = ?`,
      task.id
    );
  }

  // Reschedule if more tasks pending
  const nextTask = this.ctx.storage.sql.exec<{due_at: number}>(
    `SELECT due_at FROM tasks ORDER BY due_at LIMIT 1`
  ).one();

  if (nextTask) {
    await this.ctx.storage.setAlarm(nextTask.due_at);
  }
}
```

---

## RPC Methods

Prefer RPC over fetch for inter-Worker communication.

### Define RPC Method

```typescript
export class Counter extends DurableObject<Env> {
  // Public methods are automatically RPC-callable
  async increment(): Promise<number> {
    const current = this.ctx.storage.sql.exec<{count: number}>(
      `SELECT count FROM counters WHERE id = 'default'`
    ).one()?.count ?? 0;

    const newCount = current + 1;
    this.ctx.storage.sql.exec(
      `INSERT OR REPLACE INTO counters (id, count) VALUES ('default', ?)`,
      newCount
    );

    return newCount;
  }
}
```

### Call RPC Method

```typescript
// In Worker
const id = env.COUNTER.idFromName("my-counter");
const stub = env.COUNTER.get(id);
const count = await stub.increment(); // Direct call, no fetch
```

---

## Getting Durable Object Stub

### By Name (Deterministic)

```typescript
const id = env.USER_SESSION.idFromName("user-123");
const stub = env.USER_SESSION.get(id);
```

### New Unique ID

```typescript
const id = env.USER_SESSION.newUniqueId();
const stub = env.USER_SESSION.get(id);
```

### From String (Reconstruct)

```typescript
const id = env.USER_SESSION.idFromString(storedIdString);
const stub = env.USER_SESSION.get(id);
```

---

## Best Practices

1. **Use SQLite for structured data** - Prefer SQL over KV for complex queries
2. **WebSocket hibernation always** - Reduces memory, scales better
3. **Single alarm per object** - Use task queue pattern for multiple events
4. **RPC over fetch** - Cleaner API, better typing
5. **Atomic operations** - Operations without `await` between them are atomic
6. **Check alarms in constructor** - Avoid overwriting existing alarms
