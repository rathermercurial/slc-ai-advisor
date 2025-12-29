import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Inline edit component for canvas and thread names.
 * Click to edit, Enter to save, Escape to cancel.
 */
export function InlineEdit({ value, onSave, placeholder = 'Untitled', className = '' }: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    handleSave();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    } else {
      setEditValue(value);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleTextKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsEditing(true);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`inline-edit-input ${className}`}
        placeholder={placeholder}
        aria-label="Edit name"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleTextKeyDown}
      className={`inline-edit-text ${className}`}
      title="Click to edit"
      aria-label={`Edit ${value || placeholder}`}
    >
      {value || placeholder}
    </button>
  );
}
