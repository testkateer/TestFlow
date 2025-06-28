import { getFromStorage, setToStorage } from './storageUtils';
import { formatDate, formatTime } from './dateUtils';
import { toast } from './notifications';

// Test raporu kaydetme - ortak fonksiyon
export const saveTestReportToStorage = (testResult, testData) => {
  try {
    // Mevcut raporları al - storage utility kullan
    const existingReports = getFromStorage('testReports', []);
    
    // Test durumunu daha detaylı analiz et
    const totalSteps = testResult.totalSteps || (testData.steps ? testData.steps.length : 0);
    const successfulSteps = testResult.successfulSteps || 0;
    const completedSteps = testResult.completedSteps || (testResult.results ? testResult.results.length : 0);
    
    // Test durumunu belirle:
    // - Tüm adımlar tamamlandı ve başarılıysa: success
    // - Adımlar başarısız oldu veya tamamlanamadıysa: error
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
    
    // Yeni raporu listeye ekle (en yeni en başta)
    existingReports.unshift(newReport);
    
    // Maksimum 100 rapor tut (performans için)
    if (existingReports.length > 100) {
      existingReports.splice(100);
    }
    
    // localStorage'a kaydet - storage utility kullan
    setToStorage('testReports', existingReports);
    
    return newReport;
  } catch (error) {
    console.error('Test raporu kaydetme hatası:', error);
    return null;
  }
};

// Test süresi hesaplama - ortak fonksiyon
export const calculateTestDuration = (testResult) => {
  if (!testResult.results || testResult.results.length === 0) {
    return '0s';
  }
  
  // İlk ve son adım arasındaki süreyi hesapla
  const firstStep = new Date(testResult.results[0].timestamp);
  const lastStep = new Date(testResult.results[testResult.results.length - 1].timestamp);
  const durationMs = lastStep - firstStep;
  
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  } else if (durationMs < 60000) {
    return `${Math.round(durationMs / 1000)}s`;
  } else {
    return `${Math.floor(durationMs / 60000)}m ${Math.round((durationMs % 60000) / 1000)}s`;
  }
};

// Test raporu indirme (Reports sayfasından)
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