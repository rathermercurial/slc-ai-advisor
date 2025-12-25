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

  const [canvasId, setCanvasId] = useState<string | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);

  // Initialize or restore canvas
  useEffect(() => {
    async function initCanvas() {
      // Check localStorage for existing canvasId
      const saved = localStorage.getItem('canvasId');

      if (saved) {
        // Verify canvas exists on server
        try {
          const response = await fetch(`/api/canvas/${saved}`);
          if (response.ok) {
            setCanvasId(saved);
            setCanvasReady(true);
            return;
          }
        } catch (err) {
          console.warn('Canvas check failed, creating new canvas');
        }
      }

      // Create new canvas
      try {
        const response = await fetch('/api/canvas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('canvasId', data.canvasId);
          setCanvasId(data.canvasId);
          setCanvasReady(true);
        } else {
          console.error('Failed to create canvas');
        }
      } catch (err) {
        console.error('Canvas creation error:', err);
      }
    }

    initCanvas();
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Show loading until canvas is ready
  if (!canvasReady || !canvasId) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>SLC AI Advisor</h1>
        </header>
        <main className="app-main" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div>Initializing canvas...</div>
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
