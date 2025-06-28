import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import '../../styles/main.css';

const Modal = ({ modal, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const modalRef = useRef();
  const previousFocusRef = useRef();

  const handleClose = useCallback(() => {
    if (isRemoving) return;
    
    setIsRemoving(true);
    setTimeout(() => {
      if (modal.onClose) {
        modal.onClose();
      }
      onClose(modal.id);
    }, 200);
  }, [isRemoving, modal, onClose]);

  useEffect(() => {
    // Store current focused element
    previousFocusRef.current = document.activeElement;
    
    // Show modal animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    return () => {
      clearTimeout(timer);
      // Restore body scroll
      document.body.style.overflow = '';
      // Restore focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && modal.closeOnEsc !== false) {
        handleClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEsc);
      // Focus the modal
      if (modalRef.current) {
        modalRef.current.focus();
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isVisible, modal.closeOnEsc, handleClose]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && modal.closeOnOverlay !== false) {
      handleClose();
    }
  };

  const handleConfirm = () => {
    if (modal.onConfirm) {
      modal.onConfirm();
    }
    onClose(modal.id);
  };

  const handleCancel = () => {
    if (modal.onCancel) {
      modal.onCancel();
    }
    onClose(modal.id);
  };

  return createPortal(
    <div 
      className={`modal-overlay ${isVisible ? 'modal-overlay--visible' : ''} ${isRemoving ? 'modal-overlay--removing' : ''}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={modal.title ? "modal-title" : undefined}
      aria-describedby={modal.message ? "modal-message" : undefined}
    >
      <div 
        ref={modalRef}
        className={`modal modal--${modal.type} ${modal.className || ''}`}
        style={{ width: modal.width }}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="modal__header">
          {modal.title && (
            <h2 id="modal-title" className="modal__title">
              {modal.title}
            </h2>
          )}
          
          {modal.showCloseButton !== false && (
            <button 
              className="modal__close"
              onClick={handleClose}
              aria-label="Kapat"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="modal__content">
          {modal.message && (
            <p id="modal-message" className="modal__message">
              {modal.message}
            </p>
          )}
          
          {modal.content && modal.content}
        </div>

        {/* Footer */}
        {(modal.type === 'confirm' || modal.type === 'alert') && (
          <div className="modal__footer">
            {modal.type === 'confirm' && (
              <button 
                className={`modal__button modal__button--${modal.cancelVariant || 'secondary'}`}
                onClick={handleCancel}
              >
                {modal.cancelText || 'İptal'}
              </button>
            )}
            
            <button 
              className={`modal__button modal__button--${modal.confirmVariant || 'primary'}`}
              onClick={handleConfirm}
              autoFocus
            >
              {modal.confirmText || (modal.type === 'confirm' ? 'Onayla' : 'Tamam')}
            </button>
          </div>
        )}

        {modal.customFooter && (
          <div className="modal__footer">
            {modal.customFooter}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal; 