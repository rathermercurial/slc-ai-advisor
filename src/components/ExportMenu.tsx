/**
 * Export menu dropdown component
 *
 * Provides options to:
 * - Copy canvas to clipboard (plain text)
 * - Download as JSON
 * - Download as Markdown
 *
 * Closes on click outside or Escape key.
 */

import { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';

export interface ExportMenuProps {
  onCopy: () => void;
  onExportJSON: () => void;
  onExportMarkdown: () => void;
  disabled?: boolean;
}

/**
 * Export dropdown menu component
 */
export function ExportMenu({
  onCopy,
  onExportJSON,
  onExportMarkdown,
  disabled = false,
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="export-menu" ref={menuRef}>
      <button
        type="button"
        className="export-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Export canvas"
      >
        <Download size={18} />
      </button>

      {isOpen && (
        <div className="export-menu-dropdown" role="menu">
          <button
            type="button"
            className="export-menu-item"
            onClick={() => handleItemClick(onCopy)}
            role="menuitem"
          >
            <span className="export-menu-item-icon">{'\u2398'}</span>
            Copy to Clipboard
          </button>
          <button
            type="button"
            className="export-menu-item"
            onClick={() => handleItemClick(onExportJSON)}
            role="menuitem"
          >
            <span className="export-menu-item-icon">{'\u007B\u007D'}</span>
            Download JSON
          </button>
          <button
            type="button"
            className="export-menu-item"
            onClick={() => handleItemClick(onExportMarkdown)}
            role="menuitem"
          >
            <span className="export-menu-item-icon">M</span>
            Download Markdown
          </button>
        </div>
      )}
    </div>
  );
}
