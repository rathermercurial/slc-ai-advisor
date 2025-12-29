import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CanvasList } from './CanvasList';
import { ThreadList } from './ThreadList';

/**
 * Sidebar component with collapsible canvas and thread sections.
 * Left edge of screen, can be collapsed entirely.
 */
export function Sidebar() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  const [canvasesCollapsed, setCanvasesCollapsed] = useState(() => {
    const saved = localStorage.getItem('canvasesCollapsed');
    return saved === 'true';
  });

  const [threadsCollapsed, setThreadsCollapsed] = useState(() => {
    const saved = localStorage.getItem('threadsCollapsed');
    return saved === 'true';
  });

  // Persist collapse states
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('canvasesCollapsed', String(canvasesCollapsed));
  }, [canvasesCollapsed]);

  useEffect(() => {
    localStorage.setItem('threadsCollapsed', String(threadsCollapsed));
  }, [threadsCollapsed]);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  if (sidebarCollapsed) {
    return (
      <div className="sidebar sidebar-collapsed">
        <button
          type="button"
          className="sidebar-expand-btn"
          onClick={handleToggleSidebar}
          title="Expand sidebar"
          aria-label="Expand sidebar"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={handleToggleSidebar}
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <CanvasList
        collapsed={canvasesCollapsed}
        onToggleCollapse={() => setCanvasesCollapsed((prev) => !prev)}
      />

      <ThreadList
        collapsed={threadsCollapsed}
        onToggleCollapse={() => setThreadsCollapsed((prev) => !prev)}
      />
    </div>
  );
}
