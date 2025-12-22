import { useState, useRef, useEffect } from 'react';
import {
  type CanvasSectionId,
  CANVAS_SECTION_LABELS,
} from '../types/canvas';

interface CanvasSectionProps {
  sectionKey: CanvasSectionId;
  content: string;
  onSave: (content: string) => void;
  helperText?: string;
  className?: string;
  truncateAt?: number;
}

/**
 * A single canvas section card with inline editing.
 * Click to edit, Escape to cancel, Cmd+Enter or blur to save.
 * Shows helper text when content is empty.
 */
export function CanvasSection({
  sectionKey,
  content,
  onSave,
  helperText,
  className = '',
  truncateAt = 50,
}: CanvasSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const label = CANVAS_SECTION_LABELS[sectionKey];

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end
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

  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    if (draft !== content) {
      onSave(draft);
    }
  };

  const handleCancel = () => {
    setDraft(content);
    setIsEditing(false);
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

  return (
    <div
      className={`canvas-section ${className} ${isEditing ? 'editing' : ''}`}
      onClick={handleClick}
    >
      <div className="canvas-section-header">
        <span className="canvas-section-title">{label.toUpperCase()}</span>
      </div>

      {isEditing ? (
        <>
          <textarea
            ref={textareaRef}
            className="canvas-section-edit"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            placeholder={helperText || `Enter ${label.toLowerCase()}...`}
          />
          <div className="canvas-section-actions">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="save"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSave}
            >
              Save
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
    </div>
  );
}
