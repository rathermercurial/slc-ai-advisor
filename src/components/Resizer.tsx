/**
 * Resizer Component
 *
 * Draggable divider for adjusting panel sizes.
 * Uses mouse events for desktop, touch events for mobile.
 * Supports keyboard navigation with Arrow keys.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface ResizerProps {
  /** Direction of resize: horizontal splits left/right, vertical splits top/bottom */
  direction?: 'horizontal' | 'vertical';
  /** Callback with new size as percentage (0-100) or pixels if pixelMode is true */
  onResize: (value: number) => void;
  /** Minimum percentage for the first panel */
  minPercentage?: number;
  /** Maximum percentage for the first panel */
  maxPercentage?: number;
  /** Use pixel values instead of percentages (for fixed-width panels) */
  pixelMode?: boolean;
  /** Minimum pixels (only used in pixelMode) */
  minPixels?: number;
  /** Maximum pixels (only used in pixelMode) */
  maxPixels?: number;
  /** Current value (percentage or pixels) for aria-valuenow */
  currentValue?: number;
}

/** Step size for keyboard navigation */
const KEYBOARD_STEP = 20;

export function Resizer({
  direction = 'horizontal',
  onResize,
  minPercentage = 30,
  maxPercentage = 70,
  pixelMode = false,
  minPixels = 100,
  maxPixels = 500,
  currentValue,
}: ResizerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (pixelMode) {
        // Pixel mode: use absolute position from viewport edge
        let pixels: number;
        if (direction === 'horizontal') {
          pixels = e.clientX;
        } else {
          pixels = e.clientY;
        }
        pixels = Math.max(minPixels, Math.min(maxPixels, pixels));
        onResize(pixels);
      } else {
        // Percentage mode: calculate relative to parent container
        const container = containerRef.current?.parentElement;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        let percentage: number;

        if (direction === 'horizontal') {
          percentage = ((e.clientX - rect.left) / rect.width) * 100;
        } else {
          percentage = ((e.clientY - rect.top) / rect.height) * 100;
        }

        percentage = Math.max(minPercentage, Math.min(maxPercentage, percentage));
        onResize(percentage);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      if (pixelMode) {
        let pixels: number;
        if (direction === 'horizontal') {
          pixels = touch.clientX;
        } else {
          pixels = touch.clientY;
        }
        pixels = Math.max(minPixels, Math.min(maxPixels, pixels));
        onResize(pixels);
      } else {
        const container = containerRef.current?.parentElement;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        let percentage: number;

        if (direction === 'horizontal') {
          percentage = ((touch.clientX - rect.left) / rect.width) * 100;
        } else {
          percentage = ((touch.clientY - rect.top) / rect.height) * 100;
        }

        percentage = Math.max(minPercentage, Math.min(maxPercentage, percentage));
        onResize(percentage);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleMouseUp);

    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, direction, minPercentage, maxPercentage, pixelMode, minPixels, maxPixels, onResize]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (currentValue === undefined) return;

    const minValue = pixelMode ? minPixels : minPercentage;
    const maxValue = pixelMode ? maxPixels : maxPercentage;

    let newValue = currentValue;

    // For horizontal resizers: Left decreases, Right increases
    // For vertical resizers: Up decreases, Down increases
    if (direction === 'horizontal') {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        newValue = Math.max(minValue, currentValue - KEYBOARD_STEP);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        newValue = Math.min(maxValue, currentValue + KEYBOARD_STEP);
      }
    } else {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        newValue = Math.max(minValue, currentValue - KEYBOARD_STEP);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        newValue = Math.min(maxValue, currentValue + KEYBOARD_STEP);
      }
    }

    if (newValue !== currentValue) {
      onResize(newValue);
    }
  }, [currentValue, pixelMode, minPixels, maxPixels, minPercentage, maxPercentage, direction, onResize]);

  // Calculate ARIA values
  const ariaValueMin = pixelMode ? minPixels : minPercentage;
  const ariaValueMax = pixelMode ? maxPixels : maxPercentage;

  return (
    <div
      ref={containerRef}
      className={`resizer resizer-${direction} ${isDragging ? 'resizer-active' : ''}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onKeyDown={handleKeyDown}
      role="separator"
      aria-orientation={direction}
      aria-label={`Resize ${direction === 'horizontal' ? 'panels' : 'sections'}`}
      aria-valuenow={currentValue}
      aria-valuemin={ariaValueMin}
      aria-valuemax={ariaValueMax}
      tabIndex={0}
    >
      <div className="resizer-handle" />
    </div>
  );
}
