/**
 * WebSocket connection status indicator
 *
 * Displays the current connection state of the agent WebSocket.
 */

import { Wifi, WifiOff, Loader2 } from 'lucide-react';

interface ConnectionStatusProps {
  readyState: number;
}

export function ConnectionStatus({ readyState }: ConnectionStatusProps) {
  const connected = readyState === 1;
  const connecting = readyState === 0;

  return (
    <span
      className={`connection-status ${connected ? 'connected' : ''}`}
      aria-label={connected ? 'Connected' : connecting ? 'Connecting' : 'Disconnected'}
    >
      {connecting ? (
        <Loader2 size={16} className="spin" />
      ) : connected ? (
        <Wifi size={16} />
      ) : (
        <WifiOff size={16} />
      )}
    </span>
  );
}
