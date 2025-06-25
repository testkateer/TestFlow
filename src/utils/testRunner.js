// Test çalıştırma işlemleri için ortak fonksiyonlar

export const runTestWithHandling = async (testData, options = {}) => {
  const {
    onStart,
    onProgress,
    onSuccess,
    onError,
    onFinally
  } = options;

  try {
    // Test başlatma kontrolü
    if (!testData.steps || testData.steps.length === 0) {
      throw new Error('Test çalıştırmak için en az bir adım eklemelisiniz!');
    }

    if (onStart) onStart();

    // API çağrısı
    const response = await fetch('/api/run-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        testName: testData.testName || testData.name,
        steps: testData.steps
      })
    });
    
    // Server bağlantı kontrolü
    if (!response.ok) {
      throw new Error(`Server hatası: ${response.status} - ${response.statusText}`);
    }

    // Content-Type kontrolü
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Server JSON dönmedi. Yanıt: ${text.substring(0, 100)}...`);
    }
    
    const result = await response.json();
    
    if (onProgress) onProgress(result);
    
    // Test sonucunu analiz et
    const analysisResult = analyzeTestResult(result, testData);
    
    // Test raporu kaydetme işlemi ana sayfalarda yapılacak (duplicate önlemek için)
    
    if (analysisResult.isSuccess) {
      if (onSuccess) onSuccess(analysisResult.result);
      showSuccessMessage(analysisResult);
    } else {
      if (onError) onError(analysisResult.result);
      showErrorMessage(analysisResult);
    }
    
    return analysisResult;
    
  } catch (error) {
    console.error('Test çalıştırma hatası:', error);
    
    const errorResult = {
      success: false,
      error: error.message,
      testData
    };
    
    if (onError) onError(errorResult);
    
    // Hata mesajını göster
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      alert(`❌ Server bağlantı hatası!\n\nLütfen şunları kontrol edin:\n1. 'npm run server' komutu ile server'ı başlattınız mı?\n2. Server 3001 portunda çalışıyor mu?\n\nHata: ${error.message}`);
    } else {
      alert(`Test çalıştırma hatası: ${error.message}`);
    }
    
    return errorResult;
  } finally {
    if (onFinally) onFinally();
  }
};

// Test sonucunu analiz et
export const analyzeTestResult = (result, testData) => {
  const totalSteps = result.totalSteps || testData.steps.length;
  const successfulSteps = result.successfulSteps || 0;
  const completedSteps = result.completedSteps || (result.results ? result.results.length : 0);
  
  const isFullyCompleted = completedSteps === totalSteps;
  const isFullySuccessful = successfulSteps === totalSteps;
  const isSuccess = result.success && isFullyCompleted && isFullySuccessful;
  
  const finalStatus = isSuccess ? 'success' : 'error';
  const duration = calculateTestDuration(result);

  return {
    isSuccess,
    isFullyCompleted,
    isFullySuccessful,
    totalSteps,
    successfulSteps,
    completedSteps,
    finalStatus,
    duration,
    result
  };
};

// Test süresi hesaplama
export const calculateTestDuration = (testResult) => {
  if (!testResult.results || testResult.results.length === 0) {
    return '0s';
  }
  
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
};

// Test raporu kaydetme artık reportUtils.js'te yapılıyor

// Başarı mesajı göster
export const showSuccessMessage = (analysisResult) => {
  const { successfulSteps, totalSteps, completedSteps, isFullyCompleted } = analysisResult;
  
  if (isFullyCompleted && analysisResult.isFullySuccessful) {
    alert(`✅ Test başarıyla tamamlandı!\n\n📊 Sonuç: ${successfulSteps}/${totalSteps} adım başarılı`);
  } else if (!isFullyCompleted) {
    alert(`⚠️ Test tamamlanamadı!\n\n📊 Sonuç: ${completedSteps}/${totalSteps} adım tamamlandı\n✅ Başarılı: ${successfulSteps}\n❌ Başarısız: ${completedSteps - successfulSteps}`);
  } else {
    alert(`❌ Test başarısız!\n\n📊 Sonuç: ${successfulSteps}/${totalSteps} adım başarılı\n${analysisResult.result.error ? `\nHata: ${analysisResult.result.error}` : ''}`);
  }
};

// Hata mesajı göster
export const showErrorMessage = (analysisResult) => {
  if (analysisResult.isFullyCompleted) {
    showSuccessMessage(analysisResult); // Tamamlanmış ama başarısız
  } else {
    const { successfulSteps, totalSteps, completedSteps } = analysisResult;
    alert(`⚠️ Test tamamlanamadı!\n\n📊 Sonuç: ${completedSteps}/${totalSteps} adım tamamlandı\n✅ Başarılı: ${successfulSteps}\n❌ Başarısız: ${completedSteps - successfulSteps}`);
  }
}; 