/**
 * Lightweight toast notification system
 * Drop-in replacement for 'sonner' toast API
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (type: ToastType, message: string, description?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

const icons: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error:   AlertCircle,
  warning: AlertTriangle,
  info:    Info,
};

const typeClasses: Record<ToastType, string> = {
  success: 'border-green-500/30 bg-green-500/10 text-green-300',
  error:   'border-red-500/30 bg-red-500/10 text-red-300',
  warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
  info:    'border-blue-500/30 bg-blue-500/10 text-blue-300',
};

function ToastItem({ item, onRemove }: { item: ToastItem; onRemove: () => void }) {
  const Icon = icons[item.type];

  useEffect(() => {
    const timer = setTimeout(onRemove, 4000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 border rounded-xl shadow-xl min-w-64 max-w-sm',
        'animate-fade-in backdrop-blur-md bg-opacity-80',
        typeClasses[item.type]
      )}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{item.message}</p>
        {item.description && <p className="text-xs opacity-75 mt-0.5">{item.description}</p>}
      </div>
      <button onClick={onRemove} className="text-current opacity-50 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, message: string, description?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message, description }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem item={t} onRemove={() => removeToast(t.id)} />
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const { addToast } = useContext(ToastContext);
  return {
    success: (message: string, description?: string) => addToast('success', message, description),
    error:   (message: string, description?: string) => addToast('error', message, description),
    warning: (message: string, description?: string) => addToast('warning', message, description),
    info:    (message: string, description?: string) => addToast('info', message, description),
  };
}

/** Drop-in sonner-compatible toast function */
export const toast = {
  success: (message: string) => console.log('[toast success]', message),
  error:   (message: string) => console.error('[toast error]', message),
  warning: (message: string) => console.warn('[toast warning]', message),
  info:    (message: string) => console.info('[toast info]', message),
};
