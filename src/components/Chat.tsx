import { useState, useRef, useEffect, useCallback, useLayoutEffect, FormEvent, ChangeEvent, KeyboardEvent, MouseEvent } from 'react';
import { useAgent } from 'agents/react';
import { useAgentChat } from 'agents/ai-react';
import ReactMarkdown from 'react-markdown';
import { ArrowUp, Loader2 } from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';
import { ThinkingStatus } from './ThinkingStatus';
import { ToolInvocationCard } from './ToolInvocationCard';
import { useCanvasContext, type AgentState } from '../context';

/**
 * Simplified message structure for export
 */
export interface ChatMessageForExport {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatProps {
  canvasId: string;
  threadId?: string;
  onMessagesChange?: (messages: ChatMessageForExport[]) => void;
}

/**
 * Message part types from the Agents SDK
 */
interface TextPart {
  type: 'text';
  text: string;
}

interface ToolInvocationPart {
  type: 'tool-invocation';
  toolInvocation: {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    state: 'pending' | 'call' | 'result' | 'partial-call';
    result?: unknown;
  };
}

type MessagePart = TextPart | ToolInvocationPart | { type: string };

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
 * Check if message has tool invocations
 */
function hasToolInvocations(message: { parts?: MessagePart[] }): boolean {
  if (!message.parts) return false;
  return message.parts.some((part) => part.type === 'tool-invocation');
}

/**
 * Convert SDK tool state to card state
 */
function getToolCardState(sdkState: string): 'pending' | 'executing' | 'complete' | 'error' {
  switch (sdkState) {
    case 'pending':
    case 'partial-call':
      return 'pending';
    case 'call':
      return 'executing';
    case 'result':
      return 'complete';
    default:
      return 'pending';
  }
}

/**
 * Chat interface using Cloudflare Agents SDK
 *
 * Connects to SLCAgent via WebSocket for real-time streaming responses.
 * Agent state (status updates + canvas) syncs automatically via the agents SDK.
 * Canvas state is pushed to CanvasContext for the Canvas component to consume.
 */
export function Chat({ canvasId, threadId, onMessagesChange }: ChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Track if we've already triggered auto-naming for this thread
  const autoNamingTriggeredRef = useRef<string | null>(null);
  // Store the first user message for auto-naming
  const firstUserMessageRef = useRef<string | null>(null);

  // Get canvas context to push agent state updates
  const { updateFromAgent, setConnected, setGenerating, agentStatus, agentStatusMessage, refreshThreads } = useCanvasContext();

  // Agent name includes threadId for multi-thread support
  // Format: canvasId or canvasId--threadId (using -- to avoid PartySocket routing issues with /)
  const agentName = threadId ? `${canvasId}--${threadId}` : canvasId;

  // Keep a ref to the latest updateFromAgent to avoid stale closures in useAgent callback
  const updateFromAgentRef = useRef(updateFromAgent);
  useLayoutEffect(() => {
    updateFromAgentRef.current = updateFromAgent;
  }, [updateFromAgent]);

  // Connect to agent via WebSocket
  const agent = useAgent<AgentState>({
    agent: 'slc-agent',
    name: agentName,
    onStateUpdate: (state) => {
      console.log('[Chat] onStateUpdate received', {
        status: state.status,
        hasCanvas: !!state.canvas,
        canvasUpdatedAt: state.canvasUpdatedAt
      });
      // Push state to context (includes canvas sync)
      // Use ref to always call latest version of updateFromAgent
      updateFromAgentRef.current(state);
    },
  });

  // Track connection status in context
  useEffect(() => {
    setConnected(agent.readyState === 1);
  }, [agent.readyState, setConnected]);

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

  // Sync generating state with context (for orb glow)
  useEffect(() => {
    setGenerating(isLoading);
  }, [isLoading, setGenerating]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Notify parent when messages change (for export functionality)
  useEffect(() => {
    if (onMessagesChange) {
      const exportMessages: ChatMessageForExport[] = messages.map((message) => ({
        role: message.role as 'user' | 'assistant' | 'system',
        content: getMessageText(message),
      }));
      onMessagesChange(exportMessages);
    }
  }, [messages, onMessagesChange]);

  // Auto-naming: trigger when we have first user message + first assistant response
  useEffect(() => {
    // Only proceed if we have a threadId and haven't triggered for this thread yet
    if (!threadId || autoNamingTriggeredRef.current === threadId) {
      return;
    }

    // Find first user message
    const firstUserMsg = messages.find(m => m.role === 'user');
    if (!firstUserMsg) {
      return;
    }

    // Store the first user message
    if (!firstUserMessageRef.current) {
      firstUserMessageRef.current = getMessageText(firstUserMsg);
    }

    // Check if we have at least one assistant response (means AI has started responding)
    const hasAssistantResponse = messages.some(m => m.role === 'assistant');
    if (!hasAssistantResponse) {
      return;
    }

    // Only trigger when not actively streaming
    if (isLoading) {
      return;
    }

    // Trigger auto-naming
    autoNamingTriggeredRef.current = threadId;
    const messageForNaming = firstUserMessageRef.current;

    if (messageForNaming) {
      // Fire and forget - don't block the UI
      fetch(`/api/canvas/${canvasId}/threads/${threadId}/generate-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageForNaming }),
      })
        .then(response => response.json())
        .then((result) => {
          if (result.generated) {
            console.log('[Chat] Thread auto-named:', result.name);
            // Refresh threads list to show new name
            refreshThreads();
          }
        })
        .catch(err => {
          console.error('[Chat] Auto-naming failed:', err);
        });
    }
  }, [messages, threadId, canvasId, isLoading, refreshThreads]);

  // Reset auto-naming state when threadId changes
  useEffect(() => {
    firstUserMessageRef.current = null;
    // Don't reset autoNamingTriggeredRef here - it persists which threads we've already named
  }, [threadId]);

  // The canvasId is passed as the agent 'name', so the agent instance
  // is already scoped to this canvas. No need to call setCanvas.

  // Adjust textarea height based on content (max 200px)
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustTextareaHeight();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends message, Shift+Enter adds newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit(e as unknown as FormEvent);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Reset textarea height after send
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Send message via the agent chat
    await sendMessage({ text: userMessage });
  };

  /**
   * Focus input when clicking on chat area, but not when:
   * - Clicking on interactive elements (buttons, links, inputs)
   * - Selecting text in messages
   */
  const handleChatClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // Don't focus if clicking on interactive elements
    const interactiveElements = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'];
    if (interactiveElements.includes(target.tagName)) {
      return;
    }

    // Don't focus if clicking inside an interactive element (e.g., button icon)
    if (target.closest('button, a, input, textarea, select')) {
      return;
    }

    // Don't focus if user is selecting text
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      return;
    }

    // Focus the textarea
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="chat" onClick={handleChatClick}>
      {/* Connection status */}
      <div className="chat-header">
        <ConnectionStatus readyState={agent.readyState} />
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {/* Welcome message when no chat history */}
        {messages.length === 0 && !isLoading && (
          <div className="chat-message assistant">
            <ReactMarkdown>
              {`Welcome! I'm here to help you build your Social Lean Canvas.

Tell me about your social venture idea - what problem are you trying to solve, and who are you trying to help?`}
            </ReactMarkdown>
          </div>
        )}

        {/* Render chat messages */}
        {messages.map((message) => (
          <div key={message.id} className={`chat-message ${message.role}`}>
            {message.role === 'assistant' ? (
              <>
                {/* Render text parts */}
                <ReactMarkdown>{getMessageText(message)}</ReactMarkdown>
                {/* Render tool invocations */}
                {hasToolInvocations(message as { parts?: MessagePart[] }) &&
                  (message.parts as MessagePart[])
                    .filter((part): part is ToolInvocationPart => part.type === 'tool-invocation')
                    .map((part) => (
                      <ToolInvocationCard
                        key={part.toolInvocation.toolCallId}
                        toolName={part.toolInvocation.toolName}
                        toolCallId={part.toolInvocation.toolCallId}
                        parameters={part.toolInvocation.args}
                        state={getToolCardState(part.toolInvocation.state)}
                        result={
                          part.toolInvocation.result
                            ? { success: true, message: String(part.toolInvocation.result) }
                            : undefined
                        }
                      />
                    ))}
              </>
            ) : (
              getMessageText(message)
            )}
          </div>
        ))}

        {/* Context-aware thinking status */}
        {isLoading && (
          <ThinkingStatus
            status={agentStatus}
            statusMessage={agentStatusMessage}
            isGenerating={isLoading}
          />
        )}

        {/* Error message */}
        {error && (
          <div className="chat-message error" role="alert">
            Error: {error.message}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <div className="chat-input-container">
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            className="chat-input chat-textarea"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="(Shift+Enter for new line)"
            disabled={isLoading || agent.readyState !== 1}
            rows={1}
            aria-label="Type a message"
          />
          <button
            type="submit"
            className="chat-send"
            disabled={isLoading || !input.trim() || agent.readyState !== 1}
          >
            {isLoading ? <Loader2 size={18} className="spin" /> : <ArrowUp size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
