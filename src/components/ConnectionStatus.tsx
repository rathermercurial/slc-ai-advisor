/**
 * WebSocket connection status indicator
 *
 * Pulsing orb design that shows AI agent connection state.
 * - Connected: Green glowing orb with subtle pulse
 * - Connecting: Yellow orb with active pulse ring
 * - Disconnected: Gray dim orb, no animation
 */

interface ConnectionStatusProps {
  readyState: number;
  isGenerating?: boolean;
  onHoverChange?: (text: string | null) => void;
}

export function ConnectionStatus({ readyState, isGenerating = false, onHoverChange }: ConnectionStatusProps) {
  const connected = readyState === 1;
  const connecting = readyState === 0;

  // Generating takes priority over connected for visual state
  const statusClass = isGenerating
    ? 'generating'
    : connected
    ? 'connected'
    : connecting
    ? 'connecting'
    : 'disconnected';

  const statusText = isGenerating
    ? 'AI is thinking...'
    : connected
    ? 'AI Agent Connected'
    : connecting
    ? 'Connecting to AI...'
    : 'AI Agent Offline';

  return (
    <span
      className={`connection-orb ${statusClass}`}
      aria-label={statusText}
      onMouseEnter={() => onHoverChange?.(statusText)}
      onMouseLeave={() => onHoverChange?.(null)}
      onFocus={() => onHoverChange?.(statusText)}
      onBlur={() => onHoverChange?.(null)}
      tabIndex={0}
      role="status"
    >
      <span className="connection-orb-core" />
      {(connected || connecting || isGenerating) && <span className="connection-orb-ring" />}
    </span>
  );
}
