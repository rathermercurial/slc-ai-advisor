/**
 * ThinkingStatus - Context-aware AI thinking status display
 *
 * Shows contextual messages based on which tool the AI is executing.
 * Uses the agentStatusMessage from CanvasContext for real-time updates.
 *
 * Message mapping:
 * - Tool execution status messages from agent (e.g., "Updating purpose...")
 * - Default fallback for general thinking state
 */

import { useEffect, useState, useRef } from 'react';

interface ThinkingStatusProps {
  /** Current agent status */
  status: 'idle' | 'thinking' | 'searching' | 'updating' | 'error';
  /** Status message from agent (tool-specific) */
  statusMessage: string;
  /** Whether AI is currently generating */
  isGenerating: boolean;
}

/**
 * Map tool names to friendly display messages
 * These complement the statusMessage from the agent
 */
const TOOL_STATUS_LABELS: Record<string, string> = {
  // Canvas update tools
  'Updating purpose': 'Updating Purpose...',
  'Updating customers': 'Updating Customers...',
  'Updating jobsToBeDone': 'Updating Jobs To Be Done...',
  'Updating valueProposition': 'Updating Value Proposition...',
  'Updating solution': 'Updating Solution...',
  'Updating channels': 'Updating Channels...',
  'Updating revenue': 'Updating Revenue...',
  'Updating costs': 'Updating Costs...',
  'Updating advantage': 'Updating Advantage...',
  'Updating key metrics': 'Updating Key Metrics...',
  // Impact model fields
  'Updating impact issue': 'Updating Impact Issue...',
  'Updating impact participants': 'Updating Participants...',
  'Updating impact activities': 'Updating Activities...',
  'Updating impact outputs': 'Updating Outputs...',
  'Updating impact shortTermOutcomes': 'Updating Short-term Outcomes...',
  'Updating impact mediumTermOutcomes': 'Updating Medium-term Outcomes...',
  'Updating impact longTermOutcomes': 'Updating Long-term Outcomes...',
  'Updating impact impact': 'Updating Impact Statement...',
  // Knowledge search tools
  'Searching methodology': 'Searching methodology...',
  'Searching examples': 'Searching examples...',
  'Searching knowledge base': 'Searching knowledge base...',
  'Loading canvas': 'Analyzing your canvas...',
  'Getting venture profile': 'Analyzing venture profile...',
  // General status
  'Processing your message': 'Processing...',
  'Generating response': 'Thinking...',
  'Gathering context': 'Gathering context...',
};

/**
 * Get a friendly display message based on the raw status message
 */
function getDisplayMessage(statusMessage: string, status: string): string {
  // Check for exact matches first
  for (const [key, label] of Object.entries(TOOL_STATUS_LABELS)) {
    if (statusMessage.toLowerCase().includes(key.toLowerCase())) {
      return label;
    }
  }

  // Fall back to status-based defaults
  switch (status) {
    case 'searching':
      return 'Searching knowledge base...';
    case 'updating':
      return 'Updating canvas...';
    case 'thinking':
      return 'Thinking...';
    case 'error':
      return 'Something went wrong';
    default:
      return 'Thinking...';
  }
}

/**
 * ThinkingStatus component
 *
 * Displays a context-aware status message when the AI is working.
 * Only visible when isGenerating is true.
 */
export function ThinkingStatus({ status, statusMessage, isGenerating }: ThinkingStatusProps) {
  const [displayMessage, setDisplayMessage] = useState('Thinking...');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousMessageRef = useRef(displayMessage);

  useEffect(() => {
    if (!isGenerating) {
      // Reset when not generating
      setDisplayMessage('Thinking...');
      return;
    }

    // Get the appropriate display message
    const newMessage = statusMessage
      ? getDisplayMessage(statusMessage, status)
      : getDisplayMessage('', status);

    // Only transition if message actually changed
    if (newMessage !== previousMessageRef.current) {
      setIsTransitioning(true);

      // After brief fade, update message
      const timer = setTimeout(() => {
        setDisplayMessage(newMessage);
        previousMessageRef.current = newMessage;
        setIsTransitioning(false);
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [statusMessage, status, isGenerating]);

  if (!isGenerating) {
    return null;
  }

  return (
    <div className={`thinking-status ${isTransitioning ? 'transitioning' : ''}`}>
      <span className="thinking-status-text">{displayMessage}</span>
    </div>
  );
}
