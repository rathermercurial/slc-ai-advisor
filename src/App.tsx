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
 * Chat uses Cloudflare Agents SDK for real-time WebSocket communication.
 * Session management is handled automatically by the ChatAgent.
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
  const [sessionReady, setSessionReady] = useState(false);

  // Initialize or restore session
  useEffect(() => {
    async function initSession() {
      const saved = localStorage.getItem('sessionId');

      if (saved) {
        // Check if session exists on server
        try {
          const response = await fetch(`/api/session/${saved}`);
          if (response.ok) {
            setSessionId(saved);
            setSessionReady(true);
            return;
          }
        } catch (err) {
          console.warn('Session check failed, creating new session');
        }
      }

      // Create new session
      try {
        const response = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ program: 'generic' }),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('sessionId', data.sessionId);
          setSessionId(data.sessionId);
          setSessionReady(true);
        } else {
          console.error('Failed to create session');
        }
      } catch (err) {
        console.error('Session creation error:', err);
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

  // Show loading until session is ready
  if (!sessionReady || !sessionId) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>SLC AI Advisor</h1>
        </header>
        <main className="app-main" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div>Initializing session...</div>
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
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </header>

        <main className="app-main">
          <div className="layout-canvas">
            <Canvas sessionId={sessionId} />
          </div>
          <div className="layout-chat">
            <ErrorBoundary>
              <Chat sessionId={sessionId} />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
