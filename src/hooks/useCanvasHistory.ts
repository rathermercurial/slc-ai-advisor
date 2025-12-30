/**
 * useCanvasHistory - Undo/Redo state management for canvas
 *
 * Features:
 * - State snapshots with diff compression for older entries
 * - localStorage persistence (survives refresh)
 * - ~500 history limit
 * - Last 20 entries as full snapshots, older as diffs
 * - AI changes treated same as user changes (unified stack)
 * - 30 second idle timeout for AI batch collapsing
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { CanvasSectionId, ImpactModel } from '../types/canvas';

/**
 * Full canvas snapshot for history
 */
export interface CanvasSnapshot {
  sections: Record<CanvasSectionId, string>;
  impactModel: ImpactModel;
  timestamp: number;
  source: 'user' | 'ai';
}

/**
 * Diff entry for older history items (space efficient)
 */
interface CanvasDiff {
  /** Changes from previous snapshot */
  sectionChanges: Partial<Record<CanvasSectionId, string>>;
  impactModelChanges: Partial<ImpactModel> | null;
  timestamp: number;
  source: 'user' | 'ai';
}

/**
 * History entry - either full snapshot or diff
 */
type HistoryEntry =
  | { type: 'snapshot'; data: CanvasSnapshot }
  | { type: 'diff'; data: CanvasDiff };

/**
 * Serializable history state for localStorage
 */
interface HistoryState {
  entries: HistoryEntry[];
  currentIndex: number;
}

const HISTORY_LIMIT = 500;
const FULL_SNAPSHOT_COUNT = 20;
const AI_BATCH_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Get localStorage key for a canvas
 */
function getStorageKey(canvasId: string): string {
  return `canvas-history-${canvasId}`;
}

/**
 * Load history from localStorage
 */
function loadHistory(canvasId: string): HistoryState | null {
  try {
    const stored = localStorage.getItem(getStorageKey(canvasId));
    if (!stored) return null;
    const parsed = JSON.parse(stored) as HistoryState;

    // Validate the loaded data
    if (!parsed || !Array.isArray(parsed.entries) || typeof parsed.currentIndex !== 'number') {
      console.warn('Invalid history data in localStorage, clearing...');
      localStorage.removeItem(getStorageKey(canvasId));
      return null;
    }

    // Validate entries have required fields
    const validEntries = parsed.entries.filter(
      (entry) => entry && typeof entry.type === 'string' && entry.data
    );

    if (validEntries.length !== parsed.entries.length) {
      console.warn('Some history entries were invalid, cleaning up...');
      parsed.entries = validEntries;
      parsed.currentIndex = Math.min(parsed.currentIndex, validEntries.length - 1);
    }

    return parsed;
  } catch {
    // Clear corrupted data
    localStorage.removeItem(getStorageKey(canvasId));
    return null;
  }
}

/**
 * Save history to localStorage
 */
function saveHistory(canvasId: string, state: HistoryState): void {
  try {
    localStorage.setItem(getStorageKey(canvasId), JSON.stringify(state));
  } catch (e) {
    // localStorage might be full - try to clear old entries
    console.warn('Failed to save history to localStorage:', e);
  }
}

/**
 * Calculate diff between two snapshots
 */
function calculateDiff(
  prev: CanvasSnapshot,
  next: CanvasSnapshot
): CanvasDiff {
  const sectionChanges: Partial<Record<CanvasSectionId, string>> = {};

  // Find changed sections
  for (const key of Object.keys(next.sections) as CanvasSectionId[]) {
    if (prev.sections[key] !== next.sections[key]) {
      sectionChanges[key] = next.sections[key];
    }
  }

  // Find impact model changes
  let impactModelChanges: Partial<ImpactModel> | null = null;
  const impactFields = [
    'issue',
    'participants',
    'activities',
    'outputs',
    'shortTermOutcomes',
    'mediumTermOutcomes',
    'longTermOutcomes',
    'impact',
    'isComplete',
  ] as const;

  for (const field of impactFields) {
    if (prev.impactModel[field] !== next.impactModel[field]) {
      if (!impactModelChanges) impactModelChanges = {};
      // @ts-expect-error - dynamic field assignment
      impactModelChanges[field] = next.impactModel[field];
    }
  }

  return {
    sectionChanges,
    impactModelChanges,
    timestamp: next.timestamp,
    source: next.source,
  };
}

/**
 * Apply diff to a snapshot to get a new snapshot
 */
function applyDiff(base: CanvasSnapshot, diff: CanvasDiff): CanvasSnapshot {
  const sections = { ...base.sections };
  for (const key of Object.keys(diff.sectionChanges) as CanvasSectionId[]) {
    sections[key] = diff.sectionChanges[key]!;
  }

  const impactModel = { ...base.impactModel };
  if (diff.impactModelChanges) {
    Object.assign(impactModel, diff.impactModelChanges);
  }

  return {
    sections,
    impactModel,
    timestamp: diff.timestamp,
    source: diff.source,
  };
}

/**
 * Rebuild full snapshot at a given index by applying diffs
 */
