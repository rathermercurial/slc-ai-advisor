/**
 * CanvasContext - Shared canvas state from agent sync
 *
 * The SLCAgent broadcasts canvas state via WebSocket using the Agents SDK
 * state sync mechanism. This context bridges that state to components that
 * need real-time canvas updates (like the Canvas component).
 *
 * Flow:
 * 1. Chat connects to SLCAgent via useAgent
 * 2. Agent broadcasts canvas state on changes (tool execution)
 * 3. Chat receives via onStateUpdate, updates this context
 * 4. Canvas consumes from context, merges with local edits
 */

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import type { CanvasState, CanvasSectionId, ImpactModel, CanvasSection } from '../types/canvas';
import { useCanvasHistory, type CanvasSnapshot } from '../hooks';

/**
 * Agent state structure (must match SLCAgent's AgentState)
 */
export interface AgentState {
  status: 'idle' | 'thinking' | 'searching' | 'updating' | 'error';
  statusMessage: string;
  canvas: CanvasState | null;
  canvasUpdatedAt: string | null;
}

/**
 * Result from save operations
 */
export interface SaveResult {
  success: boolean;
  errors?: string[];
}

/**
 * Context value shape
 */
interface CanvasContextValue {
  /** Canvas state from agent sync */
  canvas: CanvasState | null;
  /** Last update timestamp for change detection */
  canvasUpdatedAt: string | null;
  /** Agent status for UI feedback */
  agentStatus: AgentState['status'];
  /** Agent status message */
  agentStatusMessage: string;
  /** Whether agent is connected */
  isConnected: boolean;
  /** Whether AI is currently generating a response */
  isGenerating: boolean;
  /** Set generating state (from Chat component) */
  setGenerating: (generating: boolean) => void;
  /** Set of sections currently being edited locally */
  editingSections: Set<CanvasSectionId>;
  /** Mark a section as being edited (prevents overwrite from sync) */
  setEditing: (section: CanvasSectionId, editing: boolean) => void;
  /** Update from agent state sync */
  updateFromAgent: (state: AgentState) => void;
  /** Set connection status */
  setConnected: (connected: boolean) => void;
  /** Save section - returns success/failure with optional error messages */
  saveSection: (section: CanvasSectionId, content: string, canvasId: string) => Promise<SaveResult>;
  /** Save impact model - returns success/failure with optional error messages */
  saveImpactModel: (impactModel: ImpactModel, canvasId: string) => Promise<SaveResult>;
  /** Undo last change - returns true if successful */
  undo: () => boolean;
  /** Redo undone change - returns true if successful */
  redo: () => boolean;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

/**
 * Hook to consume canvas context
 */
export function useCanvasContext(): CanvasContextValue {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvasContext must be used within CanvasProvider');
  }
  return context;
}

/**
 * Provider props
 */
interface CanvasProviderProps {
  children: ReactNode;
  canvasId: string;
}

/**
 * Convert canvas state to snapshot for history
 */
function canvasToSnapshot(canvas: CanvasState, source: 'user' | 'ai'): CanvasSnapshot {
  const sections: Record<CanvasSectionId, string> = {} as Record<CanvasSectionId, string>;
  for (const section of canvas.sections) {
    sections[section.sectionKey] = section.content;
  }
  // Impact section content comes from impactModel.impact
  sections.impact = canvas.impactModel.impact;

  return {
    sections,
    impactModel: canvas.impactModel,
    timestamp: Date.now(),
    source,
  };
}

/**
 * Apply snapshot to canvas state
 */
function applySnapshotToCanvas(canvas: CanvasState, snapshot: CanvasSnapshot): CanvasState {
  const now = new Date().toISOString();

  const sections: CanvasSection[] = canvas.sections.map((section) => ({
    ...section,
    content: snapshot.sections[section.sectionKey] ?? section.content,
    updatedAt: now,
  }));

  return {
    ...canvas,
    sections,
    impactModel: {
      ...snapshot.impactModel,
      updatedAt: now,
    },
    updatedAt: now,
  };
}

/**
 * Provider component
 */
