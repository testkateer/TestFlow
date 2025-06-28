let notificationContext = null;

export const setNotificationContext = (context) => {
  notificationContext = context;
};

export const toast = {
  success: (message, options) => {
    if (notificationContext) {
      return notificationContext.showSuccess(message, options);
    }
    return null;
  },
  
  error: (message, options) => {
    if (notificationContext) {
      return notificationContext.showError(message, options);
    }
    return null;
  },
  
  warning: (message, options) => {
    if (notificationContext) {
      return notificationContext.showWarning(message, options);
    }
    return null;
  },
  
  info: (message, options) => {
    if (notificationContext) {
      return notificationContext.showInfo(message, options);
    }
    return null;
  },

  show: (message, type = 'info', options) => {
    if (notificationContext) {
      return notificationContext.addToast(message, type, options);
    }
    return null;
  },

  remove: (id) => {
    if (notificationContext) {
      return notificationContext.removeToast(id);
    }
  },

  clear: () => {
    if (notificationContext) {
      return notificationContext.clearAll();
    }
  },
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
  },
  
  canceled: (operation = 'İşlem') => {
    return toast.info(`${operation} iptal edildi.`, { duration: 3000 });
  },

  // Test specific notifications
  exportSuccess: (fileName) => {
    return toast.success(`Test akışı başarıyla dışa aktarıldı! Dosya: ${fileName}`);
  },
  
  exportError: (error) => {
    return toast.error(`Dışa aktarma hatası: ${error}`);
  },
  
  importSuccess: (testName, stepCount) => {
    return toast.success(`Test akışı içe aktarıldı! ${testName} - ${stepCount} adım`);
  },
  
  importError: (error) => {
    return toast.error(`İçe aktarma hatası: ${error}. Dosyanın geçerli bir test akışı JSON dosyası olduğundan emin olun.`);
  },
  
  importCanceled: () => {
    return toast.info('Test içeri aktarma işlemi iptal edildi', { duration: 3000 });
  },
  
  serverError: () => {
    return toast.error('Server bağlantı hatası! Server\'ın çalıştığından emin olun (npm run server).');
  },
  
  testRunError: (error) => {
    return toast.error(`Test çalıştırma hatası: ${error}`);
  },
  
  reportDownloadError: () => {
    return toast.error('Rapor indirilirken bir hata oluştu.');
  }
}; 