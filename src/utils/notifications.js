// Standalone toast notification system
let toasts = [];
let toastId = 0;
let listeners = [];

// Toast container'ı DOM'a ekle
const createToastContainer = () => {
  if (document.getElementById('toast-container')) return;
  
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  `;
  document.body.appendChild(container);
};

// Toast elementi oluştur
const createToastElement = (toast) => {
  const element = document.createElement('div');
  element.className = `toast toast-${toast.type}`;
  element.style.cssText = `
    background: var(--card-bg, #ffffff);
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 8px;
    padding: 12px 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    min-width: 300px;
    max-width: 400px;
    pointer-events: auto;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    line-height: 1.4;
  `;

  // Type'a göre renk
  const colors = {
    success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
    error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' },
    warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' },
    info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' }
  };

  if (colors[toast.type]) {
    const color = colors[toast.type];
    element.style.backgroundColor = color.bg;
    element.style.borderColor = color.border;
    element.style.color = color.text;
  }

  // İkon ekle
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  element.innerHTML = `
    <span style="font-weight: bold; font-size: 16px;">${icons[toast.type] || 'ℹ'}</span>
    <span style="flex: 1;">${toast.message}</span>
    ${toast.closeable !== false ? '<button style="background: none; border: none; cursor: pointer; padding: 0; margin-left: 8px; font-size: 16px; opacity: 0.7;">×</button>' : ''}
  `;

  // Kapatma butonu
  const closeBtn = element.querySelector('button');
  if (closeBtn) {
    closeBtn.onclick = () => removeToast(toast.id);
  }

  // Animasyon
  setTimeout(() => {
    element.style.transform = 'translateX(0)';
  }, 10);

  return element;
};

// DOM'dan toast'ı kaldır
const removeToastFromDOM = (toastId) => {
  const container = document.getElementById('toast-container');
  if (container) {
    const element = container.querySelector(`[data-toast-id="${toastId}"]`);
    if (element) {
      element.style.transform = 'translateX(100%)';
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
  createToastContainer();
  
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
  
  // DOM'a ekle
  const container = document.getElementById('toast-container');
  const element = createToastElement(toast);
  element.setAttribute('data-toast-id', id);
  container.appendChild(element);

  // Auto remove
  if (!toast.persistent && toast.duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, toast.duration);
  }

  // Listeners'ı bilgilendir
  listeners.forEach(listener => listener(toasts));

  return id;
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