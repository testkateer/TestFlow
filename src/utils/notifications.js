// Standalone toast notification system
let toasts = [];
let toastId = 0;
let listeners = [];

// Toast container'ı DOM'a ekle
const createToastContainer = () => {
  if (document.getElementById('toast-container')) {
    console.log('Toast container already exists');
    return;
  }
  
  console.log('Creating toast container');
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);
  console.log('Toast container created and added to DOM');
};

// Toast elementi oluştur
const createToastElement = (toast) => {
  try {
    console.log('Creating toast element for:', toast);
    const element = document.createElement('div');
    element.className = `toast toast--${toast.type} toast--visible`;

    // İkon ekle
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    element.innerHTML = `
      <span class="toast__icon">${icons[toast.type] || 'ℹ'}</span>
      <span class="toast__message">${toast.message}</span>
      ${toast.closeable !== false ? '<button class="toast__close">×</button>' : ''}
    `;

    // Kapatma butonu
    const closeBtn = element.querySelector('.toast__close');
    if (closeBtn) {
      closeBtn.onclick = () => removeToast(toast.id);
    }

    console.log('Toast element created successfully:', element);
    return element;
  } catch (error) {
    console.error('Error creating toast element:', error);
    // Fallback basit element
    const fallbackElement = document.createElement('div');
    fallbackElement.textContent = toast.message;
    fallbackElement.style.cssText = `
      background: #f0f0f0;
      padding: 10px;
      margin: 5px;
      border-radius: 4px;
      border: 1px solid #ccc;
    `;
    return fallbackElement;
  }
};

// DOM'dan toast'ı kaldır
const removeToastFromDOM = (toastId) => {
  const container = document.getElementById('toast-container');
  if (container) {
    const element = container.querySelector(`[data-toast-id="${toastId}"]`);
    if (element) {
      element.classList.add('toast--removing');
      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }, 300);
    }
  }
};

// Toast ekle
const addToast = (message, type = 'info', options = {}) => {
  try {
    console.log('Adding toast:', { message, type, options });
    
    const id = ++toastId;
    const toast = {
      id,
      message,
      type,
      duration: options.duration || (type === 'error' ? 6000 : 4000),
      closeable: options.closeable !== false,
      persistent: options.persistent || false,
      ...options
    };

    toasts.push(toast);
    
    console.log('Toast added to state:', toast);

    // Auto remove
    if (!toast.persistent && toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    // Listeners'ı bilgilendir (React bileşeni için)
    listeners.forEach(listener => listener(toasts));

    // Fallback: DOM manipülasyonu (eski sistem için)
    createToastContainer();
    const container = document.getElementById('toast-container');
    if (container) {
      const element = createToastElement(toast);
      element.setAttribute('data-toast-id', id);
      container.appendChild(element);
      console.log('Toast added to DOM as fallback:', element);
    }

    return id;
  } catch (error) {
    console.error('Error adding toast:', error);
    return null;
  }
};

// Toast kaldır
const removeToast = (id) => {
  toasts = toasts.filter(toast => toast.id !== id);
  removeToastFromDOM(id);
  listeners.forEach(listener => listener(toasts));
};

// Tüm toast'ları temizle
const clearAll = () => {
  toasts.forEach(toast => removeToastFromDOM(toast.id));
  toasts = [];
  listeners.forEach(listener => listener(toasts));
};

// Listener ekle (React bileşenleri için)
const addListener = (listener) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};

export const toast = {
  success: (message, options) => addToast(message, 'success', options),
  error: (message, options) => addToast(message, 'error', { duration: 6000, ...options }),
  warning: (message, options) => addToast(message, 'warning', options),
  info: (message, options) => addToast(message, 'info', options),
  show: (message, type = 'info', options) => addToast(message, type, options),
  remove: removeToast,
  clear: clearAll,
  addListener,

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

// Geriye dönük uyumluluk için
export const setNotificationContext = () => {
  console.warn('setNotificationContext is deprecated - notifications now work standalone');
}; 