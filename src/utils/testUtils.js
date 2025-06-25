// Test akışları için ortak import/export fonksiyonları

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
    
    alert(`✅ Test akışı başarıyla dışa aktarıldı!\nDosya adı: ${link.download}`);
    return true;
  } catch (error) {
    console.error('Dışa aktarma hatası:', error);
    alert(`❌ Dışa aktarma hatası: ${error.message}`);
    return false;
  }
};

export const importTestFlow = (stepTypes, onImportSuccess) => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (!file) {
        resolve(null);
        return;
      }

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
            console.warn('Bazı adımlar geçersiz olduğu için atlandı');
          }

          const importedData = {
            testName: testData.testName,
            steps: validSteps
          };

          if (onImportSuccess) {
            onImportSuccess(importedData);
          }
          
          alert(`✅ Test akışı başarıyla içe aktarıldı!\nTest adı: ${testData.testName}\nAdım sayısı: ${validSteps.length}`);
          resolve(importedData);
        } catch (error) {
          console.error('İçe aktarma hatası:', error);
          alert(`❌ İçe aktarma hatası: ${error.message}\n\nDosyanın geçerli bir test akışı JSON dosyası olduğundan emin olun.`);
          reject(error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}; 