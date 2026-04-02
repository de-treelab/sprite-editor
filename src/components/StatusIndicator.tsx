import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  message?: string;
}

export const StatusIndicator: React.FC<Props> = ({ message }) => {
  const { t } = useTranslation();
  return (
  <div className="fixed bottom-4 left-4 z-[90] flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 shadow-xl animate-in slide-in-from-bottom-2">
    <div className="w-4 h-4 border-2 border-slate-600 border-t-indigo-500 rounded-full animate-spin" />
    <span className="text-sm text-slate-300">{message || t('status.working')}</span>
  </div>
  );
};
