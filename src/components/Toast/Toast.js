import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import '../../styles/main.css';

const TOAST_ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
};

const Toast = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const Icon = TOAST_ICONS[toast.type] || Info;

  useEffect(() => {
    // Enter animation
    const enterTimer = setTimeout(() => setIsVisible(true), 50);
    
    return () => clearTimeout(enterTimer);
  }, []);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  useEffect(() => {
    if (!toast.persistent && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleRemove();
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.duration, toast.persistent]);

  const handleClick = () => {
    if (toast.onClick) {
      toast.onClick();
    }
  };

  return (
    <div 
      className={`toast toast--${toast.type} ${isVisible ? 'toast--visible' : ''} ${isRemoving ? 'toast--removing' : ''} ${toast.onClick ? 'toast--clickable' : ''}`}
      onClick={handleClick}
      role="alert"
      aria-live="polite"
    >
      <div className="toast__icon">
        <Icon size={20} />
      </div>
      
      <div className="toast__content">
        {toast.title && (
          <div className="toast__title">{toast.title}</div>
        )}
        <div className="toast__message">{toast.message}</div>
      </div>

      {toast.closeable && (
        <button 
          className="toast__close"
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          aria-label="Bildirimi kapat"
        >
          <X size={16} />
        </button>
      )}

      {!toast.persistent && toast.duration > 0 && (
        <div 
          className="toast__progress"
          style={{ 
            animationDuration: `${toast.duration}ms`,
            animationPlayState: isRemoving ? 'paused' : 'running'
          }}
        />
      )}
    </div>
  );
};

export default Toast; 