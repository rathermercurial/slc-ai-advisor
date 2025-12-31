import { useState, useEffect, useRef, useCallback, KeyboardEvent, ChangeEvent } from 'react';
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
 * Data is fetched from backend API /api/canvases.
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

  // Fetch canvases from backend API
  const fetchCanvases = useCallback(async (filterValue: FilterOption) => {
    try {
      const response = await fetch(`/api/canvases?filter=${filterValue}`);
      if (response.ok) {
        const data = await response.json() as CanvasMeta[];
        setCanvases(data);
      }
    } catch (err) {
      console.error('Failed to load canvases:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load canvases on mount and when filter changes
  useEffect(() => {
    fetchCanvases(filter);
  }, [filter, fetchCanvases]);

  // Listen for canvas updates from other components (e.g., header rename)
  useEffect(() => {
    const handleCanvasUpdate = () => {
      fetchCanvases(filter);
    };
    window.addEventListener('canvasIndexUpdated', handleCanvasUpdate);
    return () => window.removeEventListener('canvasIndexUpdated', handleCanvasUpdate);
  }, [filter, fetchCanvases]);

  // Canvases are already filtered by the API
  const filteredCanvases = canvases;

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

    // Optimistic update
    setCanvases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c))
    );

    try {
      const response = await fetch(`/api/canvas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!response.ok) {
        console.error('Failed to rename canvas:', response.status);
        // Revert on error
        fetchCanvases(filter);
      } else {
        // Dispatch event for header sync
        window.dispatchEvent(new Event('canvasIndexUpdated'));
      }
    } catch (err) {
      console.error('Failed to rename canvas:', err);
      fetchCanvases(filter);
    }
    setEditingId(null);
  };

  const handleToggleStar = async (id: string, starred: boolean) => {
    // Optimistic update
    setCanvases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, starred: !starred } : c))
    );

    try {
      const response = await fetch(`/api/canvas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !starred }),
      });

      if (!response.ok) {
        console.error('Failed to toggle star:', response.status);
        fetchCanvases(filter);
      }
    } catch (err) {
      console.error('Failed to toggle star:', err);
      fetchCanvases(filter);
    }
  };

  const handleArchive = async (id: string) => {
    // Optimistic update
    setCanvases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, archived: true } : c))
    );

    try {
      const response = await fetch(`/api/canvas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      });

      if (!response.ok) {
        console.error('Failed to archive canvas:', response.status);
        fetchCanvases(filter);
      }
    } catch (err) {
      console.error('Failed to archive canvas:', err);
      fetchCanvases(filter);
    }
  };

  const handleUnarchive = async (id: string) => {
    // Optimistic update
    setCanvases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, archived: false } : c))
    );

    try {
      const response = await fetch(`/api/canvas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: false }),
      });

      if (!response.ok) {
        console.error('Failed to unarchive canvas:', response.status);
        fetchCanvases(filter);
      }
    } catch (err) {
      console.error('Failed to unarchive canvas:', err);
      fetchCanvases(filter);
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

      // Re-fetch to get the new canvas from backend
      await fetchCanvases(filter);

      // Navigate to new canvas
      navigate(`/canvas/${data.canvasId}`);
    } catch (err) {
      console.error('Failed to create canvas:', err);
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
            title="New Canvas"
          >
            +
          </button>
          <FilterDropdown value={filter} onChange={setFilter} />
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
                      handleUnarchive(canvas.id);
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
