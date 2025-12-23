import { useState, useEffect } from 'react';
import {
  type ImpactModel,
  IMPACT_MODEL_FIELDS,
  IMPACT_MODEL_LABELS,
  type ImpactModelField,
} from '../types/canvas';

interface ImpactPanelProps {
  impactModel: ImpactModel;
  onSave: (impactModel: ImpactModel) => void;
  onClose: () => void;
}

/**
 * Slide-in panel for editing the Impact Model's 8 fields.
 * Displays the causality chain from Issue to Impact.
 */
export function ImpactPanel({ impactModel, onSave, onClose }: ImpactPanelProps) {
  const [draft, setDraft] = useState<ImpactModel>(impactModel);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleFieldChange = (field: ImpactModelField, value: string) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSave = () => {
    onSave(draft);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="impact-panel-overlay" onClick={handleOverlayClick}>
      <aside className="impact-panel">
        <header className="impact-panel-header">
          <h2>Impact Model</h2>
          <button className="impact-panel-close" onClick={onClose}>
            &times;
          </button>
        </header>

        <div className="impact-panel-content">
          {IMPACT_MODEL_FIELDS.map((field, index) => (
            <div key={field}>
              <div className="impact-field">
                <label htmlFor={field}>{IMPACT_MODEL_LABELS[field]}</label>
                <textarea
                  id={field}
                  value={draft[field]}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  placeholder={getPlaceholder(field)}
                />
              </div>
              {index < IMPACT_MODEL_FIELDS.length - 1 && (
                <div className="impact-field-arrow">&darr;</div>
              )}
            </div>
          ))}
        </div>

        <footer className="impact-panel-footer">
          <button className="cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="save" onClick={handleSave}>
            Save
          </button>
        </footer>
      </aside>
    </div>
  );
}

function getPlaceholder(field: ImpactModelField): string {
  const placeholders: Record<ImpactModelField, string> = {
    issue: 'What social/environmental issue are you addressing?',
    participants: 'Who experiences this issue? Who are your stakeholders?',
    activities: 'What does your venture do to address this?',
    outputs: 'What tangible deliverables do you produce?',
    shortTermOutcomes: 'What changes happen in 0-1 year?',
    mediumTermOutcomes: 'What changes happen in 1-3 years?',
    longTermOutcomes: 'What changes happen in 3+ years?',
    impact: 'What is the ultimate change you want to see?',
  };
  return placeholders[field];
}
