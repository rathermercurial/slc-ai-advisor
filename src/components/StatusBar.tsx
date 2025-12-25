/**
 * Agent status bar
 *
 * Shows what the agent is currently doing (thinking, searching, updating).
 * Uses CSS-based indicators instead of emojis per project guidelines.
 */

interface StatusBarProps {
  status: 'thinking' | 'searching' | 'updating' | 'error';
  message: string;
}

export function StatusBar({ status, message }: StatusBarProps) {
  return (
    <div className={`status-bar status-${status}`}>
      <span className="status-indicator" aria-hidden="true" />
      <span className="status-message">{message}</span>
    </div>
  );
}