function rebuildSnapshot(entries: HistoryEntry[], targetIndex: number): CanvasSnapshot | null {
  // Safety check for empty or invalid entries
  if (!entries || entries.length === 0 || targetIndex < 0 || targetIndex >= entries.length) {
    return null;
  }

  // Find the nearest full snapshot at or before targetIndex
  let baseIndex = targetIndex;
  while (baseIndex >= 0 && entries[baseIndex]?.type !== 'snapshot') {
    baseIndex--;
  }

  if (baseIndex < 0 || !entries[baseIndex]) return null;

  let snapshot = entries[baseIndex].data as CanvasSnapshot;
  if (!snapshot) return null;

  // Apply diffs forward to reach targetIndex
  for (let i = baseIndex + 1; i <= targetIndex; i++) {
    const entry = entries[i];
    if (!entry) continue;
    if (entry.type === 'diff') {
      snapshot = applyDiff(snapshot, entry.data);
    } else {
      snapshot = entry.data as CanvasSnapshot;
    }
  }

  return snapshot;
}

/**
 * Check if two snapshots are equal
 */
function snapshotsEqual(a: CanvasSnapshot, b: CanvasSnapshot): boolean {
  // Check sections
  for (const key of Object.keys(a.sections) as CanvasSectionId[]) {
    if (a.sections[key] !== b.sections[key]) return false;
  }

  // Check impact model
  const impactFields = [
    'issue',
    'participants',
    'activities',
    'outputs',
    'shortTermOutcomes',
    'mediumTermOutcomes',
    'longTermOutcomes',
    'impact',
  ] as const;

  for (const field of impactFields) {
    if (a.impactModel[field] !== b.impactModel[field]) return false;
  }

  return true;
}

/**
 * Hook return value
 */
export interface UseCanvasHistoryReturn {
  /** Push a new snapshot to history */
  pushSnapshot: (snapshot: CanvasSnapshot) => void;
  /** Undo to previous state, returns the state to restore */
  undo: () => CanvasSnapshot | null;
  /** Redo to next state, returns the state to restore */
  redo: () => CanvasSnapshot | null;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Get current snapshot without changing history */
  getCurrentSnapshot: () => CanvasSnapshot | null;
  /** Initialize history with current state (call on load) */
  initialize: (snapshot: CanvasSnapshot) => void;
  /** Clear all history */
  clear: () => void;
}

/**
 * Canvas history hook for undo/redo functionality
 */
