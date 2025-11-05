'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
  actions?: ToastAction[];
}

export function Toast({ id, title, description, type, duration = 5000, onClose, actions }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Don't auto-dismiss if there are action buttons
    if (actions && actions.length > 0) return;
    
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, actions]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose(id);
    }, 300);
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: 'bg-success-50 border-success-200 text-success-800 dark:bg-success-900/20 dark:border-success-800 dark:text-success-200',
    error: 'bg-error-50 border-error-200 text-error-800 dark:bg-error-900/20 dark:border-error-800 dark:text-error-200',
    warning: 'bg-warning-50 border-warning-200 text-warning-800 dark:bg-warning-900/20 dark:border-warning-800 dark:text-warning-200',
    info: 'bg-primary-50 border-primary-200 text-primary-800 dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-200',
  };

  const iconColors = {
    success: 'text-success-500',
    error: 'text-error-500',
    warning: 'text-warning-500',
    info: 'text-primary-500',
  };

  if (!isVisible) return null;

  const Icon = icons[type];

  return (
    <div
      className={`
        w-full sm:max-w-sm bg-white dark:bg-secondary-800 shadow-large rounded-xl border p-4 pointer-events-auto
        transform transition-all duration-300 ease-in-out
        ${isLeaving ? 'translate-y-2 sm:translate-x-full opacity-0' : 'translate-y-0 sm:translate-x-0 opacity-100'}
        ${colors[type]}
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconColors[type]}`} />
        </div>
        <div className="ml-3 min-w-0 flex-1 break-words">
          {title && (
            <p className="text-sm font-medium">{title}</p>
          )}
          {description && (
            <p className={`text-sm ${title ? 'mt-1' : ''} whitespace-pre-line break-words`}>{description}</p>
          )}
          {actions && actions.length > 0 && (
            <div className="mt-3 flex space-x-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.onClick();
                    handleClose();
                  }}
                  className="btn-sm btn-outline"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            className="bg-white dark:bg-secondary-800 rounded-md inline-flex text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={handleClose}
          >
            <span className="sr-only">Close</span>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div
      className={
        "fixed z-50 w-full px-3 pb-4 bottom-0 left-0 right-0 sm:w-auto sm:px-0 sm:pb-0 sm:top-4 sm:right-4 sm:left-auto"
      }
      style={{ WebkitPaddingEnd: 'env(safe-area-inset-right)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex flex-col items-stretch sm:items-end gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </div>
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id, onClose: removeToast };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const success = (title: string, description?: string) => {
    addToast({ type: 'success', title, description });
  };

  const error = (title: string, description?: string) => {
    addToast({ type: 'error', title, description });
  };

  const warning = (title: string, description?: string) => {
    addToast({ type: 'warning', title, description });
  };

  const info = (title: string, description?: string) => {
    addToast({ type: 'info', title, description });
  };

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}