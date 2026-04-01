import React from 'react';
import { ViewContext } from './ViewContext';
import { getView } from '../../layouts/viewRegistry';
import { useLayoutStore } from '../../store/layoutStore';

interface ViewSlotProps {
  viewId: string;
}

export const ViewSlot: React.FC<ViewSlotProps> = ({ viewId }) => {
  const hiddenViewIds = useLayoutStore(s => s.layout.hiddenViewIds);
  const viewDef = getView(viewId);

  if (!viewDef) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
        Unknown view: {viewId}
      </div>
    );
  }

  if (hiddenViewIds.includes(viewId)) return null;

  const Component = viewDef.component;

  return (
    <ViewContext.Provider value={viewId}>
      <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
        <Component />
      </div>
    </ViewContext.Provider>
  );
};
