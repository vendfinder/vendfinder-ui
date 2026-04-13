'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { ToastContainer, ToastMessage, ToastType } from '@/components/ui/Toast';

interface ToastContextValue {
  showToast: (
    type: ToastType,
    title: string,
    description?: string,
    duration?: number
  ) => void;
  dismissToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (
      type: ToastType,
      title: string,
      description?: string,
      duration?: number
    ) => {
      const id = crypto.randomUUID();
      const newToast: ToastMessage = {
        id,
        type,
        title,
        description,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextValue = {
    showToast,
    dismissToast,
    clearAll,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={dismissToast} />
    </ToastContext.Provider>
  );
}