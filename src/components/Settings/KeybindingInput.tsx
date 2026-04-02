import React, { useState, useCallback, useRef, useEffect } from 'react';

interface KeybindingInputProps {
  value: string;
  onChange: (value: string) => void;
  onReset?: () => void;
  isDefault: boolean;
}

const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta']);

function keyEventToString(e: React.KeyboardEvent): string | null {
  if (MODIFIER_KEYS.has(e.key)) return null; // don't record bare modifiers

  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('ctrl');
  if (e.shiftKey) parts.push('shift');
  if (e.altKey) parts.push('alt');

  let key = e.key.toLowerCase();
  // Normalize some common keys
  if (key === ' ') key = 'space';
  if (key === 'arrowup') key = 'up';
  if (key === 'arrowdown') key = 'down';
  if (key === 'arrowleft') key = 'left';
  if (key === 'arrowright') key = 'right';
  if (key === 'escape') key = 'escape';
  if (key === '+') key = '='; // shift normalization for +/=

  parts.push(key);
  return parts.join('+');
}

function formatKeybinding(binding: string): string {
  return binding
    .split('+')
    .map((part) => {
      if (part === 'ctrl') return 'Ctrl';
      if (part === 'shift') return 'Shift';
      if (part === 'alt') return 'Alt';
      if (part === 'meta') return 'Meta';
      if (part === 'space') return 'Space';
      if (part === 'delete') return 'Delete';
      if (part === 'escape') return 'Esc';
      if (part === 'up') return '↑';
      if (part === 'down') return '↓';
      if (part === 'left') return '←';
      if (part === 'right') return '→';
      return part.toUpperCase();
    })
    .join(' + ');
}

export const KeybindingInput: React.FC<KeybindingInputProps> = ({ value, onChange, onReset, isDefault }) => {
  const [recording, setRecording] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (recording && inputRef.current) {
      inputRef.current.focus();
    }
  }, [recording]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!recording) return;
      e.preventDefault();
      e.stopPropagation();

      const combo = keyEventToString(e);
      if (combo) {
        onChange(combo);
        setRecording(false);
      }
    },
    [recording, onChange],
  );

  const handleBlur = useCallback(() => {
    setRecording(false);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div
        ref={inputRef}
        tabIndex={0}
        role="button"
        className={`
          flex-1 px-3 py-1.5 rounded text-sm border cursor-pointer select-none
          outline-none transition-colors min-w-[140px]
          ${
            recording
              ? 'bg-indigo-900/40 border-indigo-500 text-indigo-300 animate-pulse'
              : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500'
          }
          ${!isDefault ? 'ring-1 ring-indigo-500/30' : ''}
        `}
        onClick={() => setRecording(true)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      >
        {recording ? 'Press key combination…' : formatKeybinding(value)}
      </div>
      {!isDefault && onReset && (
        <button
          className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-700 transition-colors"
          onClick={onReset}
          title="Reset to default"
        >
          Reset
        </button>
      )}
    </div>
  );
};
