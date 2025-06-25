// Notification utility functions for easy access across the app

// These will be set by the NotificationProvider
let notificationContext = null;

export const setNotificationContext = (context) => {
  notificationContext = context;
};

// Toast notification utilities
export const toast = {
  success: (message, options) => {
    if (notificationContext) {
      return notificationContext.showSuccess(message, options);
    }
    console.warn('Notification context not available');
  },
  
  error: (message, options) => {
    if (notificationContext) {
      return notificationContext.showError(message, options);
    }
    console.warn('Notification context not available');
  },
  
  warning: (message, options) => {
    if (notificationContext) {
      return notificationContext.showWarning(message, options);
    }
    console.warn('Notification context not available');
  },
  
  info: (message, options) => {
    if (notificationContext) {
      return notificationContext.showInfo(message, options);
    }
    console.warn('Notification context not available');
  },

  // Custom toast with full options
  show: (message, type = 'info', options) => {
    if (notificationContext) {
      return notificationContext.addToast(message, type, options);
    }
    console.warn('Notification context not available');
  },

  // Remove specific toast
  remove: (id) => {
    if (notificationContext) {
      return notificationContext.removeToast(id);
    }
    console.warn('Notification context not available');
  },

  // Clear all toasts
  clear: () => {
    if (notificationContext) {
      return notificationContext.clearAll();
    }
    console.warn('Notification context not available');
  }
};

// Common notification patterns - use functions instead of object methods to avoid hoisting issues
export const notify = {
  // Success patterns
  saveSuccess: (itemName = 'Öğe') => {
    return toast.success(`${itemName} başarıyla kaydedildi!`);
  },
  
  deleteSuccess: (itemName = 'Öğe') => {
    return toast.success(`${itemName} başarıyla silindi!`);
  },
  
  updateSuccess: (itemName = 'Öğe') => {
    return toast.success(`${itemName} başarıyla güncellendi!`);
  },

  // Error patterns
  saveError: (itemName = 'Öğe') => {
    return toast.error(`${itemName} kaydedilirken bir hata oluştu!`);
  },
  
  deleteError: (itemName = 'Öğe') => {
    return toast.error(`${itemName} silinirken bir hata oluştu!`);
  },
  
  updateError: (itemName = 'Öğe') => {
    return toast.error(`${itemName} güncellenirken bir hata oluştu!`);
  },
  
  networkError: () => {
    return toast.error('Ağ bağlantısı hatası. Lütfen tekrar deneyin!');
  },
  
  permissionError: () => {
    return toast.error('Bu işlem için yetkiniz bulunmamaktadır!');
  },

  // Warning patterns
  unsavedChanges: () => {
    return toast.warning('Kaydedilmemiş değişiklikleriniz var!');
  },
  
  formValidation: (message = 'Lütfen tüm gerekli alanları doldurun!') => {
    return toast.warning(message);
  },

  // Info patterns
  loading: (message = 'İşlem gerçekleştiriliyor...') => {
    return toast.info(message, { persistent: true });
  },
  
  copied: () => {
    return toast.info('Panoya kopyalandı!', { duration: 2000 });
  }
}; 