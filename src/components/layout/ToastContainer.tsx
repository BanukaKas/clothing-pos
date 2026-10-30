import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
      {toasts.map(toast => {
        const Icon =
          toast.type === 'success'
            ? CheckCircle2
            : toast.type === 'warning'
            ? AlertTriangle
            : toast.type === 'error'
            ? XCircle
            : Info;

        const borderStyle =
          toast.type === 'success'
            ? 'border-emerald-200 bg-white text-emerald-950'
            : toast.type === 'warning'
            ? 'border-amber-200 bg-white text-amber-950'
            : toast.type === 'error'
            ? 'border-rose-200 bg-white text-rose-950'
            : 'border-blue-200 bg-white text-blue-950';

        const iconColor =
          toast.type === 'success'
            ? 'text-emerald-600'
            : toast.type === 'warning'
            ? 'text-amber-500'
            : toast.type === 'error'
            ? 'text-rose-600'
            : 'text-blue-600';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-elevation flex items-start space-x-3 transition-all duration-300 transform translate-y-0 opacity-100 animate-modal ${borderStyle}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold leading-none mb-1">{toast.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
