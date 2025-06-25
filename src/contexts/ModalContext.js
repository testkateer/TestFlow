import React, { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};

let modalId = 0;

export const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState([]);

  const addModal = useCallback((modalConfig) => {
    const id = ++modalId;
    const modal = { id, ...modalConfig };
    setModals(prev => [...prev, modal]);
    return id;
  }, []);

  const removeModal = useCallback((id) => {
    setModals(prev => prev.filter(modal => modal.id !== id));
  }, []);

  const removeAllModals = useCallback(() => {
    setModals([]);
  }, []);

  const showConfirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      const modal = {
        type: 'confirm',
        title: options.title || 'Onayla',
        message: options.message || 'Bu işlemi yapmak istediğinizden emin misiniz?',
        confirmText: options.confirmText || 'Onayla',
        cancelText: options.cancelText || 'İptal',
        confirmVariant: options.confirmVariant || 'primary',
        cancelVariant: options.cancelVariant || 'secondary',
        onConfirm: () => {
          resolve(true);
        },
        onCancel: () => {
          resolve(false);
        },
        onClose: () => {
          resolve(false);
        },
        showCloseButton: options.showCloseButton !== false,
        closeOnEsc: options.closeOnEsc !== false,
        closeOnOverlay: options.closeOnOverlay !== false,
        width: options.width || 'auto',
        ...options
      };

      addModal(modal);
    });
  }, [addModal]);

  const showAlert = useCallback((options = {}) => {
    return new Promise((resolve) => {
      const modal = {
        type: 'alert',
        title: options.title || 'Bilgilendirme',
        message: options.message || '',
        confirmText: options.confirmText || 'Tamam',
        confirmVariant: options.confirmVariant || 'primary',
        onConfirm: () => {
          resolve(true);
        },
        onClose: () => {
          resolve(true);
        },
        showCloseButton: options.showCloseButton !== false,
        closeOnEsc: options.closeOnEsc !== false,
        closeOnOverlay: options.closeOnOverlay !== false,
        width: options.width || 'auto',
        ...options
      };

      addModal(modal);
    });
  }, [addModal]);

  const showCustomModal = useCallback((options = {}) => {
    return new Promise((resolve) => {
      const modal = {
        type: 'custom',
        onClose: () => {
          resolve(null);
        },
        showCloseButton: options.showCloseButton !== false,
        closeOnEsc: options.closeOnEsc !== false,
        closeOnOverlay: options.closeOnOverlay !== false,
        ...options
      };

      const id = addModal(modal);
      return { id, resolve };
    });
  }, [addModal]);

  const value = {
    modals,
    addModal,
    removeModal,
    removeAllModals,
    showConfirm,
    showAlert,
    showCustomModal
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
}; 