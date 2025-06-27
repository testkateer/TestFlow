import React from 'react';
import { createPortal } from 'react-dom';
import { useNotification } from '../../contexts/NotificationContext';
import Toast from './Toast';
import '../../styles/main.css';

const ToastContainer = () => {
  const { toasts, removeToast } = useNotification();

  if (toasts.length === 0) {
    return null;
  }

  return createPortal(
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast 
          key={toast.id} 
          toast={toast} 
          onRemove={removeToast}
        />
      ))}
    </div>,
    document.body
  );
};

export default ToastContainer; 