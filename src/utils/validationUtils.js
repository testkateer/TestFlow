// Validation işlemleri için ortak fonksiyonlar

// Test adı validation
export const validateTestName = (name) => {
  const errors = [];
  
  if (!name || !name.trim()) {
    errors.push('Test adı boş olamaz');
  } else if (name.trim().length < 3) {
    errors.push('Test adı en az 3 karakter olmalıdır');
  } else if (name.trim().length > 100) {
    errors.push('Test adı en fazla 100 karakter olabilir');
  }
  
  // Geçersiz karakterler kontrolü
  const invalidChars = /[<>:"/\\|?*]/g;
  if (invalidChars.test(name)) {
    errors.push('Test adı geçersiz karakterler içeriyor (< > : " / \\ | ? *)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Test adımları validation
export const validateTestSteps = (steps) => {
  const errors = [];
  
  if (!steps || !Array.isArray(steps)) {
    errors.push('Test adımları geçerli bir liste olmalıdır');
    return { isValid: false, errors };
  }
  
  if (steps.length === 0) {
    errors.push('En az bir test adımı eklemelisiniz');
  } else if (steps.length > 50) {
    errors.push('Maksimum 50 test adımı ekleyebilirsiniz');
  }
  
  // Her adımı kontrol et
  steps.forEach((step, index) => {
    const stepErrors = validateTestStep(step, index + 1);
    if (!stepErrors.isValid) {
      errors.push(...stepErrors.errors);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Tek bir test adımı validation
export const validateTestStep = (step, stepNumber = 1) => {
  const errors = [];
  
  if (!step || typeof step !== 'object') {
    errors.push(`Adım ${stepNumber}: Geçersiz adım verisi`);
    return { isValid: false, errors };
  }
  
  // Temel alanlar kontrolü
  if (!step.type) {
    errors.push(`Adım ${stepNumber}: Adım tipi belirtilmeli`);
  }
  
  if (!step.name || !step.name.trim()) {
    errors.push(`Adım ${stepNumber}: Adım adı boş olamaz`);
  }
  
  if (!step.config || typeof step.config !== 'object') {
    errors.push(`Adım ${stepNumber}: Adım konfigürasyonu gerekli`);
  } else {
    // Tip özelinde validation
    const configErrors = validateStepConfig(step.type, step.config, stepNumber);
    if (!configErrors.isValid) {
      errors.push(...configErrors.errors);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Adım konfigürasyonu validation
export const validateStepConfig = (stepType, config, stepNumber = 1) => {
  const errors = [];
  
  switch (stepType) {
    case 'navigate':
      if (!config.url || !config.url.trim()) {
        errors.push(`Adım ${stepNumber}: URL adresi boş olamaz`);
      } else if (!isValidUrl(config.url)) {
        errors.push(`Adım ${stepNumber}: Geçerli bir URL adresi girin`);
      }
      break;
      
    case 'click':
    case 'verify':
      if (!config.selector || !config.selector.trim()) {
        errors.push(`Adım ${stepNumber}: Element seçici boş olamaz`);
      } else if (!isValidSelector(config.selector)) {
        errors.push(`Adım ${stepNumber}: Geçerli bir CSS seçici girin`);
      }
      break;
      
    case 'input':
      if (!config.selector || !config.selector.trim()) {
        errors.push(`Adım ${stepNumber}: Element seçici boş olamaz`);
      } else if (!isValidSelector(config.selector)) {
        errors.push(`Adım ${stepNumber}: Geçerli bir CSS seçici girin`);
      }
      
      if (config.text === undefined || config.text === null) {
        errors.push(`Adım ${stepNumber}: Girilecek metin belirtilmeli`);
      }
      break;
      
    case 'wait':
      if (!config.duration || isNaN(config.duration)) {
        errors.push(`Adım ${stepNumber}: Bekleme süresi sayı olmalıdır`);
      } else if (config.duration < 100) {
        errors.push(`Adım ${stepNumber}: Bekleme süresi en az 100ms olmalıdır`);
      } else if (config.duration > 30000) {
        errors.push(`Adım ${stepNumber}: Bekleme süresi en fazla 30 saniye olabilir`);
      }
      break;
      
    case 'refresh':
      // Refresh için özel validation gerekmiyor
      break;
      
    default:
      errors.push(`Adım ${stepNumber}: Bilinmeyen adım tipi (${stepType})`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// URL validation
export const isValidUrl = (url) => {
  try {
    // HTTP/HTTPS ile başlamıyorsa ekle
    const testUrl = url.startsWith('http') ? url : `https://${url}`;
    new URL(testUrl);
    return true;
  } catch {
    return false;
  }
};

// CSS seçici validation
export const isValidSelector = (selector) => {
  try {
    // Basit bir DOM sorgusu ile test et
    document.querySelector(selector);
    return true;
  } catch {
    return false;
  }
};

// E-mail validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Güçlü şifre validation
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    errors.push('Şifre boş olamaz');
  } else {
    if (password.length < 8) {
      errors.push('Şifre en az 8 karakter olmalıdır');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Şifre en az bir büyük harf içermelidir');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Şifre en az bir küçük harf içermelidir');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Şifre en az bir rakam içermelidir');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Test akışı validation (tam)
export const validateTestFlow = (testFlow) => {
  const errors = [];
  
  // Test adı kontrolü
  const nameValidation = validateTestName(testFlow.name || testFlow.testName);
  if (!nameValidation.isValid) {
    errors.push(...nameValidation.errors);
  }
  
  // Test adımları kontrolü
  const stepsValidation = validateTestSteps(testFlow.steps);
  if (!stepsValidation.isValid) {
    errors.push(...stepsValidation.errors);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Dosya adı validation
export const validateFileName = (fileName) => {
  const errors = [];
  
  if (!fileName || !fileName.trim()) {
    errors.push('Dosya adı boş olamaz');
  } else {
    // Geçersiz karakterler kontrolü
    const invalidChars = /[<>:"/\\|?*]/g;
    if (invalidChars.test(fileName)) {
      errors.push('Dosya adı geçersiz karakterler içeriyor');
    }
    
    if (fileName.trim().length > 255) {
      errors.push('Dosya adı en fazla 255 karakter olabilir');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 