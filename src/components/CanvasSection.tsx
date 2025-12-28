import { useState, useRef, useEffect } from 'react';
import {
  type CanvasSectionId,
  CANVAS_SECTION_LABELS,
  CANVAS_SECTION_NUMBER,
  SECTION_TO_MODEL,
} from '../types/canvas';

/** Save state for tracking async save operations */
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface CanvasSectionProps {
  sectionKey: CanvasSectionId;
  content: string;
  onSave: (content: string) => Promise<{ success: boolean; errors?: string[] }>;
  onFocus?: () => void;
  helperText?: string;
  className?: string;
  truncateAt?: number;
  isComplete?: boolean;
  /** Visual indicator for AI-triggered updates */
  isUpdating?: boolean;
}

/**
 * A single canvas section card with inline editing.
 * Shows section number, completion status, and model grouping.
 */
export function CanvasSection({
  sectionKey,
  content,
  onSave,
  onFocus,
  helperText,
  className = '',
  truncateAt = 50,
  isComplete,
  isUpdating = false,
}: CanvasSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const label = CANVAS_SECTION_LABELS[sectionKey];
  const sectionNumber = CANVAS_SECTION_NUMBER[sectionKey];
  const model = SECTION_TO_MODEL[sectionKey];

  // Completion is based on successful save (saveState === 'saved') or explicit isComplete
  // Fall back to content length check for initial render before any save
  const completed = isComplete ?? (saveState === 'saved' || content.trim().length > 0);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  // Sync draft with content when content changes externally
  useEffect(() => {
    if (!isEditing) {
      setDraft(content);
    }
  }, [content, isEditing]);

  // Clear saved state after a delay
  useEffect(() => {
    if (saveState === 'saved') {
      const timer = setTimeout(() => setSaveState('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveState]);

  const handleClick = () => {
    if (!isEditing && saveState !== 'saving') {
      onFocus?.();
      setIsEditing(true);
      setSaveError(null);
    }
  };

  const handleSave = async () => {
    if (draft === content) {
      setIsEditing(false);
      return;
    }

    setSaveState('saving');
    setSaveError(null);

    const result = await onSave(draft);

    if (result.success) {
      setSaveState('saved');
      setIsEditing(false);
    } else {
      setSaveState('error');
      setSaveError(result.errors?.[0] || 'Failed to save');
      // Keep editing mode open on error so user can fix
    }
  };

  const handleCancel = () => {
    setDraft(content);
    setIsEditing(false);
    setSaveError(null);
    setSaveState('idle');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  };

  // Truncate content for display
  const words = content.split(/\s+/).filter(Boolean);
  const shouldTruncate = words.length > truncateAt && !isEditing;
  const displayContent = shouldTruncate
    ? words.slice(0, truncateAt).join(' ')
    : content;

  const isEmpty = !content.trim();

  // Determine status indicator
  const getStatusIndicator = () => {
    if (saveState === 'saving') return '⏳';
    if (saveState === 'saved') return '✓';
    if (saveState === 'error') return '!';
    return completed ? '✓' : '○';
  };

  const statusClass = saveState === 'error' ? 'error' : (completed || saveState === 'saved') ? 'complete' : '';

  return (
    <div
      className={`canvas-section ${className} ${isEditing ? 'editing' : ''} ${completed ? 'completed' : ''} ${isUpdating ? 'just-updated' : ''} ${saveState === 'saving' ? 'saving' : ''} ${saveState === 'error' ? 'has-error' : ''}`}
      data-model={model || undefined}
      onClick={handleClick}
    >
      <div className="canvas-section-header">
        <span className="canvas-section-title">{label.toUpperCase()}</span>
        <span className={`canvas-section-status ${statusClass}`}>
          {getStatusIndicator()}
        </span>
      </div>

      {/* Error message */}
      {saveError && (
        <div className="canvas-section-error">
          {saveError}
        </div>
      )}

      {isEditing ? (
        <>
          <textarea
            ref={textareaRef}
            className="canvas-section-edit"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveState !== 'saving' ? handleSave : undefined}
            placeholder={helperText || `Enter ${label.toLowerCase()}...`}
            disabled={saveState === 'saving'}
          />
          <div className="canvas-section-actions">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleCancel}
              disabled={saveState === 'saving'}
              title="Cancel (Esc)"
            >
              ✕
            </button>
            <button
              type="button"
              className="save"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSave}
              disabled={saveState === 'saving'}
              title="Save (Cmd+Enter)"
            >
              {saveState === 'saving' ? '⏳' : '✓'}
            </button>
          </div>
        </>
      ) : (
        <div
          className={`canvas-section-content ${isEmpty ? 'helper' : ''} ${shouldTruncate ? 'truncated' : ''}`}
        >
          {isEmpty ? helperText : displayContent}
        </div>
      )}

      {/* Section number - positioned bottom-right via CSS */}
      <span className="canvas-section-number">{sectionNumber}</span>
    </div>
  );
}
