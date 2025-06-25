import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

let toastId = 0;

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', options = {}) => {
    const id = ++toastId;
    const toast = {
      id,
      message,
      type,
      duration: options.duration || 4000,
      closeable: options.closeable !== false,
      persistent: options.persistent || false,
      ...options
    };

    setToasts(prev => [...prev, toast]);

    if (!toast.persistent && toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  }, [removeToast]);

  const showSuccess = useCallback((message, options) => {
    return addToast(message, 'success', options);
  }, [addToast]);

  const showError = useCallback((message, options) => {
    return addToast(message, 'error', { duration: 6000, ...options });
  }, [addToast]);

  const showWarning = useCallback((message, options) => {
    return addToast(message, 'warning', options);
  }, [addToast]);

  const showInfo = useCallback((message, options) => {
    return addToast(message, 'info', options);
  }, [addToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const value = {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 