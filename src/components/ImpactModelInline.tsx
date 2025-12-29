import { useState, useCallback, useEffect } from 'react';
import { ArrowRight, ArrowLeft, ArrowDown } from 'lucide-react';
import {
  type ImpactModel,
  type ImpactModelField,
  IMPACT_MODEL_LABELS,
} from '../types/canvas';

interface ImpactModelInlineProps {
  impactModel: ImpactModel;
  onSave: (impactModel: ImpactModel) => void;
  isUpdating?: boolean;
  isHighlighted?: boolean;
  /** Auto-focus first field when mounted */
  autoFocusFirst?: boolean;
}

// Tab order for Impact Model fields (boustrophedon: left-to-right then right-to-left)
const FIELD_TAB_ORDER: ImpactModelField[] = [
  'issue',
  'participants',
  'activities',
  'outputs',
  'shortTermOutcomes',
  'mediumTermOutcomes',
  'longTermOutcomes',
  'impact',
];

/**
 * Inline Impact Model display with 2 rows of 4 fields.
 * Shows the causality chain: Issue → Participants → Activities → Outputs
 *                            Short-term → Medium-term → Long-term → Impact
 */
export function ImpactModelInline({ impactModel, onSave, isUpdating, isHighlighted, autoFocusFirst }: ImpactModelInlineProps) {
  const [editingField, setEditingField] = useState<ImpactModelField | null>(null);
  const [draft, setDraft] = useState<ImpactModel>(impactModel);

  // Row definitions - row 2 is reversed for boustrophedon flow (right, then down, then left)
  const row1: ImpactModelField[] = ['issue', 'participants', 'activities', 'outputs'];
  const row2: ImpactModelField[] = ['impact', 'longTermOutcomes', 'mediumTermOutcomes', 'shortTermOutcomes'];

  // Auto-focus first field when opened
  useEffect(() => {
    if (autoFocusFirst) {
      setEditingField('issue');
      setDraft(impactModel);
    }
  }, [autoFocusFirst, impactModel]);

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

  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentField: ImpactModelField) => {
    if (e.key === 'Escape') {
      setEditingField(null);
      setDraft(impactModel);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFieldBlur();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Save current field if changed
      if (draft[currentField] !== impactModel[currentField]) {
        onSave(draft);
      }

      const currentIndex = FIELD_TAB_ORDER.indexOf(currentField);
      if (e.shiftKey) {
        // Shift+Tab - go to previous field
        if (currentIndex > 0) {
          const prevField = FIELD_TAB_ORDER[currentIndex - 1];
          setEditingField(prevField);
        } else {
          // At first field, exit editing
          setEditingField(null);
        }
      } else {
        // Tab - go to next field
        if (currentIndex < FIELD_TAB_ORDER.length - 1) {
          const nextField = FIELD_TAB_ORDER[currentIndex + 1];
          setEditingField(nextField);
        } else {
          // At last field, exit editing
          setEditingField(null);
        }
      }
    }
  }, [handleFieldBlur, impactModel, draft, onSave]);

  const renderField = (field: ImpactModelField, isFirst: boolean, _isLast: boolean, arrowDirection: 'right' | 'left' = 'right') => {
    const isEditing = editingField === field;
    const hasContent = !!impactModel[field];

    return (
      <div key={field} className="impact-inline-field-wrapper">
        {!isFirst && (
          <span className="impact-inline-arrow">
            {arrowDirection === 'right' ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
          </span>
        )}
        <div
          className={`impact-inline-field ${isEditing ? 'editing' : ''} ${hasContent ? 'has-content' : ''} ${isUpdating ? 'updating' : ''}`}
          onClick={() => !isEditing && handleFieldClick(field)}
        >
          <label className="impact-inline-label" htmlFor={`impact-field-${field}`}>
            {IMPACT_MODEL_LABELS[field]}
          </label>
          {isEditing ? (
            <textarea
              id={`impact-field-${field}`}
              className="impact-inline-input"
              value={draft[field]}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              onBlur={handleFieldBlur}
              onKeyDown={(e) => handleKeyDown(e, field)}
              autoFocus
              placeholder={getPlaceholder(field)}
              aria-label={IMPACT_MODEL_LABELS[field]}
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
    <div className={`impact-inline ${isHighlighted ? 'highlighted' : ''}`}>
      <div className="impact-inline-header">
        <span className="impact-inline-title">Impact Model</span>
      </div>
      <div className="impact-inline-grid">
        <div className="impact-inline-row">
          {row1.map((field, i) => renderField(field, i === 0, i === row1.length - 1, 'right'))}
        </div>
        {/* Arrow connecting Outputs (box 4) to Short-term Outcomes (box 5) */}
        <div className="impact-inline-connector">
          <span className="impact-inline-arrow vertical">
            <ArrowDown size={16} />
          </span>
        </div>
        <div className="impact-inline-row row-reversed">
          {row2.map((field, i) => renderField(field, i === 0, i === row2.length - 1, 'left'))}
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
