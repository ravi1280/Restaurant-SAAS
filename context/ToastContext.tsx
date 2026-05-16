'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = { id, message, type, duration };
    setToasts(prev => [...prev, toast]);
    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 10);
    const t2 = setTimeout(() => {
      setRemoving(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, (toast.duration || 4000) - 300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [toast, onRemove]);

  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  const colors: Record<ToastType, string> = {
    success: 'border-success bg-success/10 text-success',
    error: 'border-danger bg-danger/10 text-danger',
    info: 'border-info bg-info/10 text-info',
    warning: 'border-warning bg-warning/10 text-warning',
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-md bg-surface
        min-w-[280px] max-w-[380px] shadow-2xl transition-all duration-300
        ${colors[toast.type]}
        ${visible && !removing ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
      `}
    >
      <span className="text-lg font-bold leading-none mt-0.5">{icons[toast.type]}</span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-primary">{toast.message}</p>
        {/* Progress bar */}
        <div className="mt-2 h-0.5 rounded-full bg-current opacity-30 overflow-hidden">
          <div
            className="h-full bg-current opacity-100 rounded-full"
            style={{
              animation: `shrink ${toast.duration || 4000}ms linear forwards`,
            }}
          />
        </div>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="opacity-50 hover:opacity-100 transition-opacity text-primary text-sm"
      >
        ✕
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
