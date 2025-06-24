    export const downloadTestReport = (report) => {
  try {
    // Test adım detaylarını .txt formatında oluştur
    const generateReportText = () => {
      const separator = '='.repeat(50);
      const stepSeparator = '-'.repeat(30);
      
      let reportText = `${separator}\n`;
      reportText += `TEST RAPORU\n`;
      reportText += `${separator}\n\n`;
      
      // Genel bilgiler
      reportText += `📊 GENEL BİLGİLER\n`;
      reportText += `${stepSeparator}\n`;
      reportText += `Test Adı: ${report.testName}\n`;
      reportText += `Açıklama: ${report.description}\n`;
      reportText += `Durum: ${report.status === 'success' ? '✅ Başarılı' : '❌ Başarısız'}\n`;
      reportText += `Tarih: ${report.date} ${report.time}\n`;
      reportText += `Süre: ${report.duration}\n`;
      reportText += `Tetikleyici: ${report.trigger}\n`;
      reportText += `Toplam Adım: ${report.totalSteps}\n`;
      reportText += `Başarılı Adım: ${report.passedSteps}\n`;
      reportText += `Başarısız Adım: ${report.totalSteps - report.passedSteps}\n`;
      reportText += `Başarı Oranı: ${Math.round((report.passedSteps / report.totalSteps) * 100)}%\n\n`;
      
      // Adım detayları
      reportText += `🔄 ADIM DETAYLARI\n`;
      reportText += `${stepSeparator}\n`;
      
      if (report.results && report.results.length > 0) {
        report.results.forEach((result, index) => {
          const stepNum = index + 1;
          const step = result.step || {};
          const stepResult = result.result || {};
          const status = stepResult.success ? '✅' : '❌';
          
          reportText += `\nAdım ${stepNum}: ${step.name || 'İsimsiz Adım'}\n`;
          reportText += `Tür: ${step.type || 'Bilinmiyor'}\n`;
          reportText += `Durum: ${status} ${stepResult.success ? 'Başarılı' : 'Başarısız'}\n`;
          reportText += `Açıklama: ${stepResult.message || step.config?.url || step.config?.selector || 'Açıklama yok'}\n`;
          
          if (!stepResult.success && stepResult.error) {
            reportText += `❌ Hata: ${stepResult.error}\n`;
          }
          
          reportText += `Zaman: ${new Date(result.timestamp).toLocaleString('tr-TR')}\n`;
        });
      } else {
        reportText += `\nAdım detayları bulunamadı.\n`;
      }
      
      reportText += `\n${separator}\n`;
      reportText += `Bu rapor TestFlow tarafından otomatik olarak oluşturulmuştur.\n`;
      reportText += `Oluşturma Zamanı: ${new Date().toLocaleString('tr-TR')}\n`;
      reportText += `${separator}\n`;
      
      return reportText;
    };

    // Dosya adını oluştur
    const fileName = `${report.testName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_${report.date.replace(/\./g, '-')}_rapor.txt`;
    
    // Dosyayı indir
    const reportContent = generateReportText();
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    // Başarı mesajı
    console.log(`✅ Test raporu başarıyla indirildi: ${fileName}`);
    
  } catch (error) {
    console.error('Rapor indirme hatası:', error);
    alert(`❌ Rapor indirme hatası: ${error.message}`);
  }
}; 