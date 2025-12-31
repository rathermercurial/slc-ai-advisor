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
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  helperText?: string;
  className?: string;
  truncateAt?: number;
  isComplete?: boolean;
  /** Visual indicator for AI-triggered updates */
  isUpdating?: boolean;
  /** If true, clicking just triggers onClick instead of entering edit mode */
  readOnly?: boolean;
  /** Called when Tab is pressed - parent should focus next field */
  onTabNext?: () => void;
  /** Called when Shift+Tab is pressed - parent should focus previous field */
  onTabPrev?: () => void;
  /** External control to enter edit mode */
  forceEdit?: boolean;
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
  onClick,
  onMouseEnter,
  onMouseLeave,
  helperText,
  className = '',
  truncateAt = 50,
  isComplete,
  isUpdating = false,
  readOnly = false,
  onTabNext,
  onTabPrev,
  forceEdit = false,
}: CanvasSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Track mounted state to prevent state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const label = CANVAS_SECTION_LABELS[sectionKey];
  const sectionNumber = CANVAS_SECTION_NUMBER[sectionKey];
  const model = SECTION_TO_MODEL[sectionKey];

  // Completion is based on successful save (saveState === 'saved') or explicit isComplete
  // Fall back to content length check for initial render before any save
  const completed = isComplete ?? (saveState === 'saved' || content.trim().length > 0);

  // Auto-resize textarea to fit content
  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
      // Auto-resize after focus
      autoResize();
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

  // External control to enter edit mode (for tab navigation)
  useEffect(() => {
    if (forceEdit && !isEditing && !readOnly) {
      onFocus?.();
      setIsEditing(true);
      setSaveError(null);
    }
  }, [forceEdit, isEditing, readOnly, onFocus]);

  const handleClick = () => {
    if (readOnly) {
      onClick?.();
      return;
    }
    if (!isEditing && saveState !== 'saving') {
      onFocus?.();
      setIsEditing(true);
      setSaveError(null);
    }
  };

  const handleSave = async () => {
    // Prevent concurrent saves
    if (saveState === 'saving') {
      return;
    }

    if (draft === content) {
      setIsEditing(false);
      return;
    }

    setSaveState('saving');
    setSaveError(null);

    const result = await onSave(draft);

    // Check if still mounted before updating state
    if (!mountedRef.current) return;

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

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
    // Tab navigation between fields
    if (e.key === 'Tab') {
      e.preventDefault();
      // Prevent concurrent saves
      if (saveState === 'saving') {
        return;
      }
      // Save current content first
      if (draft !== content) {
        setSaveState('saving');
        const result = await onSave(draft);
        // Check if still mounted before updating state
        if (!mountedRef.current) return;
        if (result.success) {
          setSaveState('saved');
        } else {
          setSaveState('error');
          setSaveError(result.errors?.[0] || 'Failed to save');
          return; // Don't navigate on error
        }
      }
      setIsEditing(false);
      // Navigate to next/prev field
      if (e.shiftKey) {
        onTabPrev?.();
      } else {
        onTabNext?.();
      }
    }
  };

  // Truncate content for display
  const words = content.split(/\s+/).filter(Boolean);
  const shouldTruncate = words.length > truncateAt && !isEditing;
  const displayContent = shouldTruncate
    ? words.slice(0, truncateAt).join(' ')
    : content;

  const isEmpty = !content.trim();

  // Determine status indicator (no indicator for incomplete)
  const getStatusIndicator = () => {
    if (saveState === 'saving') return '⏳';
    if (saveState === 'saved') return '✓';
    if (saveState === 'error') return '!';
    return completed ? '✓' : null;
  };

  const statusClass = saveState === 'error' ? 'error' : (completed || saveState === 'saved') ? 'complete' : '';
  const statusIndicator = getStatusIndicator();

  // Handle keyboard for read-only sections (like Impact toggle)
  const handleContainerKeyDown = (e: React.KeyboardEvent) => {
    if (readOnly && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.();
    }
    // Tab navigation for read-only sections
    if (readOnly && e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        onTabPrev?.();
      } else {
        onTabNext?.();
      }
    }
  };

  return (
    <div
      className={`canvas-section ${className} ${isEditing ? 'editing' : ''} ${completed ? 'completed' : ''} ${isUpdating ? 'just-updated' : ''} ${saveState === 'saving' ? 'saving' : ''} ${saveState === 'error' ? 'has-error' : ''} ${readOnly ? 'read-only' : ''}`}
      data-model={model || undefined}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      tabIndex={readOnly ? 0 : -1}
      onKeyDown={readOnly ? handleContainerKeyDown : undefined}
      role={readOnly ? 'button' : undefined}
      aria-label={readOnly ? `Toggle ${label}` : undefined}
    >
      <div className="canvas-section-header">
        <span className="canvas-section-title">{label.toUpperCase()}</span>
        {statusIndicator && (
          <span className={`canvas-section-status ${statusClass}`}>
            {statusIndicator}
          </span>
        )}
      </div>

      {/* Error message */}
      {saveError && (
        <div className="canvas-section-error" role="alert" aria-live="polite">
          {saveError}
        </div>
      )}

      {isEditing ? (
        <>
          <textarea
            ref={textareaRef}
            className="canvas-section-edit"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              autoResize();
            }}
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
              aria-label="Cancel"
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
              aria-label="Save"
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
