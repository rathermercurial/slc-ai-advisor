/**
 * Canvas Registry - Hybrid localStorage + Backend Verification
 *
 * Stores canvas list in localStorage for fast startup.
 * Verifies canvases exist on backend and removes stale entries.
 */

import type { CanvasInfo } from '../components/CanvasList';

const REGISTRY_KEY = 'canvasRegistry';

interface CanvasRegistryData {
  canvases: CanvasInfo[];
  updatedAt: string;
}

/**
 * Get all canvases from localStorage
 */
export function getLocalCanvases(): CanvasInfo[] {
  try {
    const data = localStorage.getItem(REGISTRY_KEY);
    if (!data) return [];
    const parsed: CanvasRegistryData = JSON.parse(data);
    return parsed.canvases || [];
  } catch {
    return [];
  }
}

/**
 * Save canvases to localStorage
 */
export function saveLocalCanvases(canvases: CanvasInfo[]): void {
  const data: CanvasRegistryData = {
    canvases,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(data));
}

/**
 * Add a canvas to the registry
 */
export function addCanvas(canvas: CanvasInfo): CanvasInfo[] {
  const canvases = getLocalCanvases();
  // Check if already exists
  const existing = canvases.find((c) => c.id === canvas.id);
  if (existing) {
    // Update existing
    const updated = canvases.map((c) =>
      c.id === canvas.id ? { ...c, ...canvas, lastAccessedAt: new Date().toISOString() } : c
    );
    saveLocalCanvases(updated);
    return updated;
  }
  // Add new canvas at the beginning
  const updated = [canvas, ...canvases];
  saveLocalCanvases(updated);
  return updated;
}

/**
 * Update a canvas in the registry
 */
export function updateCanvas(canvasId: string, updates: Partial<CanvasInfo>): CanvasInfo[] {
  const canvases = getLocalCanvases();
  const updated = canvases.map((c) =>
    c.id === canvasId ? { ...c, ...updates } : c
  );
  saveLocalCanvases(updated);
  return updated;
}

/**
 * Remove a canvas from the registry
 */
export function removeCanvas(canvasId: string): CanvasInfo[] {
  const canvases = getLocalCanvases();
  const updated = canvases.filter((c) => c.id !== canvasId);
  saveLocalCanvases(updated);
  return updated;
}

/**
 * Update last accessed time for a canvas
 */
export function touchCanvas(canvasId: string): CanvasInfo[] {
  return updateCanvas(canvasId, { lastAccessedAt: new Date().toISOString() });
}

/**
 * Verify a canvas exists on the backend
 * Returns canvas metadata if valid, null if not found
 */
export async function verifyCanvas(canvasId: string): Promise<{
  id: string;
  name: string;
  threadCount: number;
} | null> {
  try {
    const response = await fetch(`/api/canvas/${canvasId}/meta`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Verify all canvases in the registry and remove invalid ones
 * Returns verified canvases
 */
export async function verifyAllCanvases(): Promise<CanvasInfo[]> {
  const canvases = getLocalCanvases();
  if (canvases.length === 0) return [];

  // Verify each canvas in parallel
  const results = await Promise.all(
    canvases.map(async (canvas) => {
      const meta = await verifyCanvas(canvas.id);
      if (meta) {
        // Update name from backend if different
        return {
          ...canvas,
          name: meta.name || canvas.name,
        };
      }
      return null; // Canvas no longer exists
    })
  );

  // Filter out null (invalid) canvases
  const verified = results.filter((c): c is CanvasInfo => c !== null);

  // Save verified list back to localStorage
  if (verified.length !== canvases.length) {
    saveLocalCanvases(verified);
  }

  return verified;
}

/**
 * Get the most recently accessed canvas ID
 */
export function getMostRecentCanvasId(): string | null {
  const canvases = getLocalCanvases();
  if (canvases.length === 0) return null;

  // Sort by lastAccessedAt descending
  const sorted = [...canvases].sort(
    (a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
  );

  return sorted[0]?.id || null;
}
