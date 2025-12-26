import { useState, useRef, useEffect, FormEvent } from 'react';
import { useAgent } from 'agents/react';
import { useAgentChat } from 'agents/ai-react';
import ReactMarkdown from 'react-markdown';
import { ConnectionStatus } from './ConnectionStatus';
import { StatusBar } from './StatusBar';

interface ChatProps {
  canvasId: string;
}

/**
 * Agent state synced from SLCAgent
 */
interface AgentState {
  status: 'idle' | 'thinking' | 'searching' | 'updating' | 'error';
  statusMessage: string;
  currentCanvasId: string | null;
}

/**
 * Extract text content from a UIMessage
 * UIMessage uses parts array with typed parts (text, tool, etc.)
 */
function getMessageText(message: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!message.parts) return '';
  return message.parts
    .filter((part) => part.type === 'text' && part.text)
    .map((part) => part.text)
    .join('');
}

/**
 * Chat interface using Cloudflare Agents SDK
 *
 * Connects to SLCAgent via WebSocket for real-time streaming responses.
 * Agent state (status updates) syncs automatically via the agents SDK.
 */
export function Chat({ canvasId }: ChatProps) {
  const [input, setInput] = useState('');
  const [agentState, setAgentState] = useState<AgentState | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Connect to agent via WebSocket
  const agent = useAgent<AgentState>({
    agent: 'slc-agent',
    name: canvasId,
    onStateUpdate: (state) => {
      setAgentState(state);
    },
  });

  // Chat state from agent
  const {
    messages,
    sendMessage,
    status,
    error,
  } = useAgentChat({
    agent,
  });

  // Determine loading state from status
  const isLoading = status === 'streaming' || status === 'submitted';

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // The canvasId is passed as the agent 'name', so the agent instance
  // is already scoped to this canvas. No need to call setCanvas.

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Send message via the agent chat
    await sendMessage({ text: userMessage });
  };

  return (
    <div className="chat">
      {/* Connection status */}
      <div className="chat-header">
        <ConnectionStatus readyState={agent.readyState} />
      </div>

      {/* Agent status bar (when not idle) */}
      {agentState && agentState.status !== 'idle' && (
        <StatusBar status={agentState.status} message={agentState.statusMessage} />
      )}

      {/* Messages */}
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

        {/* Error message */}
        {error && (
          <div className="chat-message error">
            Error: {error.message}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <div className="chat-input-container">
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your canvas..."
            disabled={isLoading || agent.readyState !== 1}
          />
          <button
            type="submit"
            className="chat-send"
            disabled={isLoading || !input.trim() || agent.readyState !== 1}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
