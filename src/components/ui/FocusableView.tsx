import React, { useRef, useEffect } from 'react';
import { useEditorStore, ViewType } from '../../store/editorStore';

interface FocusableViewProps {
  viewId: ViewType;
  children: React.ReactNode;
  className?: string;
  focusClassName?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

/**
 * A wrapper component that manages focus state for a view.
 * Provides visual styling when the view is focused and handles
 * focus/blur events to update the global focus state.
 */
export const FocusableView: React.FC<FocusableViewProps> = ({
  viewId,
  children,
  className = '',
  focusClassName = 'ring-2 ring-indigo-500 ring-inset',
  as: Component = 'div',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const focusedView = useEditorStore((state) => state.focusedView);
  const setFocusedView = useEditorStore((state) => state.setFocusedView);

  const isFocused = focusedView === viewId;

  // When this view becomes focused via keyboard shortcut, actually focus the DOM element
  useEffect(() => {
    if (isFocused && ref.current && document.activeElement !== ref.current) {
      ref.current.focus();
    }
  }, [isFocused]);

  const handleFocus = (e: React.FocusEvent) => {
    // Only set focus if this element itself is focused (not a child)
    if (e.target === ref.current) {
      setFocusedView(viewId);
    }
  };

  const handleClick = () => {
    setFocusedView(viewId);
    ref.current?.focus();
  };

  const ElementComponent = Component as React.ElementType;

  return (
    <ElementComponent
      ref={ref}
      tabIndex={0}
      className={`
        ${className}
        outline-none
        transition-shadow duration-150
        ${isFocused ? focusClassName : ''}
      `.trim().replace(/\s+/g, ' ')}
      onFocus={handleFocus}
      onClick={handleClick}
    >
      {children}
    </ElementComponent>
  );
};
