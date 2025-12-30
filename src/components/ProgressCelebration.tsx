/**
 * Progress celebration component
 *
 * Displays toast notifications at progress milestones (25%, 50%, 75%)
 * and triggers confetti at 100% completion.
 *
 * Tracks shown milestones in localStorage to avoid repeating celebrations
 * for the same canvas.
 */

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import type { ToastType } from './Toast';

export interface ProgressCelebrationProps {
  canvasId: string;
  progress: number;
  onShowToast: (message: string, type: ToastType) => void;
}

// SLC model colors: Customer (blue), Economic (amber), Impact (purple)
const SLC_COLORS = ['#2563eb', '#f59e0b', '#9333ea'];

// Milestone messages
const MILESTONES: Record<number, string> = {
  25: 'Great start!',
  50: 'Halfway there!',
  75: 'Almost complete!',
};

/**
 * Get localStorage key for tracking milestones
 */
function getMilestoneKey(canvasId: string): string {
  return `canvas-${canvasId}-milestones`;
}

/**
 * Get shown milestones from localStorage
 */
function getShownMilestones(canvasId: string): number[] {
  try {
    const stored = localStorage.getItem(getMilestoneKey(canvasId));
    if (stored) {
      return JSON.parse(stored) as number[];
    }
  } catch (e) {
    console.warn('Failed to read milestones from localStorage:', e);
  }
  return [];
}

/**
 * Save shown milestone to localStorage
 */
function saveMilestone(canvasId: string, milestone: number): void {
  try {
    const shown = getShownMilestones(canvasId);
    if (!shown.includes(milestone)) {
      shown.push(milestone);
      localStorage.setItem(getMilestoneKey(canvasId), JSON.stringify(shown));
    }
  } catch (e) {
    console.warn('Failed to save milestone to localStorage:', e);
  }
}

/**
 * Trigger confetti burst with SLC model colors
 */
function triggerConfetti(): void {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: SLC_COLORS,
  });
}

/**
 * Progress celebration hook/component
 *
 * Watches progress changes and:
 * - Shows toast at 25%, 50%, 75% milestones
 * - Triggers confetti at 100% completion
 * - Only celebrates each milestone once per canvas (tracked in localStorage)
 */
export function ProgressCelebration({
  canvasId,
  progress,
  onShowToast,
}: ProgressCelebrationProps) {
  // Track previous progress to detect milestone crossings
  const prevProgressRef = useRef<number>(progress);
  // Track initial mount to avoid celebrating on page load
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip celebration on initial mount to avoid celebrating when loading
    // a canvas that already has progress
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevProgressRef.current = progress;
      return;
    }

    const prevProgress = prevProgressRef.current;
    const shownMilestones = getShownMilestones(canvasId);

    // Check each milestone
    for (const [milestoneStr, message] of Object.entries(MILESTONES)) {
      const milestone = parseInt(milestoneStr, 10);

      // Check if we crossed this milestone (from below to at-or-above)
      if (
        prevProgress < milestone &&
        progress >= milestone &&
        !shownMilestones.includes(milestone)
      ) {
        onShowToast(message, 'success');
        saveMilestone(canvasId, milestone);
      }
    }

    // Check for 100% completion
    if (
      prevProgress < 100 &&
      progress >= 100 &&
      !shownMilestones.includes(100)
    ) {
      // Slight delay to let the UI update before confetti
      setTimeout(() => {
        triggerConfetti();
      }, 100);
      saveMilestone(canvasId, 100);
    }

    // Update previous progress for next comparison
    prevProgressRef.current = progress;
  }, [canvasId, progress, onShowToast]);

  // This component doesn't render anything
  return null;
}
