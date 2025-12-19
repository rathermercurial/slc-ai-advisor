# Cloudflare Examples

## Contents
- [Basic Worker](#basic-worker)
- [API with D1](#api-with-d1)
- [RAG with Vectorize + Workers AI](#rag-with-vectorize--workers-ai)
- [Durable Object Chat Room](#durable-object-chat-room)
- [Queue Consumer](#queue-consumer)
- [Error Handling Pattern](#error-handling-pattern)

---

## Basic Worker

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/hello") {
      return Response.json({ message: "Hello, World!" });
    }

    return new Response("Not Found", { status: 404 });
  }
} satisfies ExportedHandler<Env>;
```

## API with D1

```typescript
interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/api/users") {
      const { results } = await env.DB.prepare("SELECT * FROM users").all();
      return Response.json(results);
    }

    if (request.method === "POST" && url.pathname === "/api/users") {
      const { name, email } = await request.json();
      await env.DB.prepare("INSERT INTO users (name, email) VALUES (?, ?)")
        .bind(name, email).run();
      return Response.json({ success: true }, { status: 201 });
    }

    return new Response("Not Found", { status: 404 });
  }
};
```

## RAG with Vectorize + Workers AI

```typescript
interface Env {
  AI: Ai;
  VECTORIZE: VectorizeIndex;
  KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { query } = await request.json();

    // Generate embedding for query
    const queryEmbedding = await env.AI.run("@cf/baai/bge-base-en-v1.5", {
      text: [query]
    });

    // Search for relevant documents
    const results = await env.VECTORIZE.query(queryEmbedding.data[0], {
      topK: 5,
      returnMetadata: true
    });

    // Build context from results
    const context = results.matches
      .map(m => m.metadata?.content)
      .join("\n\n");

    // Generate response with context
    const response = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
      messages: [
        { role: "system", content: `Answer based on this context:\n${context}` },
        { role: "user", content: query }
      ]
    });

    return Response.json({ answer: response.response });
  }
};
```

## Durable Object Chat Room

```typescript
export class ChatRoom extends DurableObject {
  sessions: Map<WebSocket, { name: string }> = new Map();

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      this.ctx.acceptWebSocket(server);
      this.sessions.set(server, { name: "Anonymous" });

      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response("Not Found", { status: 404 });
  }

  async webSocketMessage(ws: WebSocket, message: string) {
    const data = JSON.parse(message);

    if (data.type === "join") {
      this.sessions.set(ws, { name: data.name });
    }

    if (data.type === "message") {
      const sender = this.sessions.get(ws);
      this.broadcast({ type: "message", from: sender?.name, text: data.text });
    }
  }

  broadcast(message: object) {
    for (const ws of this.sessions.keys()) {
      ws.send(JSON.stringify(message));
    }
  }
}
```

## Queue Consumer

```typescript
interface Env {
  EMAIL_QUEUE: Queue;
  SENDGRID_API_KEY: string;
}

export default {
  async queue(batch: MessageBatch<EmailMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        await sendEmail(message.body, env.SENDGRID_API_KEY);
        message.ack();
      } catch (error) {
        message.retry({ delaySeconds: 60 });
      }
    }
  }
};

interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

async function sendEmail(email: EmailMessage, apiKey: string) {
  // Send email implementation
}
```

## Error Handling Pattern

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      console.error("Error:", error);

      if (error instanceof ValidationError) {
        return Response.json({ error: error.message }, { status: 400 });
      }

      if (error instanceof NotFoundError) {
        return Response.json({ error: "Not found" }, { status: 404 });
      }

      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  }
};

class ValidationError extends Error {}
class NotFoundError extends Error {}
```
