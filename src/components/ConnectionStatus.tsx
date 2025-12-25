/**
 * WebSocket connection status indicator
 *
 * Displays the current connection state of the agent WebSocket.
 */

interface ConnectionStatusProps {
  readyState: number;
}

const STATUS_CONFIG: Record<number, { label: string; className: string }> = {
  0: { label: 'Connecting...', className: 'connecting' },
  1: { label: 'Connected', className: 'connected' },
  2: { label: 'Closing', className: 'closing' },
  3: { label: 'Disconnected', className: 'disconnected' },
};

export function ConnectionStatus({ readyState }: ConnectionStatusProps) {
  const status = STATUS_CONFIG[readyState] || { label: 'Unknown', className: 'unknown' };

  return (
    <div className={`connection-status connection-${status.className}`}>
      <span className="connection-dot" aria-hidden="true" />
      <span className="connection-label">{status.label}</span>
    </div>
  );
}
