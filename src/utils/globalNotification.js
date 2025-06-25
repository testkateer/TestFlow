// Global notification utilities that can be used in any utility file
// This module provides a way to show notifications without needing React context

let globalNotification = null;

export const setGlobalNotification = (notification) => {
  globalNotification = notification;
};

export const globalToast = {
  success: (message, options) => {
    if (globalNotification) {
      return globalNotification.showSuccess(message, options);
    }
    // Fallback to console if notification not available
    console.log('✅', message);
  },
  
  error: (message, options) => {
    if (globalNotification) {
      return globalNotification.showError(message, options);
    }
    // Fallback to console if notification not available
    console.error('❌', message);
  },
  
  warning: (message, options) => {
    if (globalNotification) {
      return globalNotification.showWarning(message, options);
    }
    // Fallback to console if notification not available
    console.warn('⚠️', message);
  },
  
  info: (message, options) => {
    if (globalNotification) {
      return globalNotification.showInfo(message, options);
    }
    // Fallback to console if notification not available
    console.info('ℹ️', message);
  }
};

export const globalNotify = {
  exportSuccess: (fileName) => {
    return globalToast.success(`Test akışı başarıyla dışa aktarıldı! Dosya: ${fileName}`);
  },
  
  exportError: (error) => {
    return globalToast.error(`Dışa aktarma hatası: ${error}`);
  },
  
  importSuccess: (testName, stepCount) => {
    return globalToast.success(`Test akışı içe aktarıldı! ${testName} - ${stepCount} adım`);
  },
  
  importError: (error) => {
    return globalToast.error(`İçe aktarma hatası: ${error}. Dosyanın geçerli bir test akışı JSON dosyası olduğundan emin olun.`);
  },
  
  serverError: () => {
    return globalToast.error('Server bağlantı hatası! Server\'ın çalıştığından emin olun (npm run server).');
  },
  
  testRunError: (error) => {
    return globalToast.error(`Test çalıştırma hatası: ${error}`);
  },
  
  reportDownloadError: () => {
    return globalToast.error('Rapor indirilirken bir hata oluştu.');
  }
}; 