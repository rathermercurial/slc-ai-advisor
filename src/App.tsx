import { useState, useEffect } from 'react';
import { Canvas, Chat } from './components';

/**
 * SLC AI Advisor - Main Application
 *
 * Two-column layout: Canvas on left (60%), Chat on right (40%).
 * Dark mode toggle in header.
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

  const [sessionId] = useState(() => {
    // Get or create session ID
    const saved = localStorage.getItem('sessionId');
    if (saved) return saved;
    const newId = crypto.randomUUID();
    localStorage.setItem('sessionId', newId);
    return newId;
  });

  const [_sessionReady, setSessionReady] = useState(false);

  // Initialize session with backend
  useEffect(() => {
    const initSession = async () => {
      try {
        // Check if session exists on backend
        const response = await fetch(`/api/session/${sessionId}`);
        if (response.status === 404) {
          // Register new session
          await fetch('/api/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, program: 'generic' }),
          });
        }
        setSessionReady(true);
      } catch (error) {
        console.error('Failed to initialize session:', error);
        // Still allow usage with mock fallback
        setSessionReady(true);
      }
    };
    initSession();
  }, [sessionId]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
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
          <Chat
            sessionId={sessionId}
            apiEndpoint={import.meta.env.VITE_CHAT_API_ENDPOINT}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
