import React, { useState, useRef, useEffect, useCallback } from 'react';

type DropdownAlign = 'left' | 'right';
type DropdownPosition = 'bottom' | 'top';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: DropdownAlign;
  position?: DropdownPosition;
  className?: string;
  menuClassName?: string;
  closeOnSelect?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  children,
  align = 'left',
  position = 'bottom',
  className = '',
  menuClassName = '',
  closeOnSelect = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleClickOutside, handleEscape]);

  const alignStyles = align === 'right' ? 'right-0' : 'left-0';
  const positionStyles = position === 'top' ? 'bottom-full mb-1' : 'top-full mt-1';

  const handleMenuClick = () => {
    if (closeOnSelect) {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div
          ref={menuRef}
          className={`
            absolute z-50 ${alignStyles} ${positionStyles}
            min-w-[180px] py-1
            bg-slate-800 border border-slate-700 rounded-lg shadow-xl
            ${menuClassName}
          `
            .trim()
            .replace(/\s+/g, ' ')}
          onClick={handleMenuClick}
        >
          {children}
        </div>
      )}
    </div>
  );
};

// Controlled version of dropdown
interface ControlledDropdownProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: DropdownAlign;
  position?: DropdownPosition;
  className?: string;
  menuClassName?: string;
}

export const ControlledDropdown: React.FC<ControlledDropdownProps> = ({
  isOpen,
  onOpenChange,
  trigger,
  children,
  align = 'left',
  position = 'bottom',
  className = '',
  menuClassName = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    },
    [onOpenChange],
  );

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleClickOutside, handleEscape]);

  const alignStyles = align === 'right' ? 'right-0' : 'left-0';
  const positionStyles = position === 'top' ? 'bottom-full mb-1' : 'top-full mt-1';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div onClick={() => onOpenChange(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div
          className={`
            absolute z-50 ${alignStyles} ${positionStyles}
            min-w-[180px] py-1
            bg-slate-800 border border-slate-700 rounded-lg shadow-xl
            ${menuClassName}
          `
            .trim()
            .replace(/\s+/g, ' ')}
        >
          {children}
        </div>
      )}
    </div>
  );
};
