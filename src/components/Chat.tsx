import { useState, useRef, useEffect, FormEvent } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatProps {
  sessionId: string;
}

/**
 * Chat interface for conversing with the AI advisor.
 *
 * Currently uses local state for demo purposes.
 * Will be connected to backend via useAgentChat when B5 is complete.
 */
export function Chat({ sessionId: _sessionId }: ChatProps) {
  // TODO: Use sessionId when connecting to backend via useAgentChat
  void _sessionId;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm your Social Lean Canvas advisor. I'll help you build your canvas by exploring your venture's purpose, customers, solution, and impact. What would you like to work on first?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response (will be replaced with actual API call)
    // TODO: Replace with useAgentChat or fetch to /api/chat when backend is ready
    setTimeout(() => {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: getMockResponse(userMessage.content),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="chat">
      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`chat-message ${message.role}`}>
            {message.content}
          </div>
        ))}
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
            type="submit"
            className="chat-send"
            disabled={!input.trim() || isLoading}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * Mock responses for demo purposes.
 * Will be removed when connected to real backend.
 */
function getMockResponse(userInput: string): string {
  const input = userInput.toLowerCase();

  if (input.includes('purpose') || input.includes('why')) {
    return "Great choice starting with Purpose! This is the foundation of your canvas. What problem in the world drives you to build this venture? Think about what change you want to see - we'll refine this into a clear purpose statement.";
  }

  if (input.includes('customer') || input.includes('who')) {
    return "Let's define your customers. Who experiences the problem you're solving? Try to be specific - think about demographics, behaviors, and motivations. Who would be your early adopters, the first people excited to try your solution?";
  }

  if (input.includes('problem')) {
    return "Understanding the problem deeply is crucial. What pain points do your customers experience? What are they currently doing to solve this problem (existing alternatives)? The clearer the problem, the more compelling your solution.";
  }

  if (input.includes('solution') || input.includes('product') || input.includes('service')) {
    return "Now for your solution! Based on the problem and customer needs, what will you offer? Keep it simple - describe the core product or service. We can add details later, but start with the essential value you're delivering.";
  }

  if (input.includes('impact') || input.includes('change')) {
    return "The Impact Model is what makes the Social Lean Canvas unique. Let's trace the chain: What issue are you addressing? Who participates? What activities lead to what outcomes? Click on section 11 to fill out the full causality chain.";
  }

  if (input.includes('revenue') || input.includes('money') || input.includes('business model')) {
    return "For your Economic Model, consider: How will customers pay you? What's your pricing strategy? Social ventures often blend revenue sources - earned income, grants, donations. What mix makes sense for your mission?";
  }

  return "That's a great question! I'm here to help you work through each section of your Social Lean Canvas. You can click on any section in the canvas to start editing it directly. Would you like to focus on a specific section, or shall I guide you through the recommended order?";
}
