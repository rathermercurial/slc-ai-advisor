# Cloudflare Agents SDK

Patterns for building AI agents with the Cloudflare Agents SDK.

## Installation

```bash
npm install agents
```

## Configuration

### wrangler.jsonc

```jsonc
{
  "durable_objects": {
    "bindings": [
      { "name": "AI_ADVISOR", "class_name": "AIAdvisor" }
    ]
  },
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["AIAdvisor"] }
  ],
  "ai": {
    "binding": "AI"
  }
}
```

---

## AIChatAgent Class

Base class for chat agents with built-in message handling.

```typescript
import { AIChatAgent } from "agents/ai-chat-agent";
import type { Message } from "agents/ai-chat-agent";

export class AIAdvisor extends AIChatAgent<Env> {
  // Called when chat message received
  async onChatMessage(
    onFinish: (response: Message) => void
  ): Promise<Response | undefined> {
    // Get message history
    const messages = await this.getMessages();

    // Generate response using AI
    const response = await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    });

    // Save and return response
    const assistantMessage: Message = {
      role: "assistant",
      content: response.response
    };

    await this.saveMessages([...messages, assistantMessage]);
    onFinish(assistantMessage);

    return undefined; // Let SDK handle response
  }

  // Optional: Custom message persistence
  async saveMessages(messages: Message[]): Promise<void> {
    this.ctx.storage.sql.exec(
      `INSERT OR REPLACE INTO messages (id, data) VALUES (?, ?)`,
      "conversation",
      JSON.stringify(messages)
    );
  }

  async getMessages(): Promise<Message[]> {
    const result = this.ctx.storage.sql.exec<{data: string}>(
      `SELECT data FROM messages WHERE id = ?`,
      "conversation"
    ).one();
    return result ? JSON.parse(result.data) : [];
  }
}
```

---

## State Management

### Using setState()

```typescript
interface AgentState {
  canvas: CanvasData;
  dimensions: SelectionMatrix;
  confidence: number;
}

export class AIAdvisor extends AIChatAgent<Env, AgentState> {
  async updateCanvas(section: string, content: string): Promise<void> {
    const currentState = this.getState();

    this.setState({
      ...currentState,
      canvas: {
        ...currentState.canvas,
        [section]: content
      }
    });
  }

  // State changes broadcast to all connected clients
  onStateUpdate(state: AgentState): void {
    // React to state changes
    console.log("State updated:", state);
  }
}
```

### Using SQL Storage

```typescript
// Direct SQL access via this.sql
async saveVenture(venture: Venture): Promise<void> {
  this.ctx.storage.sql.exec(`
    INSERT OR REPLACE INTO ventures (id, name, data)
    VALUES (?, ?, ?)
  `, venture.id, venture.name, JSON.stringify(venture));
}

async getVenture(id: string): Promise<Venture | null> {
  const result = this.ctx.storage.sql.exec<{data: string}>(
    `SELECT data FROM ventures WHERE id = ?`,
    id
  ).one();
  return result ? JSON.parse(result.data) : null;
}
```

---

## Task Scheduling

### One-Time Tasks

```typescript
// Schedule for specific time
await this.schedule(
  new Date(Date.now() + 60000), // 1 minute from now
  "sendReminder",
  { userId: "123", message: "Check your canvas" }
);

// The method to be called
async sendReminder(payload: { userId: string; message: string }): Promise<void> {
  // Send notification
  await this.notifyUser(payload.userId, payload.message);
}
```

### Recurring Tasks

```typescript
// Schedule daily at 8 AM
await this.schedule(
  "0 8 * * *", // Cron expression
  "dailyDigest",
  { type: "summary" }
);
```

### Cancel Scheduled Task

```typescript
const schedule = await this.schedule(/* ... */);
await this.cancelSchedule(schedule.id);
```

---

## Frontend Integration: useAgentChat

### React Hook Usage

```typescript
import { useAgentChat } from "agents/react";

function ChatInterface() {
  const {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    error
  } = useAgentChat({
    agent: "ai-advisor", // Agent class name
    name: sessionId,     // Unique session identifier
  });

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i} className={msg.role}>
          {msg.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </div>
  );
}
```

### With Initial Messages

```typescript
const { messages, ... } = useAgentChat({
  agent: "ai-advisor",
  name: sessionId,
  initialMessages: [
    {
      role: "assistant",
      content: "Welcome! Tell me about your social venture."
    }
  ]
});
```

### Resumable Streaming

Streams automatically resume if connection drops:

```typescript
const { messages, ... } = useAgentChat({
  agent: "ai-advisor",
  name: sessionId,
  resume: true // Default: true
});
```

---

## Worker Entry Point

### Route Agent Requests

```typescript
import { routeAgentRequest } from "agents";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Route /agents/:agent/:name to agent
    if (url.pathname.startsWith("/agents/")) {
      return routeAgentRequest(request, env);
    }

    // Serve static assets
    return env.ASSETS.fetch(request);
  }
} satisfies ExportedHandler<Env>;

// Export agent class
export { AIAdvisor } from "./agents/AIAdvisor";
```

### Manual Agent Access

```typescript
import { getAgentByName } from "agents";

// Get specific agent instance
const agent = getAgentByName(env.AI_ADVISOR, "session-123");
const response = await agent.fetch(request);
```

---

## MCP Integration

### Adding MCP Server

```typescript
async addToolServer(url: string): Promise<void> {
  const { id, authUrl } = await this.addMcpServer(
    "my-tools",
    url,
    undefined, // callbackHost
    undefined, // agentsPrefix
    { auth: { type: "none" } }
  );

  if (authUrl) {
    // Handle OAuth flow
    console.log("Auth required:", authUrl);
  }
}
```

### Using MCP Tools

```typescript
async queryWithTools(query: string): Promise<string> {
  // MCP tools are automatically available to the agent
  const tools = await this.getMcpTools();

  // Use with AI model
  const response = await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
    messages: [{ role: "user", content: query }],
    tools: tools
  });

  return response.response;
}
```

---

## Human-in-the-Loop

### Approval Pattern

```typescript
async requestApproval(action: string, data: unknown): Promise<boolean> {
  // Notify connected clients
  this.setState({
    ...this.getState(),
    pendingApproval: { action, data }
  });

  // Wait for user response (handled by frontend)
  return new Promise((resolve) => {
    this.approvalResolver = resolve;
  });
}

async handleApprovalResponse(approved: boolean): Promise<void> {
  if (this.approvalResolver) {
    this.approvalResolver(approved);
  }
}
```

---

## Best Practices

1. **Session naming** - Use deterministic IDs (user ID, session ID)
2. **State over messages** - Use `setState()` for UI state, messages for conversation
3. **SQL for persistence** - Use `this.ctx.storage.sql` for structured data
4. **Resume streaming** - Keep `resume: true` for reliability
5. **Typed state** - Use generics for type-safe state: `AIChatAgent<Env, MyState>`
6. **Error boundaries** - Wrap agent calls in try/catch on frontend
