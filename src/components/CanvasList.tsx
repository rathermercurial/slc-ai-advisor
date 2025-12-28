import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { InlineEdit } from './InlineEdit';
import { FilterDropdown, type FilterOption } from './FilterDropdown';
import type { CanvasMeta } from '../types/thread';

interface CanvasListProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * Canvas list component for sidebar.
 * Shows list of canvases with filter, star/archive controls.
 */
export function CanvasList({ collapsed, onToggleCollapse }: CanvasListProps) {
  const { canvasId } = useParams<{ canvasId: string }>();
  const navigate = useNavigate();

  const [canvases, setCanvases] = useState<CanvasMeta[]>([]);
  const [filter, setFilter] = useState<FilterOption>('active');
  const [isLoading, setIsLoading] = useState(true);

  // Load canvases from localStorage index
  useEffect(() => {
    const loadCanvases = () => {
      try {
        const stored = localStorage.getItem('canvasIndex');
        if (stored) {
          const parsed = JSON.parse(stored) as CanvasMeta[];
          setCanvases(parsed);
        }
      } catch (err) {
        console.error('Failed to load canvas index:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCanvases();

    // Listen for storage changes from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'canvasIndex') {
        loadCanvases();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Filter canvases
  const filteredCanvases = canvases.filter((canvas) => {
    switch (filter) {
      case 'active':
        return !canvas.archived;
      case 'starred':
        return canvas.starred;
      case 'archived':
        return canvas.archived;
      default:
        return true;
    }
  });

  const handleCanvasClick = (id: string) => {
    navigate(`/canvas/${id}`);
  };

  const handleRename = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/canvas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        // Update local state
        setCanvases((prev) =>
          prev.map((c) => (c.id === id ? { ...c, name } : c))
        );
        // Update localStorage
        updateCanvasIndex((prev) =>
          prev.map((c) => (c.id === id ? { ...c, name } : c))
        );
      }
    } catch (err) {
      console.error('Failed to rename canvas:', err);
    }
  };

  const handleToggleStar = async (id: string, starred: boolean) => {
    try {
      const response = await fetch(`/api/canvas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !starred }),
      });

      if (response.ok) {
        setCanvases((prev) =>
          prev.map((c) => (c.id === id ? { ...c, starred: !starred } : c))
        );
        updateCanvasIndex((prev) =>
          prev.map((c) => (c.id === id ? { ...c, starred: !starred } : c))
        );
      }
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const response = await fetch(`/api/canvas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      });

      if (response.ok) {
        setCanvases((prev) =>
          prev.map((c) => (c.id === id ? { ...c, archived: true } : c))
        );
        updateCanvasIndex((prev) =>
          prev.map((c) => (c.id === id ? { ...c, archived: true } : c))
        );
      }
    } catch (err) {
      console.error('Failed to archive canvas:', err);
    }
  };

  const handleCreateCanvas = async () => {
    try {
      const response = await fetch('/api/canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        const newCanvas: CanvasMeta = {
          id: data.canvasId,
          name: 'Untitled Canvas',
          starred: false,
          archived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setCanvases((prev) => [newCanvas, ...prev]);
        updateCanvasIndex((prev) => [newCanvas, ...prev]);

        // Navigate to new canvas
        navigate(`/canvas/${data.canvasId}`);
      }
    } catch (err) {
      console.error('Failed to create canvas:', err);
    }
  };

  const updateCanvasIndex = (
    updater: (prev: CanvasMeta[]) => CanvasMeta[]
  ) => {
    try {
      const stored = localStorage.getItem('canvasIndex');
      const current = stored ? JSON.parse(stored) : [];
      const updated = updater(current);
      localStorage.setItem('canvasIndex', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to update canvas index:', err);
    }
  };

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header" onClick={onToggleCollapse}>
        <span className="sidebar-section-title">CANVASES</span>
        <span className="sidebar-section-toggle">{collapsed ? '+' : '-'}</span>
      </div>

      {!collapsed && (
        <>
          <div className="sidebar-section-controls">
            <FilterDropdown value={filter} onChange={setFilter} />
            <button
              type="button"
              className="sidebar-add-btn"
              onClick={handleCreateCanvas}
              title="New Canvas"
            >
              +
            </button>
          </div>

          <div className="sidebar-list">
        {isLoading ? (
          <div className="sidebar-list-loading">Loading...</div>
        ) : filteredCanvases.length === 0 ? (
          <div className="sidebar-list-empty">No canvases</div>
        ) : (
          filteredCanvases.map((canvas) => (
            <div
              key={canvas.id}
              className={`sidebar-list-item ${canvas.id === canvasId ? 'active' : ''}`}
              onClick={() => handleCanvasClick(canvas.id)}
            >
              <button
                type="button"
                className={`sidebar-star-btn ${canvas.starred ? 'starred' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleStar(canvas.id, canvas.starred);
                }}
                title={canvas.starred ? 'Unstar' : 'Star'}
              >
                {canvas.starred ? '*' : 'o'}
              </button>
              <InlineEdit
                value={canvas.name}
                onSave={(name) => handleRename(canvas.id, name)}
                className="sidebar-item-name"
              />
              {!canvas.archived && (
                <button
                  type="button"
                  className="sidebar-archive-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleArchive(canvas.id);
                  }}
                  title="Archive"
                >
                  x
                </button>
              )}
            </div>
          ))
        )}
          </div>
        </>
      )}
    </div>
  );
}
