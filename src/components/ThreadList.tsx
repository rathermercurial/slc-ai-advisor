import { useState, useEffect, useCallback, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, Star, Pencil, Archive, ArchiveRestore } from 'lucide-react';
import { FilterDropdown, type FilterOption } from './FilterDropdown';
import type { Thread } from '../types/thread';
import { useCanvasContext } from '../context';

interface ThreadListProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onHoverChange?: (text: string | null) => void;
}

/**
 * Thread list component for sidebar.
 * Shows threads for current canvas with filter, star/archive controls.
 */
export function ThreadList({ collapsed, onToggleCollapse, onHoverChange }: ThreadListProps) {
  const { canvasId, threadId } = useParams<{ canvasId: string; threadId?: string }>();
  const navigate = useNavigate();
  const { setRefreshThreadsCallback } = useCanvasContext();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [filter, setFilter] = useState<FilterOption>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Load threads for current canvas
  const loadThreads = useCallback(async () => {
    if (!canvasId) {
      setThreads([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/canvas/${canvasId}/threads?filter=${filter}`);
      if (!response.ok) {
        console.error('Failed to load threads:', response.status);
        return;
      }
      const data = await response.json();
      setThreads(data);
    } catch (err) {
      console.error('Failed to load threads:', err);
    } finally {
      setIsLoading(false);
    }
  }, [canvasId, filter]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Register loadThreads with context so Chat can trigger refresh after auto-naming
  useEffect(() => {
    setRefreshThreadsCallback(loadThreads);
  }, [loadThreads, setRefreshThreadsCallback]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleThreadClick = (id: string) => {
    navigate(`/canvas/${canvasId}/chat/${id}`);
  };

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
    if (!canvasId) {
      setEditingId(null);
      return;
    }

    const trimmed = editValue.trim();
    const thread = threads.find(t => t.id === id);
    if (!trimmed || trimmed === thread?.name) {
      setEditingId(null);
      return;
    }

    try {
      const response = await fetch(`/api/canvas/${canvasId}/threads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!response.ok) {
        console.error('Failed to rename thread:', response.status);
        setEditingId(null);
        return;
      }

      setThreads((prev) =>
        prev.map((t) => (t.id === id ? { ...t, name: trimmed } : t))
      );
    } catch (err) {
      console.error('Failed to rename thread:', err);
    }
    setEditingId(null);
  };

  const handleToggleStar = async (id: string, starred: boolean) => {
    if (!canvasId) return;

    try {
      const response = await fetch(`/api/canvas/${canvasId}/threads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !starred }),
      });

      if (!response.ok) {
        console.error('Failed to toggle star:', response.status);
        return;
      }

      setThreads((prev) =>
        prev.map((t) => (t.id === id ? { ...t, starred: !starred } : t))
      );
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  const handleArchive = async (id: string) => {
    if (!canvasId) return;

    try {
      const response = await fetch(`/api/canvas/${canvasId}/threads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      });

      if (!response.ok) {
        console.error('Failed to archive thread:', response.status);
        return;
      }

      // If archiving current thread, navigate to first remaining thread
      if (id === threadId) {
        const remaining = threads.filter((t) => t.id !== id && !t.archived);
        if (remaining.length > 0) {
          navigate(`/canvas/${canvasId}/chat/${remaining[0].id}`);
        } else {
          navigate(`/canvas/${canvasId}`);
        }
      }

      // Reload threads
      loadThreads();
    } catch (err) {
      console.error('Failed to archive thread:', err);
    }
  };

  const handleCreateThread = async () => {
    if (!canvasId) return;

    try {
      const response = await fetch(`/api/canvas/${canvasId}/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        console.error('Failed to create thread:', response.status);
        return;
      }

      const newThread = await response.json();
      setThreads((prev) => [newThread, ...prev]);

      // Navigate to new thread
      navigate(`/canvas/${canvasId}/chat/${newThread.id}`);
    } catch (err) {
      console.error('Failed to create thread:', err);
    }
  };

  // Hide thread section entirely if no canvas selected
  if (!canvasId) {
    return null;
  }

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header">
        <button
          type="button"
          className="sidebar-section-title-btn"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand threads section' : 'Collapse threads section'}
        >
          <span className="sidebar-section-toggle">
            {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
          </span>
          <span className="sidebar-section-title">THREADS</span>
        </button>
        <div className="sidebar-section-controls">
          <button
            type="button"
            className="sidebar-add-btn"
            onClick={handleCreateThread}
            title="New Thread"
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
            ) : threads.length === 0 ? (
              <div className="sidebar-list-empty">No threads</div>
            ) : (
              threads.map((thread) => (
                <div
                  key={thread.id}
                  className={`sidebar-list-item ${thread.id === threadId ? 'active' : ''}`}
                  onClick={() => editingId !== thread.id && handleThreadClick(thread.id)}
                >
                  <button
                    type="button"
                    className={`sidebar-star-btn ${thread.starred ? 'starred' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStar(thread.id, thread.starred);
                    }}
                    onMouseEnter={() => onHoverChange?.(thread.starred ? 'Unstar' : 'Star')}
                    onMouseLeave={() => onHoverChange?.(null)}
                    aria-label={thread.starred ? 'Unstar thread' : 'Star thread'}
                  >
                    <Star size={14} fill={thread.starred ? 'currentColor' : 'none'} />
                  </button>
                  {editingId === thread.id ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editValue}
                      onChange={handleEditChange}
                      onBlur={() => saveEdit(thread.id)}
                      onKeyDown={(e) => handleEditKeyDown(e, thread.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="sidebar-item-name-input"
                      aria-label="Edit thread name"
                    />
                  ) : (
                    <span className="sidebar-item-name">{thread.name || 'Untitled'}</span>
                  )}
                  <button
                    type="button"
                    className="sidebar-edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(thread.id, thread.name);
                    }}
                    onMouseEnter={() => onHoverChange?.('Rename')}
                    onMouseLeave={() => onHoverChange?.(null)}
                    aria-label="Rename thread"
                  >
                    <Pencil size={14} />
                  </button>
                  {!thread.archived ? (
                    <button
                      type="button"
                      className="sidebar-archive-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchive(thread.id);
                      }}
                      onMouseEnter={() => onHoverChange?.('Archive')}
                      onMouseLeave={() => onHoverChange?.(null)}
                      aria-label="Archive thread"
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
                      aria-label="Restore thread from archive"
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
