// Merkezi veri işleme ve storage yönetimi
import { formatDate, formatTime } from './dateUtils';
import { toast } from './notifications';

// ===========================================
// CORE STORAGE FUNCTIONS
// ===========================================

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

// ===========================================
// TEMPORARY DATA MANAGEMENT
// ===========================================

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

// ===========================================
// DATA EXPORT/IMPORT UTILITIES
// ===========================================

// Tüm uygulama verilerini dışa aktar
export const exportAllData = () => {
  const data = {
    testFlows: getFromStorage('savedTestFlows', []),
    testReports: getFromStorage('testReports', []),
    scheduledTests: getFromStorage('scheduledTests', []),
    userSettings: getFromStorage('userSettings', {}),
    exportDate: new Date().toISOString(),
    version: '2.0'
  };
  
  return data;
};

// Tüm uygulama verilerini içe aktar
export const importAllData = (data) => {
  try {
    if (data.testFlows) {
      setToStorage('savedTestFlows', data.testFlows);
    }
    
    if (data.testReports) {
      setToStorage('testReports', data.testReports);
    }
    
    if (data.scheduledTests) {
      setToStorage('scheduledTests', data.scheduledTests);
    }
    
    if (data.userSettings) {
      setToStorage('userSettings', data.userSettings);
    }
    
    return true;
  } catch (error) {
    console.error('Veri import hatası:', error);
    return false;
  }
};

// Tüm uygulama verilerini temizle
export const clearAllAppData = () => {
  const keys = ['savedTestFlows', 'testReports', 'scheduledTests', 'activeRunningTests', 'userSettings'];
  keys.forEach(key => localStorage.removeItem(key));
  
  // Geçici verileri de temizle
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('temp_')) {
      localStorage.removeItem(key);
    }
  });
};

// ===========================================
// TEST REPORT PROCESSING
// ===========================================

// Test süresi hesaplama
export const calculateTestDuration = (testResult) => {
  if (!testResult) return '0s';
  
  // Eğer duration zaten varsa onu kullan
  if (testResult.duration) {
    return testResult.duration;
  }
  
  // Results varsa timestamp'lerden hesapla
  if (testResult.results && testResult.results.length > 0) {
    try {
      const firstStep = new Date(testResult.results[0].timestamp);
      const lastStep = new Date(testResult.results[testResult.results.length - 1].timestamp);
      const durationMs = lastStep - firstStep;
      
      if (durationMs < 1000) {
        return `${durationMs}ms`;
      } else if (durationMs < 60000) {
        return `${Math.round(durationMs / 1000)}s`;
      } else {
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.round((durationMs % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
      }
    } catch (error) {
      console.error('Süre hesaplama hatası:', error);
      return '0s';
    }
  }
  
  // Fallback
  return '0s';
};

// Test raporunu formatla
export const formatTestReport = (report) => {
  return {
    ...report,
    formattedDate: formatDate(new Date(report.timestamp)),
    formattedTime: formatTime(new Date(report.timestamp)),
    successRate: report.totalSteps > 0 ? Math.round((report.passedSteps / report.totalSteps) * 100) : 0
  };
};

// Test raporu istatistikleri hesapla
export const calculateReportStats = (reports) => {
  if (!reports || reports.length === 0) {
    return {
      total: 0,
      successful: 0,
      failed: 0,
      successRate: 0,
      avgDuration: '0s'
    };
  }
  
  const total = reports.length;
  const successful = reports.filter(r => r.status === 'success').length;
  const failed = total - successful;
  const successRate = Math.round((successful / total) * 100);
  
  // Ortalama süre hesapla (basit yaklaşım)
  const avgDuration = '~30s'; // Gerçek hesaplama için duration parse edilmeli
  
  return {
    total,
    successful,
    failed,
    successRate,
    avgDuration
  };
};

// Test raporu indirme
export const downloadTestReport = (report) => {
  try {
    const reportData = {
      testName: report.testName,
      status: report.status,
      duration: report.duration,
      date: report.date,
      time: report.time,
      passedSteps: report.passedSteps,
      totalSteps: report.totalSteps,
      completedSteps: report.completedSteps,
      trigger: report.trigger,
      results: report.results || [],
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.testName.replace(/\s+/g, '_')}_rapor.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return report;
  } catch (error) {
    console.error('Rapor indirme hatası:', error);
    toast.reportDownloadError();
    return null;
  }
};

// ===========================================
// DEPRECATED FUNCTIONS (Geriye dönük uyumluluk)
// ===========================================

// DEPRECATED: Test akışları yönetimi artık TestFlowContext tarafından yapılıyor
export const getTestFlows = () => {
  console.warn('getTestFlows deprecated - use TestFlowContext instead');
  return getFromStorage('savedTestFlows', []);
};

export const saveTestFlows = (testFlows) => {
  console.warn('saveTestFlows deprecated - use TestFlowContext instead');
  return setToStorage('savedTestFlows', testFlows);
};

export const addTestFlow = (testFlow) => {
  console.warn('addTestFlow deprecated - use TestFlowContext.addTestFlow instead');
  return null;
};

export const updateTestFlow = (testId, updates) => {
  console.warn('updateTestFlow deprecated - use TestFlowContext.updateTestFlow instead');
  return null;
};

export const deleteTestFlow = (testId) => {
  console.warn('deleteTestFlow deprecated - use TestFlowContext.deleteTestFlow instead');
  return false;
};

// DEPRECATED: Test raporları yönetimi artık TestFlowContext tarafından yapılıyor
export const getTestReports = () => {
  console.warn('getTestReports deprecated - use TestFlowContext instead');
  return getFromStorage('testReports', []);
};

export const saveTestReports = (reports) => {
  console.warn('saveTestReports deprecated - use TestFlowContext instead');
  return setToStorage('testReports', reports);
};

export const addTestReport = (report, maxReports = 100) => {
  console.warn('addTestReport deprecated - use TestFlowContext.addTestReport instead');
  return null;
};

export const saveTestReportToStorage = (testResult, testData) => {
  console.warn('saveTestReportToStorage deprecated - use TestFlowContext.addTestReport instead');
  
  try {
    // Mevcut raporları al
    const existingReports = getFromStorage('testReports', []);
    
    // Test durumunu analiz et
    const totalSteps = testResult.totalSteps || (testData.steps ? testData.steps.length : 0);
    const successfulSteps = testResult.successfulSteps || 0;
    const completedSteps = testResult.completedSteps || (testResult.results ? testResult.results.length : 0);
    
    const isSuccess = testResult.success && 
                     (completedSteps === totalSteps) && 
                     (successfulSteps === totalSteps);
    
    // Yeni rapor verisi oluştur
    const newReport = {
      id: Date.now(),
      testName: testData.testName || testData.name || 'İsimsiz Test',
      description: `${totalSteps} adımlı test akışı`,
      status: isSuccess ? 'success' : 'error',
      duration: testResult.duration || calculateTestDuration(testResult),
      date: formatDate(new Date()),
      time: formatTime(new Date()),
      passedSteps: successfulSteps,
      totalSteps: totalSteps,
      completedSteps: completedSteps,
      trigger: 'Manuel',
      results: testResult.results || [],
      timestamp: new Date().toISOString()
    };
    
    // Yeni raporu listeye ekle
    existingReports.unshift(newReport);
    
    // Maksimum 100 rapor tut
    if (existingReports.length > 100) {
      existingReports.splice(100);
    }
    
    setToStorage('testReports', existingReports);
    
    return newReport;
  } catch (error) {
    console.error('Test raporu kaydetme hatası:', error);
    toast.saveError('Test raporu');
    return null;
  }
};