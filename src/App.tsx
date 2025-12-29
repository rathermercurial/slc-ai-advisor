import { useState, useEffect, useCallback, Component, ReactNode } from 'react';
import { Canvas, CanvasList, Chat, ThreadList, type CanvasInfo, type Thread } from './components';
import { CanvasProvider } from './context';
import {
  getLocalCanvases,
  addCanvas,
  updateCanvas,
  removeCanvas,
  touchCanvas,
  verifyAllCanvases,
} from './utils/canvasRegistry';

/**
 * Error boundary to catch and display React errors
 */
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red' }}>
          <h2>Something went wrong:</h2>
          <pre>{this.state.error?.message}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * SLC AI Advisor - Main Application
 *
 * Three-column layout: Sidebar (threads) + Canvas (60%) + Chat (40%).
 * Dark mode toggle in header.
 *
 * Multi-thread architecture:
 * - canvasId identifies the canvas (venture)
 * - threadId identifies the current conversation thread
 * - Multiple threads can exist per canvas
 */
function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Check localStorage or system preference
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [canvasId, setCanvasId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [canvases, setCanvases] = useState<CanvasInfo[]>([]);
  const [canvasesLoading, setCanvasesLoading] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Initialize: Load canvas registry and restore session
  useEffect(() => {
    async function initSession() {
      setCanvasesLoading(true);

      // Step 1: Load and verify canvas registry from localStorage
      const localCanvases = getLocalCanvases();
      let verifiedCanvases: CanvasInfo[] = [];

      if (localCanvases.length > 0) {
        // Verify canvases exist on backend
        verifiedCanvases = await verifyAllCanvases();
        setCanvases(verifiedCanvases);
      }

      // Step 2: Try to restore the last session
      const savedCanvas = localStorage.getItem('canvasId');
      const savedThread = localStorage.getItem('threadId');

      if (savedCanvas && verifiedCanvases.some((c) => c.id === savedCanvas)) {
        // Canvas exists in registry, try to restore session
        try {
          const response = await fetch(`/api/session/${savedCanvas}`);
          if (response.ok) {
            const data = await response.json();
            setSessionId(savedCanvas);
            setCanvasId(savedCanvas);
            setThreadId(data.threadId || savedThread || savedCanvas);
            if (data.threadId) {
              localStorage.setItem('threadId', data.threadId);
            }
            // Update last accessed time
            const updated = touchCanvas(savedCanvas);
            setCanvases(updated);
            setSessionReady(true);
            setCanvasesLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Session check failed, will create new session');
        }
      }

      // Step 3: No valid session found, create a new one
      localStorage.removeItem('sessionId');
      localStorage.removeItem('canvasId');
      localStorage.removeItem('threadId');

      try {
        const response = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('sessionId', data.sessionId);
          localStorage.setItem('canvasId', data.canvasId);
          localStorage.setItem('threadId', data.threadId);
          setSessionId(data.sessionId);
          setCanvasId(data.canvasId);
          setThreadId(data.threadId);

          // Add new canvas to registry
          const newCanvas: CanvasInfo = {
            id: data.canvasId,
            name: 'Untitled Venture',
            lastAccessedAt: new Date().toISOString(),
          };
          const updated = addCanvas(newCanvas);
          setCanvases(updated);
          setSessionReady(true);
        } else {
          setSessionError('Failed to create session. Please refresh the page.');
        }
      } catch (err) {
        console.error('Session creation error:', err);
        setSessionError('Network error. Please check your connection and refresh.');
      }
      setCanvasesLoading(false);
    }

    initSession();
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Fetch threads for current canvas
  const fetchThreads = useCallback(async () => {
    if (!canvasId) return;

    setThreadsLoading(true);
    try {
      const response = await fetch(`/api/canvas/${canvasId}/threads`);
      if (response.ok) {
        const data = await response.json();
        setThreads(data.threads || []);
      }
    } catch (err) {
      console.error('Failed to fetch threads:', err);
    } finally {
      setThreadsLoading(false);
    }
  }, [canvasId]);

  // Fetch threads when canvasId is set
  useEffect(() => {
    if (canvasId && sessionReady) {
      fetchThreads();
    }
  }, [canvasId, sessionReady, fetchThreads]);

  // Handle thread selection
  const handleThreadSelect = useCallback((newThreadId: string) => {
    setThreadId(newThreadId);
    localStorage.setItem('threadId', newThreadId);
  }, []);

  // Create new thread
  const handleNewThread = useCallback(async () => {
    if (!canvasId) return;

    setThreadsLoading(true);
    try {
      const response = await fetch(`/api/canvas/${canvasId}/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const newThread = await response.json();
        setThreads((prev) => [newThread, ...prev]);
        setThreadId(newThread.id);
        localStorage.setItem('threadId', newThread.id);
      }
    } catch (err) {
      console.error('Failed to create thread:', err);
    } finally {
      setThreadsLoading(false);
    }
  }, [canvasId]);

  // Rename thread
  const handleRenameThread = useCallback(
    async (targetThreadId: string, newTitle: string) => {
      if (!canvasId) return;

      try {
        const response = await fetch(`/api/canvas/${canvasId}/threads/${targetThreadId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle }),
        });

        if (response.ok) {
          const updated = await response.json();
          setThreads((prev) =>
            prev.map((t) => (t.id === targetThreadId ? updated : t))
          );
        }
      } catch (err) {
        console.error('Failed to rename thread:', err);
      }
    },
    [canvasId]
  );

  // Archive thread
  const handleArchiveThread = useCallback(
    async (targetThreadId: string) => {
      if (!canvasId) return;

      try {
        const response = await fetch(`/api/canvas/${canvasId}/threads/${targetThreadId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setThreads((prev) => prev.filter((t) => t.id !== targetThreadId));

          // If we archived the current thread, switch to the first available
          if (targetThreadId === threadId) {
            const remaining = threads.filter((t) => t.id !== targetThreadId);
            if (remaining.length > 0) {
              setThreadId(remaining[0].id);
              localStorage.setItem('threadId', remaining[0].id);
            } else {
              // Create a new thread if none remain
              handleNewThread();
            }
          }
        }
      } catch (err) {
        console.error('Failed to archive thread:', err);
      }
    },
    [canvasId, threadId, threads, handleNewThread]
  );

  // Handle canvas selection
  const handleCanvasSelect = useCallback(
    async (newCanvasId: string) => {
      if (newCanvasId === canvasId) return;

      setThreadsLoading(true);
      try {
        // Fetch session info for this canvas
        const response = await fetch(`/api/session/${newCanvasId}`);
        if (response.ok) {
          const data = await response.json();
          setSessionId(newCanvasId);
          setCanvasId(newCanvasId);
          setThreadId(data.threadId || newCanvasId);
          localStorage.setItem('sessionId', newCanvasId);
          localStorage.setItem('canvasId', newCanvasId);
          localStorage.setItem('threadId', data.threadId || newCanvasId);

          // Update last accessed time in registry
          const updated = touchCanvas(newCanvasId);
          setCanvases(updated);
        }
      } catch (err) {
        console.error('Failed to switch canvas:', err);
      } finally {
        setThreadsLoading(false);
      }
    },
    [canvasId]
  );

  // Create new canvas
  const handleNewCanvas = useCallback(async () => {
    setCanvasesLoading(true);
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('sessionId', data.sessionId);
        localStorage.setItem('canvasId', data.canvasId);
        localStorage.setItem('threadId', data.threadId);
        setSessionId(data.sessionId);
        setCanvasId(data.canvasId);
        setThreadId(data.threadId);

        // Add to registry
        const newCanvas: CanvasInfo = {
          id: data.canvasId,
          name: 'Untitled Venture',
          lastAccessedAt: new Date().toISOString(),
        };
        const updated = addCanvas(newCanvas);
        setCanvases(updated);

        // Reset threads for new canvas
        setThreads([]);
      }
    } catch (err) {
      console.error('Failed to create canvas:', err);
    } finally {
      setCanvasesLoading(false);
    }
  }, []);

  // Rename canvas
  const handleRenameCanvas = useCallback(
    async (targetCanvasId: string, newName: string) => {
      try {
        const response = await fetch(`/api/canvas/${targetCanvasId}/name`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName }),
        });

        if (response.ok) {
          const updated = updateCanvas(targetCanvasId, { name: newName });
          setCanvases(updated);
        }
      } catch (err) {
        console.error('Failed to rename canvas:', err);
      }
    },
    []
  );

  // Archive canvas
  const handleArchiveCanvas = useCallback(
    async (targetCanvasId: string) => {
      if (canvases.length <= 1) return; // Don't allow archiving last canvas

      try {
        const response = await fetch(`/api/canvas/${targetCanvasId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          const updated = removeCanvas(targetCanvasId);
          setCanvases(updated);

          // If we archived the current canvas, switch to another
          if (targetCanvasId === canvasId && updated.length > 0) {
            handleCanvasSelect(updated[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to archive canvas:', err);
      }
    },
    [canvasId, canvases.length, handleCanvasSelect]
  );

  // Show loading or error until session is ready
  if (!sessionReady || !sessionId || !canvasId || !threadId) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>SLC AI Advisor</h1>
        </header>
        <main className="app-main" style={{ justifyContent: 'center', alignItems: 'center' }}>
          {sessionError ? (
            <div style={{ color: 'var(--color-error, #e53e3e)', textAlign: 'center' }}>
              <p>{sessionError}</p>
              <button onClick={() => window.location.reload()} style={{ marginTop: '1rem' }}>
                Retry
              </button>
            </div>
          ) : (
            <div>Initializing session...</div>
          )}
        </main>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <CanvasProvider>
        <div className="app">
          <header className="app-header">
            <h1>SLC AI Advisor</h1>
            <div className="app-header-actions">
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? 'Dark' : 'Light'}
              </button>
            </div>
          </header>

          <main className="app-main">
            <div className="layout-sidebar">
              <CanvasList
                canvases={canvases}
                currentCanvasId={canvasId}
                onCanvasSelect={handleCanvasSelect}
                onNewCanvas={handleNewCanvas}
                onRenameCanvas={handleRenameCanvas}
                onArchiveCanvas={handleArchiveCanvas}
                isLoading={canvasesLoading}
              />
              <div className="sidebar-divider" />
              <ThreadList
                threads={threads}
                currentThreadId={threadId}
                onThreadSelect={handleThreadSelect}
                onNewThread={handleNewThread}
                onRenameThread={handleRenameThread}
                onArchiveThread={handleArchiveThread}
                isLoading={threadsLoading}
              />
            </div>
            <div className="layout-canvas">
              <Canvas canvasId={canvasId} />
            </div>
            <div className="layout-chat">
              <ErrorBoundary>
                <Chat canvasId={canvasId} threadId={threadId} />
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </CanvasProvider>
    </ErrorBoundary>
  );
}

export default App;
