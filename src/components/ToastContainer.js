import React, { useState, useEffect } from 'react';
import { toast } from '../utils/notifications';
import '../styles/toast.css';

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Bildirim listener'ını ekle
    const unsubscribe = toast.addListener((currentToasts) => {
      setToasts([...currentToasts]);
    });

    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toastItem) => (
        <ToastItem key={toastItem.id} toast={toastItem} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast: toastItem }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animasyon için timeout
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    toast.remove(toastItem.id);
  };

  const getToastClasses = () => {
    const classes = ['toast', `toast--${toastItem.type}`];
    if (isVisible) classes.push('toast--visible');
    return classes.join(' ');
  };

  const getIcon = () => {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[toastItem.type] || 'ℹ';
  };

  return (
    <div className={getToastClasses()}>
      <span className="toast__icon">
        {getIcon()}
      </span>
      <span className="toast__message">
        {toastItem.message}
      </span>
      {toastItem.closeable !== false && (
        <button
          onClick={handleClose}
          className="toast__close"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default ToastContainer;