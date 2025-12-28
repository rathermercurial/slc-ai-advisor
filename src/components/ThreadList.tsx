import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { InlineEdit } from './InlineEdit';
import { FilterDropdown, type FilterOption } from './FilterDropdown';
import type { Thread } from '../types/thread';

interface ThreadListProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * Thread list component for sidebar.
 * Shows threads for current canvas with filter, star/archive controls.
 */
export function ThreadList({ collapsed, onToggleCollapse }: ThreadListProps) {
  const { canvasId, threadId } = useParams<{ canvasId: string; threadId?: string }>();
  const navigate = useNavigate();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [filter, setFilter] = useState<FilterOption>('active');
  const [isLoading, setIsLoading] = useState(true);

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
      if (response.ok) {
        const data = await response.json();
        setThreads(data);
      }
    } catch (err) {
      console.error('Failed to load threads:', err);
    } finally {
      setIsLoading(false);
    }
  }, [canvasId, filter]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const handleThreadClick = (id: string) => {
    navigate(`/canvas/${canvasId}/chat/${id}`);
  };

  const handleRename = async (id: string, name: string) => {
    if (!canvasId) return;

    try {
      const response = await fetch(`/api/canvas/${canvasId}/threads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        setThreads((prev) =>
          prev.map((t) => (t.id === id ? { ...t, name } : t))
        );
      }
    } catch (err) {
      console.error('Failed to rename thread:', err);
    }
  };

  const handleToggleStar = async (id: string, starred: boolean) => {
    if (!canvasId) return;

    try {
      const response = await fetch(`/api/canvas/${canvasId}/threads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !starred }),
      });

      if (response.ok) {
        setThreads((prev) =>
          prev.map((t) => (t.id === id ? { ...t, starred: !starred } : t))
        );
      }
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

      if (response.ok) {
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
      }
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

      if (response.ok) {
        const newThread = await response.json();
        setThreads((prev) => [newThread, ...prev]);

        // Navigate to new thread
        navigate(`/canvas/${canvasId}/chat/${newThread.id}`);
      }
    } catch (err) {
      console.error('Failed to create thread:', err);
    }
  };

  if (collapsed || !canvasId) {
    return null;
  }

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header" onClick={onToggleCollapse}>
        <span className="sidebar-section-title">THREADS</span>
        <span className="sidebar-section-toggle">-</span>
      </div>

      <div className="sidebar-section-controls">
        <FilterDropdown value={filter} onChange={setFilter} />
        <button
          type="button"
          className="sidebar-add-btn"
          onClick={handleCreateThread}
          title="New Thread"
        >
          +
        </button>
      </div>

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
              onClick={() => handleThreadClick(thread.id)}
            >
              <button
                type="button"
                className={`sidebar-star-btn ${thread.starred ? 'starred' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleStar(thread.id, thread.starred);
                }}
                title={thread.starred ? 'Unstar' : 'Star'}
              >
                {thread.starred ? '*' : 'o'}
              </button>
              <InlineEdit
                value={thread.name}
                onSave={(name) => handleRename(thread.id, name)}
                className="sidebar-item-name"
              />
              {!thread.archived && (
                <button
                  type="button"
                  className="sidebar-archive-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleArchive(thread.id);
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
    </div>
  );
}
