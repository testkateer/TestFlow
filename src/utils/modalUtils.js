// Modal utility functions for easy access across the app

// These will be set by the ModalProvider
let modalContext = null;

export const setModalContext = (context) => {
  modalContext = context;
};

// Confirm dialog utilities
export const confirm = async (options) => {
  if (modalContext) {
    return await modalContext.showConfirm(options);
  }
  console.warn('Modal context not available');
  return false;
};

// Alert dialog utilities
export const alert = async (options) => {
  if (modalContext) {
    return await modalContext.showAlert(options);
  }
  console.warn('Modal context not available');
  return false;
};

// Custom modal utilities
export const modal = {
  show: async (options) => {
    if (modalContext) {
      return await modalContext.showCustomModal(options);
    }
    console.warn('Modal context not available');
    return null;
  },

  close: (id) => {
    if (modalContext) {
      return modalContext.removeModal(id);
    }
    console.warn('Modal context not available');
  },

  closeAll: () => {
    if (modalContext) {
      return modalContext.removeAllModals();
    }
    console.warn('Modal context not available');
  }
};

// Common confirmation patterns
export const confirmActions = {
  // Delete confirmations
  delete: async (itemName = 'bu öğeyi') => {
    return await confirm({
      title: 'Silme Onayı',
      message: `${itemName} silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
      confirmText: 'Sil',
      cancelText: 'İptal',
      confirmVariant: 'danger'
    });
  },

  // Save confirmations
  save: async (message = 'Değişiklikleri kaydetmek istediğinizden emin misiniz?') => {
    return await confirm({
      title: 'Kaydet',
      message,
      confirmText: 'Kaydet',
      cancelText: 'İptal',
      confirmVariant: 'success'
    });
  },

  // Discard changes
  discardChanges: async () => {
    return await confirm({
      title: 'Değişiklikleri Gözardı Et',
      message: 'Kaydedilmemiş değişiklikleriniz var. Sayfadan ayrılmak istediğinizden emin misiniz?',
      confirmText: 'Ayrıl',
      cancelText: 'Kalmaya Devam Et',
      confirmVariant: 'warning'
    });
  },

  // Logout confirmation
  logout: async () => {
    return await confirm({
      title: 'Çıkış Yap',
      message: 'Oturumu kapatmak istediğinizden emin misiniz?',
      confirmText: 'Çıkış Yap',
      cancelText: 'İptal',
      confirmVariant: 'primary'
    });
  },

  // Reset/Clear confirmation
  reset: async (itemName = 'tüm verileri') => {
    return await confirm({
      title: 'Sıfırla',
      message: `${itemName} sıfırlamak istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
      confirmText: 'Sıfırla',
      cancelText: 'İptal',
      confirmVariant: 'warning'
    });
  }
};

// Common alert patterns
export const alerts = {
  success: async (title, message) => {
    return await alert({
      title: title || 'Başarılı',
      message,
      confirmVariant: 'success'
    });
  },

  error: async (title, message) => {
    return await alert({
      title: title || 'Hata',
      message,
      confirmVariant: 'danger'
    });
  },

  info: async (title, message) => {
    return await alert({
      title: title || 'Bilgilendirme',
      message,
      confirmVariant: 'primary'
    });
  },

  warning: async (title, message) => {
    return await alert({
      title: title || 'Uyarı',
      message,
      confirmVariant: 'warning'
    });
  }
}; 