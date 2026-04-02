import React, { useState, useRef, useEffect } from 'react';

interface InlineEditInputProps {
  value: string;
  onSave: (value: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  selectOnFocus?: boolean;
  className?: string;
}

export const InlineEditInput: React.FC<InlineEditInputProps> = ({
  value: initialValue,
  onSave,
  onCancel,
  placeholder,
  selectOnFocus = true,
  className = '',
}) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      if (selectOnFocus) {
        inputRef.current.select();
      }
    }
  }, [selectOnFocus]);

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onSave(trimmed);
    } else {
      onCancel?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel?.();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
      placeholder={placeholder}
      className={`
        flex-1 bg-slate-900 text-xs px-1 py-0.5 rounded
        border border-indigo-500 outline-none
        text-slate-200 placeholder:text-slate-500
        w-full min-w-0
        ${className}
      `
        .trim()
        .replace(/\s+/g, ' ')}
    />
  );
};

// Hook for managing inline edit state
export const useInlineEdit = () => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const startEditing = (id: string) => {
    setEditingId(id);
  };

  const stopEditing = () => {
    setEditingId(null);
  };

  const isEditing = (id: string) => editingId === id;

  return {
    editingId,
    startEditing,
    stopEditing,
    isEditing,
  };
};
