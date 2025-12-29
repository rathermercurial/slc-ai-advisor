/**
 * WebSocket connection status indicator
 *
 * Pulsing orb design that shows AI agent connection state.
 * - Connected: Green glowing orb with subtle pulse
 * - Connecting: Yellow orb with active pulse ring
 * - Disconnected: Gray dim orb, no animation
 */

import { useState } from 'react';

interface ConnectionStatusProps {
  readyState: number;
}

export function ConnectionStatus({ readyState }: ConnectionStatusProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const connected = readyState === 1;
  const connecting = readyState === 0;

  const statusClass = connected ? 'connected' : connecting ? 'connecting' : 'disconnected';
  const statusText = connected
    ? 'AI Agent Connected'
    : connecting
    ? 'Connecting to AI...'
    : 'AI Agent Offline';

  return (
    <span
      className={`connection-orb ${statusClass}`}
      aria-label={statusText}
      title={statusText}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      tabIndex={0}
      role="status"
    >
      <span className="connection-orb-core" />
      {(connected || connecting) && <span className="connection-orb-ring" />}
      {showTooltip && (
        <span className="connection-orb-tooltip">{statusText}</span>
      )}
    </span>
  );
}
