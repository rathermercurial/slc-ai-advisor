import { useState, FormEvent, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface ChatProps {
  sessionId: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  response: string;
  sources?: Array<{
    title: string;
    type: string;
  }>;
}

/**
 * Chat interface using REST API
 *
 * Sends messages to /api/chat and displays responses.
 * Messages are persisted by the UserSession Durable Object.
 */
export function Chat({ sessionId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load message history on mount
  useEffect(() => {
    async function loadMessages() {
      try {
        const response = await fetch(`/api/session/${sessionId}/messages`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setMessages(data.map((msg: { id?: string; role: string; content: string }, i: number) => ({
              id: msg.id || `msg-${i}`,
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
            })));
          }
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    }
    loadMessages();
  }, [sessionId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    // Add user message immediately
    const userMsgId = `user-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: userMsgId,
      role: 'user',
      content: userMessage,
    }]);

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat failed: ${response.status}`);
      }

      const data: ChatResponse = await response.json();

      // Add assistant response
      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
      }]);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat">
      <div className="chat-messages">
        {/* Welcome message when no chat history */}
        {messages.length === 0 && !isLoading && (
          <div className="chat-message assistant">
            <ReactMarkdown>
              {`Hello! I'm your Social Lean Canvas advisor. I'll help you build your canvas by exploring your venture's purpose, customers, solution, and impact. What would you like to work on first?`}
            </ReactMarkdown>
          </div>
        )}

        {/* Render chat messages */}
        {messages.map((message) => (
          <div key={message.id} className={`chat-message ${message.role}`}>
            {message.role === 'assistant' ? (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            ) : (
              message.content
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="chat-message assistant">
            <span className="typing-indicator">Thinking...</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="chat-message error">
            Error: {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your canvas..."
            disabled={isLoading}
          />
          <button
            type="submit"
            className="chat-send"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
