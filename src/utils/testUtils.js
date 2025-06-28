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
          const validSteps = testData.steps.filter(step => {
            const hasBasicFields = step.id && step.type && step.name && step.config;
            const hasValidConfig = step.config && typeof step.config === 'object';
            
            // Navigate adımı için URL kontrolü
            if (step.type === 'navigate') {
              const hasUrl = step.config.url && step.config.url.trim() !== '';
              if (!hasUrl) {
                console.warn(`Navigate adımı URL eksik:`, step);
                console.warn(`Step config:`, step.config);
                return false; // URL yoksa adımı geçersiz say
              }
              return hasBasicFields && hasValidConfig;
            }
            
            return hasBasicFields && hasValidConfig;
          }).map((step, index) => ({
            ...step,
            icon: getIconForType(step.type), // Icon'u type'a göre yeniden ata
            id: Date.now() + index + Math.random(), // ID'yi yeniden oluştur (benzersiz)
            config: { 
              ...step.config,
              // Navigate adımı için URL'in korunduğundan emin ol
              ...(step.type === 'navigate' && step.config.url && { url: step.config.url }),
              // Diğer adım tipleri için de önemli alanları koru
              ...(step.type === 'click' && step.config.selector && { selector: step.config.selector }),
              ...(step.type === 'input' && step.config.selector && step.config.text !== undefined && { 
                selector: step.config.selector, 
                text: step.config.text 
              }),
              ...(step.type === 'wait' && step.config.duration && { duration: step.config.duration }),
              ...(step.type === 'verify' && step.config.selector && { selector: step.config.selector })
            }
          })).filter(step => step.icon !== null); // Geçersiz type'ları filtrele

          if (validSteps.length !== testData.steps.length) {
            const skippedCount = testData.steps.length - validSteps.length;
            console.warn(`${skippedCount} adım geçersiz olduğu için atlandı`);
            console.warn('Geçerli adımlar:', validSteps);
            console.warn('Ham adımlar:', testData.steps);
          }

          const importedData = {
            testName: testData.testName,
            steps: validSteps,
            browser: testData.browser || 'chrome'
          };



          if (onImportSuccess) {
            onImportSuccess(importedData);
          }
          
          // Bildirim gösterme işlemi çağıran tarafın sorumluluğunda
          // toast.importSuccess(testData.testName, validSteps.length);
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