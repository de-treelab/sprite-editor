import React from 'react';

interface Props {
  message?: string;
}

export const LoadingOverlay: React.FC<Props> = ({ message = 'Loading…' }) => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-4">
      {/* Spinner */}
      <div className="w-10 h-10 border-4 border-slate-600 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-sm text-slate-300">{message}</p>
    </div>
  </div>
);
