import { useState, FormEvent, useRef, useEffect } from 'react';
import { useAgent } from 'agents/react';
import { useAgentChat } from 'agents/ai-react';
import ReactMarkdown from 'react-markdown';
import type { UIMessage } from 'ai';

interface ChatProps {
  sessionId: string;
}

/**
 * Chat interface using Cloudflare Agents SDK
 *
 * Connects to ChatAgent via WebSocket for real-time streaming responses.
 * Messages are automatically persisted by the agent.
 */
export function Chat({ sessionId }: ChatProps) {
  // Connect to ChatAgent via WebSocket
  const agent = useAgent({
    agent: 'chat',
    name: sessionId,
  });

  // Manage chat state via agent
  const { messages, sendMessage, status, stop } = useAgentChat({
    agent,
  });

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status === 'streaming') return;

    await sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: input.trim() }],
    });
    setInput('');
  };

  const isLoading = status === 'streaming' || status === 'submitted';

  // Extract text content from message parts
  const getMessageText = (message: UIMessage): string => {
    if (!message.parts) return '';
    const textPart = message.parts.find(
      (p): p is { type: 'text'; text: string } => p.type === 'text'
    );
    return textPart?.text || '';
  };

  return (
    <div className="chat">
      <div className="chat-messages">
        {/* Welcome message when no chat history */}
        {messages.length === 0 && (
          <div className="chat-message assistant">
            <ReactMarkdown>
              {`Hello! I'm your Social Lean Canvas advisor. I'll help you build your canvas by exploring your venture's purpose, customers, solution, and impact. What would you like to work on first?`}
            </ReactMarkdown>
          </div>
        )}

        {/* Render chat messages */}
        {messages.map((message: UIMessage) => (
          <div key={message.id} className={`chat-message ${message.role}`}>
            {message.role === 'assistant' ? (
              <ReactMarkdown>{getMessageText(message)}</ReactMarkdown>
            ) : (
              getMessageText(message)
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="chat-message assistant">
            <span className="typing-indicator">Thinking...</span>
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
            type={isLoading ? 'button' : 'submit'}
            className="chat-send"
            onClick={isLoading ? stop : undefined}
            disabled={!isLoading && !input.trim()}
          >
            {isLoading ? 'Stop' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
