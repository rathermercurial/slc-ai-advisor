/**
 * useUndoShortcuts - Keyboard shortcut handler for undo/redo
 *
 * Features:
 * - Cmd/Ctrl+Z for undo
 * - Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y for redo
 * - Skips when focused in text input (let browser handle native text undo)
 */

import { useEffect, useCallback } from 'react';

export interface UseUndoShortcutsOptions {
  /** Called when undo shortcut is pressed */
  onUndo: () => void;
  /** Called when redo shortcut is pressed */
  onRedo: () => void;
  /** Whether shortcuts are enabled (default: true) */
  enabled?: boolean;
}

/**
 * Check if the active element is a text input that should handle its own undo
 */
function isTextInputFocused(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();

  // Check for input elements (text, search, etc - not checkboxes/radios)
  if (tagName === 'input') {
    const inputType = (activeElement as HTMLInputElement).type.toLowerCase();
    const textInputTypes = [
      'text',
      'search',
      'url',
      'tel',
      'email',
      'password',
      'number',
    ];
    return textInputTypes.includes(inputType);
  }

  // Check for textarea
  if (tagName === 'textarea') {
    return true;
  }

  // Check for contenteditable elements
  if (activeElement.getAttribute('contenteditable') === 'true') {
    return true;
  }

  return false;
}

/**
 * Hook to handle undo/redo keyboard shortcuts
 *
 * @example
 * ```tsx
 * useUndoShortcuts({
 *   onUndo: () => historyManager.undo(),
 *   onRedo: () => historyManager.redo(),
 * });
 * ```
 */
export function useUndoShortcuts({
  onUndo,
  onRedo,
  enabled = true,
}: UseUndoShortcutsOptions): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isMod = event.metaKey || event.ctrlKey;
      if (!isMod) return;

      // Skip if in text input - let browser handle native text undo
      if (isTextInputFocused()) return;

      // Z key
      if (event.key === 'z' || event.key === 'Z') {
        if (event.shiftKey) {
          // Cmd/Ctrl+Shift+Z = Redo
          event.preventDefault();
          onRedo();
        } else {
          // Cmd/Ctrl+Z = Undo
          event.preventDefault();
          onUndo();
        }
        return;
      }

      // Y key (alternative redo on Windows)
      if (event.key === 'y' || event.key === 'Y') {
        if (!event.shiftKey) {
          // Cmd/Ctrl+Y = Redo
          event.preventDefault();
          onRedo();
        }
        return;
      }
    },
    [enabled, onUndo, onRedo]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}
