/**
 * VentureHeader Component
 *
 * Displays venture name (editable), stage dropdown, progress bar,
 * and venture profile panel toggle.
 */

import { useState, useCallback } from 'react';
import { InlineEdit } from './InlineEdit';
import type { VentureStage, VentureProfile } from '../types/venture';

interface VentureHeaderProps {
  /** Venture name */
  name: string;
  /** Current stage */
  stage: VentureStage;
  /** Completion percentage (0-100) */
  progress: number;
  /** Venture profile data */
  profile?: VentureProfile;
  /** Called when name changes */
  onNameChange: (name: string) => void;
  /** Called when stage changes */
  onStageChange: (stage: VentureStage) => void;
  /** Called when profile panel toggle is clicked */
  onProfileClick?: () => void;
}

const STAGE_OPTIONS: { value: VentureStage; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'validation', label: 'Validation' },
  { value: 'growth', label: 'Growth' },
  { value: 'scale', label: 'Scale' },
];

export function VentureHeader({
  name,
  stage,
  progress,
  profile,
  onNameChange,
  onStageChange,
  onProfileClick,
}: VentureHeaderProps) {
  const [isStageOpen, setIsStageOpen] = useState(false);

  const handleStageSelect = useCallback(
    (newStage: VentureStage) => {
      onStageChange(newStage);
      setIsStageOpen(false);
    },
    [onStageChange]
  );

  // Count confirmed dimensions
  const confirmedCount = profile
    ? Object.values(profile.confirmed).filter(Boolean).length
    : 0;

  return (
    <div className="venture-header">
      <div className="venture-header-main">
        <InlineEdit
          value={name}
          onSave={onNameChange}
          placeholder="Untitled Venture"
          className="venture-name-edit"
        />

        <div className="venture-stage-dropdown">
          <button
            type="button"
            className="venture-stage-trigger"
            onClick={() => setIsStageOpen(!isStageOpen)}
            aria-expanded={isStageOpen}
            aria-haspopup="listbox"
          >
            <span className={`venture-stage-badge stage-${stage}`}>
              {STAGE_OPTIONS.find((s) => s.value === stage)?.label || stage}
            </span>
            <span className="venture-stage-caret" aria-hidden="true">
              {isStageOpen ? '\u25B2' : '\u25BC'}
            </span>
          </button>

          {isStageOpen && (
            <ul className="venture-stage-menu" role="listbox">
              {STAGE_OPTIONS.map((option) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={option.value === stage}
                  className={`venture-stage-option ${option.value === stage ? 'selected' : ''}`}
                  onClick={() => handleStageSelect(option.value)}
                >
                  <span className={`venture-stage-badge stage-${option.value}`}>
                    {option.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
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

        {onProfileClick && (
          <button
            type="button"
            className="venture-profile-btn"
            onClick={onProfileClick}
            title="View venture profile"
            aria-label="View venture profile"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="venture-profile-icon"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            {confirmedCount > 0 && (
              <span className="venture-profile-badge">{confirmedCount}/7</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