export function CanvasProvider({ children, canvasId }: CanvasProviderProps) {
  const [canvas, setCanvas] = useState<CanvasState | null>(null);
  const [canvasUpdatedAt, setCanvasUpdatedAt] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentState['status']>('idle');
  const [agentStatusMessage, setAgentStatusMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingSections, setEditingSections] = useState<Set<CanvasSectionId>>(new Set());

  // History management
  const history = useCanvasHistory(canvasId);
  const historyInitializedRef = useRef(false);
  const isRestoringRef = useRef(false);

  // Ref for canvasUpdatedAt to avoid stale closure in updateFromAgent
  const canvasUpdatedAtRef = useRef(canvasUpdatedAt);
  canvasUpdatedAtRef.current = canvasUpdatedAt;

  // Ref for history to avoid stale closure
  const historyRef = useRef(history);
  historyRef.current = history;

  // Mark section as editing/not editing
  const setEditing = useCallback((section: CanvasSectionId, editing: boolean) => {
    setEditingSections(prev => {
      const next = new Set(prev);
      if (editing) {
        next.add(section);
      } else {
        next.delete(section);
      }
      return next;
    });
  }, []);

  // Update from agent state sync
  const updateFromAgent = useCallback((state: AgentState) => {
    setAgentStatus(state.status);
    setAgentStatusMessage(state.statusMessage);

    // Only update canvas if timestamp changed (actual update)
    // Use refs to avoid stale closure issues with rapid updates
    if (state.canvas && state.canvasUpdatedAt !== canvasUpdatedAtRef.current) {
      setCanvas(state.canvas);
      setCanvasUpdatedAt(state.canvasUpdatedAt);

      // Initialize or push to history (skip if we're restoring from undo/redo)
      if (!isRestoringRef.current) {
        if (!historyInitializedRef.current) {
          historyRef.current.initialize(canvasToSnapshot(state.canvas, 'ai'));
          historyInitializedRef.current = true;
        } else {
          historyRef.current.pushSnapshot(canvasToSnapshot(state.canvas, 'ai'));
        }
      }
    }
  }, []); // No dependencies - uses refs for all external values

  // Set connection status
  const setConnected = useCallback((connected: boolean) => {
    setIsConnected(connected);
  }, []);

  // Set generating status (called by Chat component)
  const setGenerating = useCallback((generating: boolean) => {
    setIsGenerating(generating);
  }, []);

  // Save section locally and to server
  const saveSection = useCallback(async (
    section: CanvasSectionId,
    content: string,
    _canvasId: string
  ): Promise<SaveResult> => {
    // Persist to backend first (no more optimistic updates for accurate feedback)
    try {
      const response = await fetch(`/api/canvas/${_canvasId}/section/${section}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const result = await response.json() as { success: boolean; errors?: string[] };

      if (result.success) {
        // Update local state only on successful save
        setCanvas(prev => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            sections: prev.sections.map(s =>
              s.sectionKey === section
                ? { ...s, content, updatedAt: new Date().toISOString() }
                : s
            ),
            updatedAt: new Date().toISOString(),
          };

          // Push to history
          if (!isRestoringRef.current) {
            if (!historyInitializedRef.current) {
              history.initialize(canvasToSnapshot(updated, 'user'));
              historyInitializedRef.current = true;
            } else {
              history.pushSnapshot(canvasToSnapshot(updated, 'user'));
            }
          }

          return updated;
        });
        return { success: true };
      }

      // Return validation errors
      return { success: false, errors: result.errors };
    } catch (err) {
      console.error('Failed to save section:', err);
      return { success: false, errors: ['Network error saving section'] };
    }
  }, [history]);

  // Save impact model
  const saveImpactModel = useCallback(async (
    impactModel: ImpactModel,
    _canvasId: string
  ): Promise<SaveResult> => {
    // Persist to backend first
    try {
      const response = await fetch(`/api/canvas/${_canvasId}/impact`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(impactModel),
      });

      const result = await response.json() as { success: boolean; errors?: string[] };

      if (result.success) {
        // Update local state only on successful save
        setCanvas(prev => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            impactModel,
            updatedAt: new Date().toISOString(),
          };

          // Push to history
          if (!isRestoringRef.current) {
            if (!historyInitializedRef.current) {
              history.initialize(canvasToSnapshot(updated, 'user'));
              historyInitializedRef.current = true;
            } else {
              history.pushSnapshot(canvasToSnapshot(updated, 'user'));
            }
          }

          return updated;
        });
        return { success: true };
      }

      return { success: false, errors: result.errors };
    } catch (err) {
      console.error('Failed to save impact model:', err);
      return { success: false, errors: ['Network error saving impact model'] };
    }
  }, [history]);

  // Undo last change
  const handleUndo = useCallback((): boolean => {
    if (!canvas || !history.canUndo) return false;

    const snapshot = history.undo();
    if (!snapshot) return false;

    // Mark as restoring to prevent pushing this change to history
    isRestoringRef.current = true;

    // Apply snapshot to canvas state
    const restoredCanvas = applySnapshotToCanvas(canvas, snapshot);
    setCanvas(restoredCanvas);
    setCanvasUpdatedAt(new Date().toISOString());

    // TODO: Persist restored state to backend
    // For now, the backend will be synced on next user save

    // Reset restoring flag after state update
    setTimeout(() => {
      isRestoringRef.current = false;
    }, 0);

    return true;
  }, [canvas, history]);

  // Redo undone change
  const handleRedo = useCallback((): boolean => {
    if (!canvas || !history.canRedo) return false;

    const snapshot = history.redo();
    if (!snapshot) return false;

    // Mark as restoring to prevent pushing this change to history
    isRestoringRef.current = true;

    // Apply snapshot to canvas state
    const restoredCanvas = applySnapshotToCanvas(canvas, snapshot);
    setCanvas(restoredCanvas);
    setCanvasUpdatedAt(new Date().toISOString());

    // Reset restoring flag after state update
    setTimeout(() => {
      isRestoringRef.current = false;
    }, 0);

    return true;
  }, [canvas, history]);

  const value: CanvasContextValue = {
    canvas,
    canvasUpdatedAt,
    agentStatus,
    agentStatusMessage,
    isConnected,
    isGenerating,
    setGenerating,
    editingSections,
    setEditing,
    updateFromAgent,
    setConnected,
    saveSection,
    saveImpactModel,
    undo: handleUndo,
    redo: handleRedo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
}
