// Test akışları için ortak import/export fonksiyonları
import { toast } from './notifications';

export const exportTestFlow = (testData, fileName) => {
  try {
    const exportData = {
      testName: testData.testName || testData.name,
      steps: testData.steps || [],
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `${exportData.testName.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    toast.exportSuccess(link.download);
    return true;
  } catch (error) {
    console.error('Dışa aktarma hatası:', error);
    toast.exportError(error.message);
    return false;
  }
};

export const importTestFlow = (stepTypes, onImportSuccess, customFile = null) => {
  return new Promise((resolve, reject) => {
    // Eğer özel bir dosya verilmişse, direkt onu kullan
    if (customFile) {
      processFile(customFile);
      return;
    }

    // Özel dosya yoksa, dosya seçme diyaloğunu göster
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (!file) {
        resolve(null);
        return;
      }

      processFile(file);
    };
    input.click();

    // Dosya işleme fonksiyonu
    function processFile(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const testData = JSON.parse(e.target.result);
          
          // Veri doğrulama
          if (!testData.testName || !Array.isArray(testData.steps)) {
            throw new Error('Geçersiz test dosyası formatı');
          }

          // Icon mapping için stepTypes'ı kullan
          const getIconForType = (stepType) => {
            const stepTypeObj = stepTypes.find(st => st.id === stepType);
            return stepTypeObj ? stepTypeObj.icon : null;
          };

          // Adım verilerini doğrula ve icon'ları düzelt
          const validSteps = testData.steps.filter(step => 
            step.id && step.type && step.name && step.config
          ).map(step => ({
            ...step,
            icon: getIconForType(step.type), // Icon'u type'a göre yeniden ata
            id: Date.now() + Math.random() // ID'yi yeniden oluştur
          })).filter(step => step.icon !== null); // Geçersiz type'ları filtrele

          if (validSteps.length !== testData.steps.length) {
            // ... existing code ...
          }

          const importedData = {
            testName: testData.testName,
            steps: validSteps,
            browser: testData.browser || 'chrome'
          };

          if (onImportSuccess) {
            onImportSuccess(importedData);
          }
          
          toast.importSuccess(testData.testName, validSteps.length);
          resolve(importedData);
        } catch (error) {
          console.error('İçe aktarma hatası:', error);
          toast.importError(error.message);
          reject(error);
        }
      };
      reader.readAsText(file);
    }
  });
}; 