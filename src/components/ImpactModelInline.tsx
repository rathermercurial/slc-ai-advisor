import { useState, useCallback } from 'react';
import {
  type ImpactModel,
  type ImpactModelField,
  IMPACT_MODEL_LABELS,
} from '../types/canvas';

interface ImpactModelInlineProps {
  impactModel: ImpactModel;
  onSave: (impactModel: ImpactModel) => void;
  isUpdating?: boolean;
}

/**
 * Inline Impact Model display with 2 rows of 4 fields.
 * Shows the causality chain: Issue → Participants → Activities → Outputs
 *                            Short-term → Medium-term → Long-term → Impact
 */
export function ImpactModelInline({ impactModel, onSave, isUpdating }: ImpactModelInlineProps) {
  const [editingField, setEditingField] = useState<ImpactModelField | null>(null);
  const [draft, setDraft] = useState<ImpactModel>(impactModel);

  // Row definitions
  const row1: ImpactModelField[] = ['issue', 'participants', 'activities', 'outputs'];
  const row2: ImpactModelField[] = ['shortTermOutcomes', 'mediumTermOutcomes', 'longTermOutcomes', 'impact'];

  const handleFieldClick = useCallback((field: ImpactModelField) => {
    setEditingField(field);
    setDraft(impactModel); // Reset draft to current state
  }, [impactModel]);

  const handleFieldChange = useCallback((field: ImpactModelField, value: string) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const handleFieldBlur = useCallback(() => {
    if (editingField && draft[editingField] !== impactModel[editingField]) {
      onSave(draft);
    }
    setEditingField(null);
  }, [editingField, draft, impactModel, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditingField(null);
      setDraft(impactModel);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFieldBlur();
    }
  }, [handleFieldBlur, impactModel]);

  const renderField = (field: ImpactModelField, isFirst: boolean, _isLast: boolean) => {
    const isEditing = editingField === field;
    const hasContent = !!impactModel[field];
    const isIssue = field === 'issue';
    const isImpact = field === 'impact';

    return (
      <div key={field} className="impact-inline-field-wrapper">
        {!isFirst && <span className="impact-inline-arrow">→</span>}
        <div
          className={`impact-inline-field ${isEditing ? 'editing' : ''} ${hasContent ? 'has-content' : ''} ${isIssue ? 'field-issue' : ''} ${isImpact ? 'field-impact' : ''} ${isUpdating ? 'updating' : ''}`}
          onClick={() => !isEditing && handleFieldClick(field)}
        >
          <label className="impact-inline-label">{IMPACT_MODEL_LABELS[field]}</label>
          {isEditing ? (
            <textarea
              className="impact-inline-input"
              value={draft[field]}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              onBlur={handleFieldBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              placeholder={getPlaceholder(field)}
            />
          ) : (
            <div className="impact-inline-content">
              {impactModel[field] || <span className="placeholder">{getPlaceholder(field)}</span>}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="impact-inline">
      <div className="impact-inline-header">
        <span className="impact-inline-title">Impact Model</span>
        <span className="impact-inline-subtitle">Causality Chain</span>
      </div>
      <div className="impact-inline-grid">
        <div className="impact-inline-row">
          {row1.map((field, i) => renderField(field, i === 0, i === row1.length - 1))}
        </div>
        <div className="impact-inline-row">
          {row2.map((field, i) => renderField(field, i === 0, i === row2.length - 1))}
        </div>
      </div>
    </div>
  );
}

function getPlaceholder(field: ImpactModelField): string {
  const placeholders: Record<ImpactModelField, string> = {
    issue: 'What problem?',
    participants: 'Who is affected?',
    activities: 'What do you do?',
    outputs: 'What do you deliver?',
    shortTermOutcomes: '0-1 year changes',
    mediumTermOutcomes: '1-3 year changes',
    longTermOutcomes: '3+ year changes',
    impact: 'Ultimate change',
  };
  return placeholders[field];
}
