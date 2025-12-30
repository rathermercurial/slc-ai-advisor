/**
 * Export menu dropdown component
 *
 * Provides options to:
 * - Copy canvas to clipboard (plain text)
 * - Download canvas as JSON
 * - Download canvas as Markdown
 * - Copy chat to clipboard
 * - Download chat as Markdown
 *
 * Closes on click outside or Escape key.
 */

import { useState, useRef, useEffect } from 'react';
import {
  Download,
  ClipboardCopy,
  FileJson,
  FileText,
  MessageSquare,
  MessageSquareText,
} from 'lucide-react';

export interface ExportMenuProps {
  onCopy: () => void;
  onExportJSON: () => void;
  onExportMarkdown: () => void;
  onCopyChat?: () => void;
  onSaveChat?: () => void;
  disabled?: boolean;
  chatDisabled?: boolean;
  onHoverChange?: (text: string | null) => void;
}

/**
 * Export dropdown menu component
 */
export function ExportMenu({
  onCopy,
  onExportJSON,
  onExportMarkdown,
  onCopyChat,
  onSaveChat,
  disabled = false,
  chatDisabled = false,
  onHoverChange,
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
        onMouseEnter={() => onHoverChange?.('Copy & Export')}
        onMouseLeave={() => onHoverChange?.(null)}
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Copy & Export"
      >
        <Download size={18} />
      </button>

      {isOpen && (
        <div className="export-menu-dropdown" role="menu">
          <div className="export-menu-group">
            <div className="export-menu-group-label">Canvas</div>
            <button
              type="button"
              className="export-menu-item"
              onClick={() => handleItemClick(onCopy)}
              role="menuitem"
            >
              <ClipboardCopy size={16} className="export-menu-item-icon" />
              Copy to Clipboard
            </button>
            <button
              type="button"
              className="export-menu-item"
              onClick={() => handleItemClick(onExportJSON)}
              role="menuitem"
            >
              <FileJson size={16} className="export-menu-item-icon" />
              Download JSON
            </button>
            <button
              type="button"
              className="export-menu-item"
              onClick={() => handleItemClick(onExportMarkdown)}
              role="menuitem"
            >
              <FileText size={16} className="export-menu-item-icon" />
              Download Markdown
            </button>
          </div>
          {(onCopyChat || onSaveChat) && (
            <div className="export-menu-group">
              <div className="export-menu-group-label">Chat</div>
              {onCopyChat && (
                <button
                  type="button"
                  className="export-menu-item"
                  onClick={() => handleItemClick(onCopyChat)}
                  role="menuitem"
                  disabled={chatDisabled}
                >
                  <MessageSquare size={16} className="export-menu-item-icon" />
                  Copy Chat
                </button>
              )}
              {onSaveChat && (
                <button
                  type="button"
                  className="export-menu-item"
                  onClick={() => handleItemClick(onSaveChat)}
                  role="menuitem"
                  disabled={chatDisabled}
                >
                  <MessageSquareText size={16} className="export-menu-item-icon" />
                  Save Chat
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
