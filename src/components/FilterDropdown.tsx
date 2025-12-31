/**
 * Filter dropdown component for canvas and thread lists.
 *
 * Custom styled dropdown matching the export menu style.
 * Closes on click outside or Escape key.
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export type FilterOption = 'all' | 'active' | 'starred' | 'archived';

interface FilterDropdownProps {
  value: FilterOption;
  onChange: (value: FilterOption) => void;
  className?: string;
}

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'starred', label: 'Starred' },
  { value: 'archived', label: 'Archived' },
];

/**
 * Filter dropdown for canvas and thread lists.
 * Options: All, Active, Starred, Archived
 */
export function FilterDropdown({ value, onChange, className = '' }: FilterDropdownProps) {
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

  const handleSelect = (option: FilterOption) => {
    onChange(option);
    setIsOpen(false);
  };

  const currentLabel = FILTER_OPTIONS.find((opt) => opt.value === value)?.label ?? 'Active';

  return (
    <div className={`filter-menu ${className}`} ref={menuRef}>
      <button
        type="button"
        className="filter-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Filter: ${currentLabel}`}
      >
        <span className="filter-menu-label">{currentLabel}</span>
        <ChevronDown size={12} className="filter-menu-caret" />
      </button>

      {isOpen && (
        <ul className="filter-menu-dropdown" role="listbox">
          {FILTER_OPTIONS.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                className={`filter-menu-item ${option.value === value ? 'selected' : ''}`}
                onClick={() => handleSelect(option.value)}
                role="option"
                aria-selected={option.value === value}
              >
                <span className="filter-menu-item-check">
                  {option.value === value && <Check size={12} />}
                </span>
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
