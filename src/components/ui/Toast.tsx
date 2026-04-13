'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

function Toast({ toast, onClose }: ToastProps) {
  const { id, type, title, description, duration = 5000 } = toast;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    error: 'text-red-400 bg-red-400/10 border-red-400/20',
    warning: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    info: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  };

  const Icon = icons[type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`
        relative max-w-sm w-full bg-card border rounded-xl p-4 shadow-[0_8px_40px_rgba(0,0,0,0.4)]
        ${colors[type]}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-xs text-muted mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        <button
          onClick={() => onClose(id)}
          className="shrink-0 p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onClose={onClose} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}