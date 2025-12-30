/**
 * TypingIndicator Component
 *
 * Bouncing dots animation for AI thinking state.
 * Accessible with screen reader text.
 */

interface TypingIndicatorProps {
  label?: string;
}

export function TypingIndicator({ label = 'Thinking' }: TypingIndicatorProps) {
  return (
    <div className="typing-indicator" role="status" aria-label={label}>
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="visually-hidden">{label}...</span>
    </div>
  );
}
