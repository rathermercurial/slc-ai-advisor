/**
 * VentureHeader Component
 *
 * Displays venture name (editable), progress bar, and venture profile toggle.
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
  /** Current model being hovered (from Canvas) */
  modelIndicator?: string | null;
}

const MODEL_LABELS: Record<string, string> = {
  customer: 'Customer Model',
  economic: 'Economic Model',
  impact: 'Impact Model',
};

export function VentureHeader({
  name,
  progress,
  onNameChange,
  showProfile = false,
  onProfileClick,
  modelIndicator,
}: VentureHeaderProps) {
  return (
    <div className="venture-header">
      <div className="venture-header-main">
        <InlineEdit
          value={name}
          onSave={onNameChange}
          placeholder="Untitled Venture"
          className="venture-name-edit"
        />
      </div>

      <div className="venture-header-meta">
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

        {modelIndicator && (
          <span className={`venture-model-indicator ${modelIndicator}`}>
            {MODEL_LABELS[modelIndicator] || ''}
          </span>
        )}

        {onProfileClick && (
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
        )}
      </div>
    </div>
  );
}
