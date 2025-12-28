/**
 * Resizer Component
 *
 * Draggable divider for adjusting panel sizes.
 * Uses mouse events for desktop, touch events for mobile.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface ResizerProps {
  /** Direction of resize: horizontal splits left/right, vertical splits top/bottom */
  direction?: 'horizontal' | 'vertical';
  /** Callback with new size as percentage (0-100) */
  onResize: (percentage: number) => void;
  /** Minimum percentage for the first panel */
  minPercentage?: number;
  /** Maximum percentage for the first panel */
  maxPercentage?: number;
}

export function Resizer({
  direction = 'horizontal',
  onResize,
  minPercentage = 30,
  maxPercentage = 70,
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
      const container = containerRef.current?.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      let percentage: number;

      if (direction === 'horizontal') {
        percentage = ((e.clientX - rect.left) / rect.width) * 100;
      } else {
        percentage = ((e.clientY - rect.top) / rect.height) * 100;
      }

      // Clamp to min/max
      percentage = Math.max(minPercentage, Math.min(maxPercentage, percentage));
      onResize(percentage);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

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
  }, [isDragging, direction, minPercentage, maxPercentage, onResize]);

  return (
    <div
      ref={containerRef}
      className={`resizer resizer-${direction} ${isDragging ? 'resizer-active' : ''}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      role="separator"
      aria-orientation={direction}
      aria-label={`Resize ${direction === 'horizontal' ? 'panels' : 'sections'}`}
      tabIndex={0}
    >
      <div className="resizer-handle" />
    </div>
  );
}
