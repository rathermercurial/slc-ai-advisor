/**
 * Toast notification component
 *
 * Displays success/error notifications that auto-dismiss after 3 seconds.
 * Fixed position at bottom center with slide-in animation.
 */

import { useEffect } from 'react';

export type ToastType = 'success' | 'error';

export interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

/**
 * Toast notification component
 *
 * @param message - Text to display
 * @param type - 'success' or 'error' for styling
 * @param onClose - Called when toast should be dismissed
 * @param duration - Auto-dismiss time in ms (default: 3000)
 */
export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  // Auto-dismiss after duration
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      className={`toast toast-${type}`}
      role="alert"
      aria-live="polite"
    >
      <span className="toast-icon">
        {type === 'success' ? '\u2713' : '\u2717'}
      </span>
      <span className="toast-message">{message}</span>
      <button
        type="button"
        className="toast-close"
        onClick={onClose}
        aria-label="Close notification"
      >
        {'\u00D7'}
      </button>
    </div>
  );
}
