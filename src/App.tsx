import { useState, useEffect, Component, ReactNode } from 'react';
import { Canvas, Chat } from './components';

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
 * Two-column layout: Canvas on left (60%), Chat on right (40%).
 * Dark mode toggle in header.
 *
 * Canvas-first flow: A canvas is created before chat begins.
 * The canvasId is used as the agent session identifier.
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
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Initialize or restore session
  useEffect(() => {
    async function initSession() {
      const savedSession = localStorage.getItem('sessionId');
      const savedCanvas = localStorage.getItem('canvasId');

      // Validate stored IDs match (they should be the same)
      if (savedSession && savedCanvas && savedSession === savedCanvas) {
        // Check if session exists on server
        try {
          const response = await fetch(`/api/session/${savedSession}`);
          if (response.ok) {
            setSessionId(savedSession);
            setCanvasId(savedCanvas);
            setSessionReady(true);
            return;
          }
        } catch (err) {
          console.warn('Session check failed, creating new session');
        }
      }

      // Clear any stale/mismatched session data
      localStorage.removeItem('sessionId');
      localStorage.removeItem('canvasId');

      // Create new session
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
          setSessionId(data.sessionId);
          setCanvasId(data.canvasId);
          setSessionReady(true);
        } else {
          setSessionError('Failed to create session. Please refresh the page.');
        }
      } catch (err) {
        console.error('Session creation error:', err);
        setSessionError('Network error. Please check your connection and refresh.');
      }
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

  // Show loading or error until session is ready
  if (!sessionReady || !sessionId || !canvasId) {
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
          <div className="layout-canvas">
            <Canvas canvasId={canvasId} />
          </div>
          <div className="layout-chat">
            <ErrorBoundary>
              <Chat canvasId={canvasId} />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
