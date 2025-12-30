import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, Star, Pencil, Archive, ArchiveRestore } from 'lucide-react';
import { FilterDropdown, type FilterOption } from './FilterDropdown';
import type { CanvasMeta } from '../types/thread';

interface CanvasListProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onHoverChange?: (text: string | null) => void;
}

/**
 * Canvas list component for sidebar.
 * Shows list of canvases with filter, star/archive controls.
 */
export function CanvasList({ collapsed, onToggleCollapse, onHoverChange }: CanvasListProps) {
  const { canvasId } = useParams<{ canvasId: string }>();
  const navigate = useNavigate();

  const [canvases, setCanvases] = useState<CanvasMeta[]>([]);
  const [filter, setFilter] = useState<FilterOption>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

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

    // Listen for same-tab sync (when name changes in header)
    const handleCanvasIndexUpdate = () => {
      loadCanvases();
    };
    window.addEventListener('canvasIndexUpdated', handleCanvasIndexUpdate);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('canvasIndexUpdated', handleCanvasIndexUpdate);
    };
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

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditValue(currentName);
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit(id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingId(null);
    }
  };

  const handleEditChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const saveEdit = async (id: string) => {
    const trimmed = editValue.trim();
    const canvas = canvases.find(c => c.id === id);
    if (!trimmed || trimmed === canvas?.name) {
      setEditingId(null);
      return;
    }

    try {
      const response = await fetch(`/api/canvas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!response.ok) {
        console.error('Failed to rename canvas:', response.status);
        setEditingId(null);
        return;
      }

      // Update local state
      setCanvases((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c))
      );
      // Update localStorage
      updateCanvasIndex((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c))
      );
      // Dispatch event for header sync
      window.dispatchEvent(new Event('canvasIndexUpdated'));
    } catch (err) {
      console.error('Failed to rename canvas:', err);
    }
    setEditingId(null);
  };

  const handleToggleStar = async (id: string, starred: boolean) => {
    try {
      const response = await fetch(`/api/canvas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !starred }),
      });

      if (!response.ok) {
        console.error('Failed to toggle star:', response.status);
        return;
      }

      setCanvases((prev) =>
        prev.map((c) => (c.id === id ? { ...c, starred: !starred } : c))
      );
      updateCanvasIndex((prev) =>
        prev.map((c) => (c.id === id ? { ...c, starred: !starred } : c))
      );
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

      if (!response.ok) {
        console.error('Failed to archive canvas:', response.status);
        return;
      }

      setCanvases((prev) =>
        prev.map((c) => (c.id === id ? { ...c, archived: true } : c))
      );
      updateCanvasIndex((prev) =>
        prev.map((c) => (c.id === id ? { ...c, archived: true } : c))
      );
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

      if (!response.ok) {
        console.error('Failed to create canvas:', response.status);
        return;
      }

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

      // Dispatch event for header sync
      window.dispatchEvent(new Event('canvasIndexUpdated'));

      // Navigate to new canvas
      navigate(`/canvas/${data.canvasId}`);
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
      <div className="sidebar-section-header">
        <button
          type="button"
          className="sidebar-section-title-btn"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand canvases section' : 'Collapse canvases section'}
        >
          <span className="sidebar-section-toggle">
            {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
          </span>
          <span className="sidebar-section-title">CANVASES</span>
        </button>
        <div className="sidebar-section-controls">
          <button
            type="button"
            className="sidebar-add-btn"
            onClick={handleCreateCanvas}
            onMouseEnter={() => onHoverChange?.('New canvas')}
            onMouseLeave={() => onHoverChange?.(null)}
            title="New Canvas"
          >
            +
          </button>
          <FilterDropdown
            value={filter}
            onChange={setFilter}
            onHoverChange={onHoverChange}
            hoverLabel="Filter canvases"
          />
        </div>
      </div>

      {!collapsed && (
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
                onClick={() => editingId !== canvas.id && handleCanvasClick(canvas.id)}
              >
                <button
                  type="button"
                  className={`sidebar-star-btn ${canvas.starred ? 'starred' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleStar(canvas.id, canvas.starred);
                  }}
                  onMouseEnter={() => onHoverChange?.(canvas.starred ? 'Unstar' : 'Star')}
                  onMouseLeave={() => onHoverChange?.(null)}
                  aria-label={canvas.starred ? 'Unstar canvas' : 'Star canvas'}
                >
                  <Star size={14} fill={canvas.starred ? 'currentColor' : 'none'} />
                </button>
                {editingId === canvas.id ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editValue}
                    onChange={handleEditChange}
                    onBlur={() => saveEdit(canvas.id)}
                    onKeyDown={(e) => handleEditKeyDown(e, canvas.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="sidebar-item-name-input"
                    aria-label="Edit canvas name"
                  />
                ) : (
                  <span className="sidebar-item-name">{canvas.name || 'Untitled'}</span>
                )}
                <button
                  type="button"
                  className="sidebar-edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(canvas.id, canvas.name);
                  }}
                  onMouseEnter={() => onHoverChange?.('Rename')}
                  onMouseLeave={() => onHoverChange?.(null)}
                  aria-label="Rename canvas"
                >
                  <Pencil size={14} />
                </button>
                {!canvas.archived ? (
                  <button
                    type="button"
                    className="sidebar-archive-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArchive(canvas.id);
                    }}
                    onMouseEnter={() => onHoverChange?.('Archive')}
                    onMouseLeave={() => onHoverChange?.(null)}
                    aria-label="Archive canvas"
                  >
                    <Archive size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="sidebar-unarchive-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement unarchive
                    }}
                    onMouseEnter={() => onHoverChange?.('Restore')}
                    onMouseLeave={() => onHoverChange?.(null)}
                    aria-label="Restore canvas from archive"
                  >
                    <ArchiveRestore size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
