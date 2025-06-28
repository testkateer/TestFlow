// LocalStorage işlemleri için ortak fonksiyonlar

// Güvenli localStorage okuma
export function getFromStorage(key, defaultValue = null) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage for key '${key}':`, error);
    return defaultValue;
  }
}

// Güvenli localStorage yazma
export const setToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Storage yazma hatası (${key}):`, error);
    return false;
  }
};

// Test akışları yönetimi
export const getTestFlows = () => {
  return getFromStorage('savedTestFlows', []);
};

export const saveTestFlows = (testFlows) => {
  return setToStorage('savedTestFlows', testFlows);
};

export const addTestFlow = (testFlow) => {
  const existingFlows = getTestFlows();
  const newTestFlow = {
    id: Date.now(),
    ...testFlow,
    createdAt: new Date().toISOString(),
    lastRun: 'Hiç çalışmadı',
    status: 'pending',
    browser: testFlow.browser || 'chrome',
    duration: '--',
    type: testFlow.type || 'manual'
  };
  
  existingFlows.push(newTestFlow);
  return saveTestFlows(existingFlows) ? newTestFlow : null;
};

export const updateTestFlow = (testId, updates) => {
  const existingFlows = getTestFlows();
  const index = existingFlows.findIndex(flow => flow.id === testId);
  
  if (index !== -1) {
    existingFlows[index] = {
      ...existingFlows[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return saveTestFlows(existingFlows) ? existingFlows[index] : null;
  }
  return null;
};

export const deleteTestFlow = (testId) => {
  const existingFlows = getTestFlows();
  const filteredFlows = existingFlows.filter(flow => flow.id !== testId);
  return saveTestFlows(filteredFlows);
};

// Test raporları yönetimi
export const getTestReports = () => {
  return getFromStorage('testReports', []);
};

export const saveTestReports = (reports) => {
  return setToStorage('testReports', reports);
};

export const addTestReport = (report, maxReports = 100) => {
  const existingReports = getTestReports();
  
  const newReport = {
    id: Date.now(),
    ...report,
    timestamp: new Date().toISOString()
  };
  
  // Yeni raporu en başa ekle
  existingReports.unshift(newReport);
  
  // Maksimum rapor sayısını aş
  if (existingReports.length > maxReports) {
    existingReports.splice(maxReports);
  }
  
  return saveTestReports(existingReports) ? newReport : null;
};

// Geçici veriler yönetimi
export const setTempData = (key, data) => {
  return setToStorage(`temp_${key}`, data);
};

export const getTempData = (key, removeAfterGet = true) => {
  const tempKey = `temp_${key}`;
  const data = getFromStorage(tempKey);
  
  if (removeAfterGet && data) {
    localStorage.removeItem(tempKey);
  }
  
  return data;
};

export const clearTempData = (key) => {
  localStorage.removeItem(`temp_${key}`);
};

// Tüm uygulama verilerini temizle
export const clearAllAppData = () => {
  const keys = ['savedTestFlows', 'testReports'];
  keys.forEach(key => localStorage.removeItem(key));
  
  // Geçici verileri de temizle
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('temp_')) {
      localStorage.removeItem(key);
    }
  });
};

// Veri yedekleme ve geri yükleme
export const exportAllData = () => {
  const data = {
    testFlows: getTestFlows(),
    testReports: getTestReports(),
    exportDate: new Date().toISOString(),
    version: '1.0'
  };
  
  return data;
};

export const importAllData = (data) => {
  try {
    if (data.testFlows) {
      saveTestFlows(data.testFlows);
    }
    
    if (data.testReports) {
      saveTestReports(data.testReports);
    }
    
    return true;
  } catch (error) {
    console.error('Veri import hatası:', error);
    return false;
  }
}; 