import { useState, useEffect, useCallback, Component, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Undo2, Redo2 } from 'lucide-react';
import { Canvas, Chat, ConnectionStatus, ExportMenu, Resizer, Sidebar, ThemeToggle, Toast, VentureHeader } from './components';
import type { Theme } from './components/ThemeToggle';
import type { ToastType } from './components/Toast';
import { CanvasProvider, useCanvasContext } from './context';
import { useUndoShortcuts } from './hooks';
import {
  canvasToPlainText,
  canvasToJSON,
  canvasToMarkdown,
  chatToPlainText,
  chatToMarkdown,
  copyToClipboard,
  downloadFile,
  getExportFilename,
  getChatExportFilename,
  type ExportCanvasData,
  type ExportChatMessage,
} from './utils/export';
import type { ChatMessageForExport } from './components/Chat';
import type { CanvasSectionId } from './types/canvas';
import type { CanvasMeta } from './types/thread';
import type { VentureStage } from './types/venture';

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
 * Toast state interface
 */
interface ToastState {
  message: string;
  type: ToastType;
}

/**
 * Inner app component with access to CanvasContext
 * Handles export functionality and toast notifications
 */
function AppContent({
  canvasId,
  threadId,
  theme,
  toggleTheme,
}: {
  canvasId: string;
  threadId?: string;
  theme: Theme;
  toggleTheme: () => void;
}) {
  const { canvas, undo, redo, canUndo, canRedo, isConnected } = useCanvasContext();
  const [toast, setToast] = useState<ToastState | null>(null);

  // Canvas/chat split percentage (stored in localStorage)
  const [splitPercentage, setSplitPercentage] = useState(() => {
    const saved = localStorage.getItem('canvasSplitPercentage');
    return saved ? parseFloat(saved) : 60;
  });

  // Venture name from canvas index
  const [ventureName, setVentureName] = useState(() => {
    try {
      const stored = localStorage.getItem('canvasIndex');
      if (stored) {
        const canvases = JSON.parse(stored) as CanvasMeta[];
        const current = canvases.find((c) => c.id === canvasId);
        return current?.name || 'Untitled Venture';
      }
    } catch (e) {
      console.warn('Failed to read canvas name:', e);
    }
    return 'Untitled Venture';
  });

  // Listen for name changes from sidebar
  useEffect(() => {
    const handleCanvasIndexUpdate = () => {
      try {
        const stored = localStorage.getItem('canvasIndex');
        if (stored) {
          const canvases = JSON.parse(stored) as CanvasMeta[];
          const current = canvases.find((c) => c.id === canvasId);
          if (current && current.name !== ventureName) {
            setVentureName(current.name);
          }
        }
      } catch (e) {
        console.warn('Failed to sync canvas name:', e);
      }
    };
    window.addEventListener('canvasIndexUpdated', handleCanvasIndexUpdate);
    return () => window.removeEventListener('canvasIndexUpdated', handleCanvasIndexUpdate);
  }, [canvasId, ventureName]);

  // Venture stage (stored per canvas in localStorage)
  const [ventureStage, setVentureStage] = useState<VentureStage>(() => {
    try {
      const stored = localStorage.getItem(`ventureStage-${canvasId}`);
      if (stored && ['idea', 'validation', 'growth', 'scale'].includes(stored)) {
        return stored as VentureStage;
      }
    } catch (e) {
      console.warn('Failed to read venture stage:', e);
    }
    return 'idea';
  });

  // Chat panel collapsed state
  const [chatCollapsed, setChatCollapsed] = useState(() => {
    const saved = localStorage.getItem('chatCollapsed');
    return saved === 'true';
  });

  // Profile panel visibility
  const [showProfile, setShowProfile] = useState(false);

  // Model indicator (lifted from Canvas for header display)
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);

  // Sidebar width in pixels (stored in localStorage)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebarWidth');
    return saved ? parseInt(saved, 10) : 220;
  });

  // Chat messages for export (updated by Chat component)
  const [chatMessages, setChatMessages] = useState<ChatMessageForExport[]>([]);

  // Persist split percentage
  const handleResize = useCallback((percentage: number) => {
    setSplitPercentage(percentage);
    localStorage.setItem('canvasSplitPercentage', String(percentage));
  }, []);

  // Handle sidebar resize (direct pixel values)
  const handleSidebarResize = useCallback((pixels: number) => {
    setSidebarWidth(pixels);
    localStorage.setItem('sidebarWidth', String(pixels));
  }, []);

  // Handle venture name change
  const handleNameChange = useCallback((name: string) => {
    setVentureName(name);
    try {
      const stored = localStorage.getItem('canvasIndex');
      if (stored) {
        const canvases = JSON.parse(stored) as CanvasMeta[];
        const updated = canvases.map((c) =>
          c.id === canvasId ? { ...c, name, updatedAt: new Date().toISOString() } : c
        );
        localStorage.setItem('canvasIndex', JSON.stringify(updated));
        // Dispatch event for same-tab sync (CanvasList listens for this)
        window.dispatchEvent(new Event('canvasIndexUpdated'));
      }
    } catch (e) {
      console.warn('Failed to save canvas name:', e);
    }
  }, [canvasId]);

  // Handle venture stage change
  const handleStageChange = useCallback((stage: VentureStage) => {
    setVentureStage(stage);
    localStorage.setItem(`ventureStage-${canvasId}`, stage);
  }, [canvasId]);

  // Toggle chat panel
  const handleChatToggle = useCallback(() => {
    setChatCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('chatCollapsed', String(next));
      return next;
    });
  }, []);

  // Toggle profile panel
  const handleProfileClick = useCallback(() => {
    setShowProfile((prev) => !prev);
  }, []);

  // Calculate progress from filled canvas sections
  const calculateProgress = useCallback((): number => {
    if (!canvas) return 0;
    const sectionKeys: CanvasSectionId[] = [
      'purpose', 'customers', 'jobsToBeDone', 'valueProposition', 'solution',
      'channels', 'revenue', 'costs', 'keyMetrics', 'advantage'
    ];
    let filled = 0;
    for (const section of canvas.sections) {
      if (sectionKeys.includes(section.sectionKey as CanvasSectionId) && section.content.trim()) {
        filled++;
      }
    }
    // Add impact model fields
    const impactFields = ['issue', 'participants', 'activities', 'outputs',
      'shortTermOutcomes', 'mediumTermOutcomes', 'longTermOutcomes', 'impact'] as const;
    let impactFilled = 0;
    for (const field of impactFields) {
      if (canvas.impactModel[field]?.trim()) {
        impactFilled++;
      }
    }
    // Total: 10 sections + 8 impact fields = 18 total
    const total = sectionKeys.length + impactFields.length;
    return Math.round(((filled + impactFilled) / total) * 100);
  }, [canvas]);

  const progress = calculateProgress();

  // Register keyboard shortcuts for undo/redo
  useUndoShortcuts({
    onUndo: undo,
    onRedo: redo,
  });

  // Build export data from current canvas state
  const getExportData = useCallback((): ExportCanvasData | null => {
    if (!canvas) return null;

    const sections: Record<CanvasSectionId, string> = {} as Record<CanvasSectionId, string>;
    for (const section of canvas.sections) {
      sections[section.sectionKey as CanvasSectionId] = section.content || '';
    }
    // Impact section comes from impactModel
    sections.impact = canvas.impactModel.impact || '';

    // Try to extract venture name from purpose section
    const ventureName = sections.purpose
      ? sections.purpose.split('\n')[0].slice(0, 50)
      : undefined;

    return {
      ventureName,
      sections,
      impactModel: canvas.impactModel,
    };
  }, [canvas]);

  // Copy canvas to clipboard
  const handleCopyToClipboard = useCallback(async () => {
    const data = getExportData();
    if (!data) {
      setToast({ message: 'No canvas data to export', type: 'error' });
      return;
    }

    const text = canvasToPlainText(data);
    const success = await copyToClipboard(text);

    if (success) {
      setToast({ message: 'Copied to clipboard', type: 'success' });
    } else {
      setToast({ message: 'Failed to copy to clipboard', type: 'error' });
    }
  }, [getExportData]);

  // Download as JSON
  const handleExportJSON = useCallback(() => {
    const data = getExportData();
    if (!data) {
      setToast({ message: 'No canvas data to export', type: 'error' });
      return;
    }

    const json = canvasToJSON(data);
    const filename = getExportFilename(data.ventureName, 'json');
    downloadFile(json, filename, 'application/json');
    setToast({ message: `Downloaded ${filename}`, type: 'success' });
  }, [getExportData]);

  // Download as Markdown
  const handleExportMarkdown = useCallback(() => {
    const data = getExportData();
    if (!data) {
      setToast({ message: 'No canvas data to export', type: 'error' });
      return;
    }

    const markdown = canvasToMarkdown(data);
    const filename = getExportFilename(data.ventureName, 'md');
    downloadFile(markdown, filename, 'text/markdown');
    setToast({ message: `Downloaded ${filename}`, type: 'success' });
  }, [getExportData]);

  // Copy chat to clipboard
  const handleCopyChat = useCallback(async () => {
    if (chatMessages.length === 0) {
      setToast({ message: 'No chat messages to copy', type: 'error' });
      return;
    }

    const text = chatToPlainText(chatMessages as ExportChatMessage[], ventureName);
    const success = await copyToClipboard(text);

    if (success) {
      setToast({ message: 'Chat copied to clipboard', type: 'success' });
    } else {
      setToast({ message: 'Failed to copy chat to clipboard', type: 'error' });
    }
  }, [chatMessages, ventureName]);

  // Download chat as Markdown
  const handleSaveChat = useCallback(() => {
    if (chatMessages.length === 0) {
      setToast({ message: 'No chat messages to save', type: 'error' });
      return;
    }

    const markdown = chatToMarkdown(chatMessages as ExportChatMessage[], ventureName);
    const filename = getChatExportFilename(ventureName, 'md');
    downloadFile(markdown, filename, 'text/markdown');
    setToast({ message: `Downloaded ${filename}`, type: 'success' });
  }, [chatMessages, ventureName]);

  return (
    <div className="app" style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}>
      <header className="app-header">
        <div className="app-header-left">
          <h1>SLC AI Advisor</h1>
        </div>
        <div className="app-header-center">
          {/* VentureHeader moved to layout-canvas for proper centering with canvas */}
        </div>
        <div className="app-header-right">
          <button
            className="header-icon-btn"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Cmd+Z)"
            aria-label="Undo"
          >
            <Undo2 size={18} />
          </button>
          <button
            className="header-icon-btn"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Cmd+Shift+Z)"
            aria-label="Redo"
          >
            <Redo2 size={18} />
          </button>
          <ExportMenu
            onCopy={handleCopyToClipboard}
            onExportJSON={handleExportJSON}
            onExportMarkdown={handleExportMarkdown}
            onCopyChat={handleCopyChat}
            onSaveChat={handleSaveChat}
            disabled={!canvas}
            chatDisabled={chatMessages.length === 0}
          />
          <ConnectionStatus readyState={isConnected ? 1 : 0} />
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      <main className="app-main">
        <div className="sidebar-wrapper" style={{ width: sidebarWidth }}>
          <Sidebar />
          <Resizer
            direction="horizontal"
            onResize={handleSidebarResize}
            pixelMode
            minPixels={180}
            maxPixels={400}
          />
        </div>
        <div className="layout-content">
          <div className="layout-canvas" style={{ flex: chatCollapsed ? 1 : `0 0 ${splitPercentage}%` }}>
            <VentureHeader
              name={ventureName}
              progress={progress}
              onNameChange={handleNameChange}
              showProfile={showProfile}
              onProfileClick={handleProfileClick}
              modelIndicator={hoveredModel}
            />
            {showProfile && (
              <div className="profile-inline">
                <div className="profile-inline-header">
                  <span className="profile-inline-title">Venture Profile</span>
                  <button className="profile-inline-close" onClick={() => setShowProfile(false)} aria-label="Close">×</button>
                </div>
                <div className="profile-inline-content">
                  <div className="profile-dimensions">
                    <div className="profile-dimension">
                      <span className="profile-dimension-label">Stage</span>
                      <select
                        className="profile-stage-select"
                        value={ventureStage}
                        onChange={(e) => handleStageChange(e.target.value as VentureStage)}
                      >
                        <option value="idea">Idea</option>
                        <option value="validation">Validation</option>
                        <option value="growth">Growth</option>
                        <option value="scale">Scale</option>
                      </select>
                    </div>
                    <div className="profile-dimension">
                      <span className="profile-dimension-label">Progress</span>
                      <span className="profile-dimension-value">{progress}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <Canvas
              canvasId={canvasId}
              hoveredModel={hoveredModel}
              onHoveredModelChange={setHoveredModel}
            />
          </div>
          {!chatCollapsed && (
            <Resizer
              direction="horizontal"
              onResize={handleResize}
              minPercentage={30}
              maxPercentage={70}
            />
          )}
          <div className={`layout-chat ${chatCollapsed ? 'collapsed' : ''}`} style={{ flex: chatCollapsed ? 'none' : `0 0 ${100 - splitPercentage}%` }}>
            <button className="chat-collapse-toggle" onClick={handleChatToggle} title={chatCollapsed ? 'Expand chat' : 'Collapse chat'} aria-label={chatCollapsed ? 'Expand chat' : 'Collapse chat'}>
              {chatCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
            {!chatCollapsed && (
              <ErrorBoundary>
                <Chat canvasId={canvasId} threadId={threadId} onMessagesChange={setChatMessages} />
              </ErrorBoundary>
            )}
          </div>
        </div>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

/**
 * Canvas route component - handles canvas and thread routing
 */
function CanvasRoute({ theme, toggleTheme }: { theme: Theme; toggleTheme: () => void }) {
  const { canvasId, threadId } = useParams<{ canvasId: string; threadId?: string }>();
  const navigate = useNavigate();
  const [defaultThreadId, setDefaultThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch or create default thread if no threadId in URL
  useEffect(() => {
    async function loadDefaultThread() {
      if (!canvasId) return;

      // If we already have a threadId, use it
      if (threadId) {
        setDefaultThreadId(threadId);
        setIsLoading(false);
        return;
      }

      try {
        // Get default thread for this canvas
        const response = await fetch(`/api/canvas/${canvasId}/threads/default`);
        if (response.ok) {
          const data = await response.json();
          setDefaultThreadId(data.threadId);
          // Navigate to the thread URL
          navigate(`/canvas/${canvasId}/chat/${data.threadId}`, { replace: true });
        }
      } catch (err) {
        console.error('Failed to load default thread:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDefaultThread();
  }, [canvasId, threadId, navigate]);

  if (!canvasId) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>SLC AI Advisor</h1>
        </header>
        <main className="app-main" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div>Loading canvas...</div>
        </main>
      </div>
    );
  }

  const activeThreadId = threadId || defaultThreadId;

  return (
    <ErrorBoundary>
      <CanvasProvider canvasId={canvasId}>
        <AppContent
          canvasId={canvasId}
          threadId={activeThreadId || undefined}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      </CanvasProvider>
    </ErrorBoundary>
  );
}

/**
 * Home route - redirects to existing canvas or creates new one
 */
function HomeRoute() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initCanvas() {
      // DEV MODE: Skip backend for frontend-only testing
      if (import.meta.env.VITE_FRONTEND_ONLY === 'true') {
        navigate('/canvas/dev-canvas', { replace: true });
        return;
      }

      // Check for existing canvas in localStorage index
      try {
        const stored = localStorage.getItem('canvasIndex');
        if (stored) {
          const canvases = JSON.parse(stored) as CanvasMeta[];
          const activeCanvases = canvases.filter((c) => !c.archived);
          if (activeCanvases.length > 0) {
            // Navigate to most recent active canvas
            navigate(`/canvas/${activeCanvases[0].id}`, { replace: true });
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to read canvas index:', err);
      }

      // No existing canvas, create a new one
      try {
        const response = await fetch('/api/canvas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (response.ok) {
          const data = await response.json();

          // Add to canvas index
          const newCanvas: CanvasMeta = {
            id: data.canvasId,
            name: 'Untitled Canvas',
            starred: false,
            archived: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          try {
            const stored = localStorage.getItem('canvasIndex');
            const canvases = stored ? JSON.parse(stored) : [];
            canvases.unshift(newCanvas);
            localStorage.setItem('canvasIndex', JSON.stringify(canvases));
          } catch (e) {
            console.warn('Failed to update canvas index:', e);
          }

          navigate(`/canvas/${data.canvasId}`, { replace: true });
        } else {
          setError('Failed to create canvas. Please refresh the page.');
        }
      } catch (err) {
        console.error('Canvas creation error:', err);
        setError('Network error. Please check your connection and refresh.');
      } finally {
        setIsLoading(false);
      }
    }

    initCanvas();
  }, [navigate]);

  if (error) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>SLC AI Advisor</h1>
        </header>
        <main className="app-main" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ color: 'var(--color-error, #e53e3e)', textAlign: 'center' }}>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} style={{ marginTop: '1rem' }}>
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>SLC AI Advisor</h1>
        </header>
        <main className="app-main" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div>Initializing...</div>
        </main>
      </div>
    );
  }

  return null;
}

/**
 * SLC AI Advisor - Main Application
 *
 * Three-column layout: Sidebar (collapsible), Canvas (60%), Chat (40%).
 * Dark mode toggle in header.
 *
 * URL Routing:
 * - / - Home (redirects to canvas)
 * - /canvas/:canvasId - Canvas view
 * - /canvas/:canvasId/chat/:threadId - Canvas with specific chat thread
 */
const THEME_CYCLE: Theme[] = ['light', 'dark', 'midnight', 'daybreak'];

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage or system preference
    const saved = localStorage.getItem('theme');
    if (saved && THEME_CYCLE.includes(saved as Theme)) return saved as Theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const currentIndex = THEME_CYCLE.indexOf(prev);
      const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
      return THEME_CYCLE[nextIndex];
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route
          path="/canvas/:canvasId"
          element={<CanvasRoute theme={theme} toggleTheme={toggleTheme} />}
        />
        <Route
          path="/canvas/:canvasId/chat/:threadId"
          element={<CanvasRoute theme={theme} toggleTheme={toggleTheme} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
