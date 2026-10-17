'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="no-print fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-3.5 rounded-xl shadow-lg border text-xs font-medium backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 duration-200 ${
              isSuccess
                ? 'bg-slate-900/95 text-white border-slate-800'
                : isError
                ? 'bg-rose-900/95 text-white border-rose-800'
                : 'bg-slate-900/95 text-white border-slate-800'
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            ) : isError ? (
              <AlertTriangle size={18} className="text-rose-400 shrink-0" />
            ) : (
              <Info size={18} className="text-indigo-400 shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
