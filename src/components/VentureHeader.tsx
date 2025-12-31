/**
 * VentureHeader Component
 *
 * Displays venture name (editable), progress bar, and venture profile toggle.
 * Layout: [progress] [name] [helper text area] with centered profile toggle below.
 */

import { ChevronDown, ChevronUp } from 'lucide-react';
import { InlineEdit } from './InlineEdit';

interface VentureHeaderProps {
  /** Venture name */
  name: string;
  /** Completion percentage (0-100) */
  progress: number;
  /** Called when name changes */
  onNameChange: (name: string) => void;
  /** Whether profile panel is shown */
  showProfile?: boolean;
  /** Called when profile panel toggle is clicked */
  onProfileClick?: () => void;
  /** Helper text displayed in header (model indicator, button hints, status) */
  helperText?: string | null;
}

const MODEL_LABELS: Record<string, string> = {
  customer: 'Customer Model',
  economic: 'Economic Model',
  impact: 'Impact Model',
};

/**
 * Get CSS class for action-based helper text coloring
 */
function getActionClass(text: string | null | undefined): string {
  if (!text) return '';
  const lower = text.toLowerCase();

  // Archive actions (red)
  if (lower === 'archive') return 'action-archive';

  // Rename/Edit actions (yellow/amber)
  if (lower === 'rename' || lower === 'edit') return 'action-rename';

  // Star actions (gold)
  if (lower === 'star' || lower === 'unstar') return 'action-star';

  // Restore actions (green)
  if (lower === 'restore') return 'action-restore';

  // Undo/Redo actions (blue)
  if (lower.includes('undo') || lower.includes('redo')) return 'action-undo';

  // Export/Copy actions (teal)
  if (lower.includes('copy') || lower.includes('export') || lower.includes('download') || lower.includes('save')) return 'action-export';

  // Thinking/Processing (purple)
  if (lower.includes('thinking') || lower.includes('processing') || lower.includes('generating')) return 'action-thinking';

  // Model labels have their own classes
  if (MODEL_LABELS[text]) return text;

  return '';
}

export function VentureHeader({
  name,
  progress,
  onNameChange,
  showProfile = false,
  onProfileClick,
  helperText,
}: VentureHeaderProps) {
  return (
    <div className="venture-header">
      {/* Top row: progress | name | helper text */}
      <div className="venture-header-row">
        {/* Left: Progress indicator */}
        <div className="venture-header-left">
          <div className="venture-progress">
            <div className="venture-progress-bar">
              <div
                className="venture-progress-fill"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <span className="venture-progress-text">{progress}%</span>
          </div>
        </div>

        {/* Center: Venture name */}
        <div className="venture-header-center">
          <InlineEdit
            value={name}
            onSave={onNameChange}
            placeholder="Untitled Venture"
            className="venture-name-edit"
          />
        </div>

        {/* Right: Helper text area */}
        <div className="venture-header-right">
          {helperText && (
            <span className={`venture-helper-text ${getActionClass(helperText)}`}>
              {MODEL_LABELS[helperText] || helperText}
            </span>
          )}
        </div>
      </div>

      {/* Bottom row: Centered profile toggle */}
      {onProfileClick && (
        <div className="venture-header-toggle-row">
          <button
            type="button"
            className="venture-profile-btn"
            onClick={onProfileClick}
            title={showProfile ? 'Hide venture profile' : 'Show venture profile'}
            aria-label={showProfile ? 'Hide venture profile' : 'Show venture profile'}
            aria-expanded={showProfile}
          >
            <span className="venture-profile-toggle">
              {showProfile ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