export function useCanvasHistory(canvasId: string): UseCanvasHistoryReturn {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const lastAiUpdateRef = useRef<number>(0);
  const initializedRef = useRef(false);

  // Refs to avoid stale closures in callbacks
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  // Load history from localStorage on mount
  useEffect(() => {
    const stored = loadHistory(canvasId);
    console.log('[History] loading from localStorage', {
      canvasId,
      found: !!stored,
      entriesCount: stored?.entries?.length ?? 0,
      storedIndex: stored?.currentIndex ?? -1
    });
    if (stored && stored.entries.length > 0) {
      setEntries(stored.entries);
      setCurrentIndex(stored.currentIndex);
      // CRITICAL: Update refs immediately so undo/redo work before next render
      // React state updates are async, but refs need to be sync for callbacks
      entriesRef.current = stored.entries;
      currentIndexRef.current = stored.currentIndex;
      initializedRef.current = true;
      console.log('[History] loaded from localStorage successfully');
    }
  }, [canvasId]);

  // Save history to localStorage on changes
  useEffect(() => {
    if (entries.length > 0) {
      saveHistory(canvasId, { entries, currentIndex });
    }
  }, [canvasId, entries, currentIndex]);

  // Initialize with current state
  const initialize = useCallback((snapshot: CanvasSnapshot) => {
    if (initializedRef.current) {
      console.log('[History] initialize skipped - already initialized');
      return;
    }

    console.log('[History] initialize called, setting up first entry');
    setEntries([{ type: 'snapshot', data: snapshot }]);
    setCurrentIndex(0);
    initializedRef.current = true;
  }, []);

  // Push new snapshot - uses atomic update to keep entries and index in sync
  const pushSnapshot = useCallback((snapshot: CanvasSnapshot) => {
    console.log('[History] pushSnapshot called', { source: snapshot.source });

    // Compute new entries and index together, then update both atomically
    const idx = currentIndexRef.current;
    const prevEntries = entriesRef.current;

    console.log('[History] pushSnapshot processing', { prevLength: prevEntries.length, idx });

    // Get current snapshot for comparison
    const currentSnapshot = idx >= 0 ? rebuildSnapshot(prevEntries, idx) : null;

    // Skip if no change
    if (currentSnapshot && snapshotsEqual(currentSnapshot, snapshot)) {
      console.log('[History] pushSnapshot skipped - no change');
      return;
    }

    // Handle AI batch collapsing - if last update was AI within timeout, replace it
    const now = Date.now();
    if (
      snapshot.source === 'ai' &&
      idx >= 0 &&
      prevEntries[idx]?.type === 'snapshot' &&
      (prevEntries[idx].data as CanvasSnapshot).source === 'ai' &&
      now - lastAiUpdateRef.current < AI_BATCH_TIMEOUT_MS
    ) {
      // Replace last AI entry instead of adding new one
      const newEntries = [...prevEntries.slice(0, idx)];
      newEntries.push({ type: 'snapshot', data: snapshot });
      lastAiUpdateRef.current = now;

      // Update entries but NOT index (replacing at same position)
      setEntries(newEntries);
      entriesRef.current = newEntries;
      console.log('[History] pushSnapshot replaced AI entry', { newLength: newEntries.length, idx });
      return;
    }

    if (snapshot.source === 'ai') {
      lastAiUpdateRef.current = now;
    }

    // Truncate any redo history when pushing new state
    let newEntries = prevEntries.slice(0, idx + 1);

    // Convert older full snapshots to diffs (keep last FULL_SNAPSHOT_COUNT as full)
    if (newEntries.length > FULL_SNAPSHOT_COUNT) {
      const convertIndex = newEntries.length - FULL_SNAPSHOT_COUNT;
      const entryToConvert = newEntries[convertIndex];

      if (entryToConvert.type === 'snapshot' && convertIndex > 0) {
        // Find previous snapshot to calculate diff from
        const prevSnapshot = rebuildSnapshot(newEntries, convertIndex - 1);
        if (prevSnapshot) {
          const diff = calculateDiff(prevSnapshot, entryToConvert.data);
          newEntries[convertIndex] = { type: 'diff', data: diff };
        }
      }
    }

    // Add new entry
    newEntries.push({ type: 'snapshot', data: snapshot });
    const newIndex = newEntries.length - 1;

    // Enforce history limit
    if (newEntries.length > HISTORY_LIMIT) {
      // Remove oldest entries but ensure we keep at least one full snapshot
      const removeCount = newEntries.length - HISTORY_LIMIT;
      newEntries = newEntries.slice(removeCount);

      // Ensure first entry is a full snapshot
      if (newEntries[0].type === 'diff') {
        // Rebuild the first entry as a full snapshot
        const firstSnapshot = rebuildSnapshot(prevEntries, removeCount);
        if (firstSnapshot) {
          newEntries[0] = { type: 'snapshot', data: firstSnapshot };
        }
      }
    }

    // Update both entries and index atomically via refs, then sync state
    entriesRef.current = newEntries;
    currentIndexRef.current = newIndex;
    setEntries(newEntries);
    setCurrentIndex(newIndex);

    console.log('[History] pushSnapshot added entry', { newLength: newEntries.length, newIndex });
  }, []); // No deps - uses refs for all external values

  // Undo
  const undo = useCallback((): CanvasSnapshot | null => {
    const idx = currentIndexRef.current;
    const ents = entriesRef.current;

    console.log('[History] undo called', {
      idx,
      entriesLength: ents.length,
      canUndo: idx > 0,
      entries: ents.map(e => ({ type: e.type, hasData: !!e.data }))
    });

    if (idx <= 0) {
      console.log('[History] undo blocked - idx <= 0');
      return null;
    }

    const newIndex = idx - 1;
    console.log('[History] attempting rebuildSnapshot at index', newIndex);
    const snapshot = rebuildSnapshot(ents, newIndex);

    if (snapshot) {
      setCurrentIndex(newIndex);
      console.log('[History] undo success, new index:', newIndex);
      return snapshot;
    }

    console.log('[History] undo failed - rebuildSnapshot returned null', {
      targetIndex: newIndex,
      entriesLength: ents.length,
      validRange: `0 to ${ents.length - 1}`
    });
    return null;
  }, []); // No deps - uses refs

  // Redo
  const redo = useCallback((): CanvasSnapshot | null => {
    const idx = currentIndexRef.current;
    const ents = entriesRef.current;

    console.log('[History] redo called', { idx, entriesLength: ents.length, canRedo: idx < ents.length - 1 });

    if (idx >= ents.length - 1) return null;

    const newIndex = idx + 1;
    const snapshot = rebuildSnapshot(ents, newIndex);

    if (snapshot) {
      setCurrentIndex(newIndex);
      console.log('[History] redo success, new index:', newIndex);
      return snapshot;
    }

    console.log('[History] redo failed to rebuild snapshot');
    return null;
  }, []); // No deps - uses refs

  // Get current snapshot
  const getCurrentSnapshot = useCallback((): CanvasSnapshot | null => {
    const idx = currentIndexRef.current;
    const ents = entriesRef.current;
    if (idx < 0 || ents.length === 0) return null;
    return rebuildSnapshot(ents, idx);
  }, []); // No deps - uses refs

  // Clear history
  const clear = useCallback(() => {
    setEntries([]);
    setCurrentIndex(-1);
    initializedRef.current = false;
    localStorage.removeItem(getStorageKey(canvasId));
  }, [canvasId]);

  return {
    pushSnapshot,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < entries.length - 1,
    getCurrentSnapshot,
    initialize,
    clear,
  };
}
