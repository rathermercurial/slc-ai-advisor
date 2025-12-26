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

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { CanvasState, CanvasSectionId, ImpactModel } from '../types/canvas';

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
 * Provider component
 */
export function CanvasProvider({ children }: { children: ReactNode }) {
  const [canvas, setCanvas] = useState<CanvasState | null>(null);
  const [canvasUpdatedAt, setCanvasUpdatedAt] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentState['status']>('idle');
  const [agentStatusMessage, setAgentStatusMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [editingSections, setEditingSections] = useState<Set<CanvasSectionId>>(new Set());

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
    if (state.canvas && state.canvasUpdatedAt !== canvasUpdatedAt) {
      setCanvas(state.canvas);
      setCanvasUpdatedAt(state.canvasUpdatedAt);
    }
  }, [canvasUpdatedAt]);

  // Set connection status
  const setConnected = useCallback((connected: boolean) => {
    setIsConnected(connected);
  }, []);

  // Save section locally and to server
  const saveSection = useCallback(async (
    section: CanvasSectionId,
    content: string,
    canvasId: string
  ): Promise<SaveResult> => {
    // Persist to backend first (no more optimistic updates for accurate feedback)
    try {
      const response = await fetch(`/api/canvas/${canvasId}/section/${section}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const result = await response.json() as { success: boolean; errors?: string[] };

      if (result.success) {
        // Update local state only on successful save
        setCanvas(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            sections: prev.sections.map(s =>
              s.sectionKey === section
                ? { ...s, content, updatedAt: new Date().toISOString() }
                : s
            ),
            updatedAt: new Date().toISOString(),
          };
        });
        return { success: true };
      }

      // Return validation errors
      return { success: false, errors: result.errors };
    } catch (err) {
      console.error('Failed to save section:', err);
      return { success: false, errors: ['Network error saving section'] };
    }
  }, []);

  // Save impact model
  const saveImpactModel = useCallback(async (
    impactModel: ImpactModel,
    canvasId: string
  ): Promise<SaveResult> => {
    // Persist to backend first
    try {
      const response = await fetch(`/api/canvas/${canvasId}/impact`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(impactModel),
      });

      const result = await response.json() as { success: boolean; errors?: string[] };

      if (result.success) {
        // Update local state only on successful save
        setCanvas(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            impactModel,
            updatedAt: new Date().toISOString(),
          };
        });
        return { success: true };
      }

      return { success: false, errors: result.errors };
    } catch (err) {
      console.error('Failed to save impact model:', err);
      return { success: false, errors: ['Network error saving impact model'] };
    }
  }, []);

  const value: CanvasContextValue = {
    canvas,
    canvasUpdatedAt,
    agentStatus,
    agentStatusMessage,
    isConnected,
    editingSections,
    setEditing,
    updateFromAgent,
    setConnected,
    saveSection,
    saveImpactModel,
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
}
