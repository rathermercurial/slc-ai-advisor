import { useState, useRef, useEffect } from 'react';
import {
  type CanvasSectionId,
  CANVAS_SECTION_NUMBER,
  CANVAS_SECTION_LABELS,
  SECTION_TO_MODEL,
} from '../types/canvas';

interface CanvasSectionProps {
  sectionKey: CanvasSectionId;
  content: string;
  onSave: (content: string) => void;
  truncateAt?: number;
}

/**
 * A single canvas section card with inline editing.
 * Click to edit, Escape to cancel, Cmd+Enter or blur to save.
 */
export function CanvasSection({
  sectionKey,
  content,
  onSave,
  truncateAt = 40,
}: CanvasSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sectionNumber = CANVAS_SECTION_NUMBER[sectionKey];
  const label = CANVAS_SECTION_LABELS[sectionKey];
  const model = SECTION_TO_MODEL[sectionKey];

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
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
  const words = content.split(/\s+/);
  const shouldTruncate = words.length > truncateAt && !isEditing;
  const displayContent = shouldTruncate
    ? words.slice(0, truncateAt).join(' ')
    : content;

  const isImpact = sectionKey === 'impact';

  return (
    <div
      className={`canvas-section ${isImpact ? 'impact' : ''} ${isEditing ? 'editing' : ''}`}
      onClick={handleClick}
    >
      <div className="canvas-section-header">
        <span className="canvas-section-number">{sectionNumber}</span>
        <span className="canvas-section-title">{label}</span>
        {model && <span className="canvas-section-model">{model}</span>}
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
            placeholder={`Enter ${label.toLowerCase()}...`}
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
          className={`canvas-section-content ${!content ? 'empty' : ''} ${shouldTruncate ? 'truncated' : ''}`}
        >
          {displayContent || `Click to add ${label.toLowerCase()}`}
        </div>
      )}
    </div>
  );
}
