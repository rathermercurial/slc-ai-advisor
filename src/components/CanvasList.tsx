/**
 * Canvas List Component
 *
 * Displays a list of canvases (ventures) for the user to switch between.
 * Uses localStorage for fast startup + backend verification.
 */

import { useState } from 'react';

export interface CanvasInfo {
  id: string;
  name: string;
  lastAccessedAt: string;
}

interface CanvasListProps {
  canvases: CanvasInfo[];
  currentCanvasId: string;
  onCanvasSelect: (canvasId: string) => void;
  onNewCanvas: () => void;
  onRenameCanvas?: (canvasId: string, newName: string) => void;
  onArchiveCanvas?: (canvasId: string) => void;
  isLoading?: boolean;
}

export function CanvasList({
  canvases,
  currentCanvasId,
  onCanvasSelect,
  onNewCanvas,
  onRenameCanvas,
  onArchiveCanvas,
  isLoading = false,
}: CanvasListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleStartEdit = (canvas: CanvasInfo) => {
    setEditingId(canvas.id);
    setEditName(canvas.name || 'Untitled Venture');
  };

  const handleSaveEdit = () => {
    if (editingId && onRenameCanvas) {
      onRenameCanvas(editingId, editName.trim() || 'Untitled Venture');
    }
    setEditingId(null);
    setEditName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="canvas-list">
      <div className="canvas-list-header">
        <h3>Ventures</h3>
        <button
          className="canvas-new-btn"
          onClick={onNewCanvas}
          disabled={isLoading}
          title="Create a new venture"
        >
          + New
        </button>
      </div>

      <div className="canvas-list-items">
        {canvases.length === 0 ? (
          <div className="canvas-list-empty">No ventures yet</div>
        ) : (
          canvases.map((canvas) => (
            <div
              key={canvas.id}
              className={`canvas-item ${canvas.id === currentCanvasId ? 'active' : ''}`}
              onClick={() => !editingId && onCanvasSelect(canvas.id)}
            >
              {editingId === canvas.id ? (
                <div className="canvas-edit">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSaveEdit}
                    autoFocus
                    className="canvas-edit-input"
                  />
                </div>
              ) : (
                <>
                  <div className="canvas-name">
                    {canvas.name || 'Untitled Venture'}
                  </div>
                  <div className="canvas-meta">
                    {formatDate(canvas.lastAccessedAt)}
                  </div>
                  {canvas.id === currentCanvasId && (
                    <div className="canvas-actions">
                      {onRenameCanvas && (
                        <button
                          className="canvas-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(canvas);
                          }}
                          title="Rename"
                        >
                          Rename
                        </button>
                      )}
                      {onArchiveCanvas && canvases.length > 1 && (
                        <button
                          className="canvas-action-btn canvas-action-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            onArchiveCanvas(canvas.id);
                          }}
                          title="Archive"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
