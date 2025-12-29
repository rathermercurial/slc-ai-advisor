/**
 * Thread List Component
 *
 * Displays a list of conversation threads for the current canvas.
 * Allows switching between threads, creating new threads, and basic management.
 */

import { useState } from 'react';

export interface Thread {
  id: string;
  title: string | null;
  summary: string | null;
  starred: boolean;
  archived: boolean;
  createdAt: string;
  lastMessageAt: string;
}

interface ThreadListProps {
  threads: Thread[];
  currentThreadId: string;
  onThreadSelect: (threadId: string) => void;
  onNewThread: () => void;
  onRenameThread?: (threadId: string, newTitle: string) => void;
  onArchiveThread?: (threadId: string) => void;
  isLoading?: boolean;
}

export function ThreadList({
  threads,
  currentThreadId,
  onThreadSelect,
  onNewThread,
  onRenameThread,
  onArchiveThread,
  isLoading = false,
}: ThreadListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartEdit = (thread: Thread) => {
    setEditingId(thread.id);
    setEditTitle(thread.title || '');
  };

  const handleSaveEdit = () => {
    if (editingId && onRenameThread) {
      onRenameThread(editingId, editTitle.trim() || 'Untitled');
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
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
    <div className="thread-list">
      <div className="thread-list-header">
        <h3>Conversations</h3>
        <button
          className="thread-new-btn"
          onClick={onNewThread}
          disabled={isLoading}
          title="Start a new conversation"
        >
          + New
        </button>
      </div>

      <div className="thread-list-items">
        {threads.length === 0 ? (
          <div className="thread-list-empty">No conversations yet</div>
        ) : (
          threads.map((thread) => (
            <div
              key={thread.id}
              className={`thread-item ${thread.id === currentThreadId ? 'active' : ''}`}
              onClick={() => !editingId && onThreadSelect(thread.id)}
            >
              {editingId === thread.id ? (
                <div className="thread-edit">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSaveEdit}
                    autoFocus
                    className="thread-edit-input"
                  />
                </div>
              ) : (
                <>
                  <div className="thread-title">
                    {thread.title || 'Untitled'}
                  </div>
                  <div className="thread-meta">
                    {formatDate(thread.lastMessageAt)}
                  </div>
                  {thread.id === currentThreadId && (
                    <div className="thread-actions">
                      {onRenameThread && (
                        <button
                          className="thread-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(thread);
                          }}
                          title="Rename"
                        >
                          Rename
                        </button>
                      )}
                      {onArchiveThread && (
                        <button
                          className="thread-action-btn thread-action-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            onArchiveThread(thread.id);
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
