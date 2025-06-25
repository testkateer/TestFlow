import { globalNotify, globalToast } from './globalNotification';

// Test çalıştırma işlemleri için ortak fonksiyonlar

export const runTestWithHandling = async (testData, options = {}) => {
  const {
    onStart,
    onProgress,
    onSuccess,
    onError,
    onFinally
  } = options;

  // Test ID oluştur
  const testId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  try {
    // Test başlatma kontrolü
    if (!testData.steps || testData.steps.length === 0) {
      throw new Error('Test çalıştırmak için en az bir adım eklemelisiniz!');
    }

    // Aktif çalışan testlere ekle
    addActiveRunningTest(testId, testData.testName || testData.name || 'İsimsiz Test');

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
    
    if (analysisResult.isSuccess) {
      if (onSuccess) onSuccess(analysisResult.result);
      showSuccessMessage(analysisResult);
    } else {
      if (onError) onError(analysisResult.result);
      showErrorMessage(analysisResult);
    }
    
    // Test başarıyla tamamlandığında da aktif testlerden kaldır
    removeActiveRunningTest(testId);
    
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
      globalNotify.serverError();
    } else {
      globalNotify.testRunError(error.message);
    }
    
    return errorResult;
  } finally {
    // Test tamamlandığında aktif testlerden kaldır
    removeActiveRunningTest(testId);
    
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
    globalToast.success(`Test başarıyla tamamlandı! ${successfulSteps}/${totalSteps} adım başarılı`);
  } else if (!isFullyCompleted) {
    globalToast.warning(`Test tamamlanamadı! ${completedSteps}/${totalSteps} adım tamamlandı. Başarılı: ${successfulSteps}`);
  } else {
    const errorMessage = analysisResult.result.error ? ` Hata: ${analysisResult.result.error}` : '';
    globalToast.error(`Test başarısız! ${successfulSteps}/${totalSteps} adım başarılı${errorMessage}`);
  }
};

// Hata mesajı göster
export const showErrorMessage = (analysisResult) => {
  if (analysisResult.isFullyCompleted) {
    showSuccessMessage(analysisResult); // Tamamlanmış ama başarısız
  } else {
    const { successfulSteps, totalSteps, completedSteps } = analysisResult;
    globalToast.warning(`Test tamamlanamadı! ${completedSteps}/${totalSteps} adım tamamlandı. Başarılı: ${successfulSteps}`);
  }
};

export const runSingleStep = async (step, browser = 'chromium') => {
  try {
    const response = await fetch('http://localhost:3001/api/run-single-step', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ step, browser }),
    });

    if (!response.ok) {
      if (response.status === 500) {
        const errorData = await response.json();
        if (errorData.error?.includes('ECONNREFUSED') || errorData.error?.includes('connect')) {
          globalNotify.serverError();
          return { success: false, error: 'Server bağlantı hatası' };
        }
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Test çalıştırma hatası:', error);
    if (error.message.includes('Failed to fetch') || error.message.includes('ECONNREFUSED')) {
      globalNotify.serverError();
    } else {
      globalNotify.testRunError(error.message);
    }
    return { success: false, error: error.message };
  }
};

export const runTestFlow = async (steps, browser = 'chromium', onStepComplete, onTestComplete) => {
  let successfulSteps = 0;
  let completedSteps = 0;
  let currentStepIndex = 0;
  const totalSteps = steps.length;

  const results = [];

  try {
    for (const step of steps) {
      currentStepIndex++;
      
      if (onStepComplete) {
        onStepComplete(currentStepIndex, totalSteps, step, 'running');
      }

      const result = await runSingleStep(step, browser);
      results.push({
        step,
        result,
        timestamp: new Date().toISOString()
      });

      completedSteps++;

      if (result.success) {
        successfulSteps++;
        if (onStepComplete) {
          onStepComplete(currentStepIndex, totalSteps, step, 'success', result);
        }
      } else {
        if (onStepComplete) {
          onStepComplete(currentStepIndex, totalSteps, step, 'error', result);
        }
        // Hata durumunda test akışını durdur
        break;
      }
    }

    // Test sonucunu değerlendir
    const analysisResult = analyzeTestResults(results);
    
    if (onTestComplete) {
      onTestComplete({
        success: analysisResult.success,
        results,
        analysis: analysisResult,
        stats: {
          total: totalSteps,
          completed: completedSteps,
          successful: successfulSteps,
          failed: completedSteps - successfulSteps
        }
      });
    }

    // Sonuç mesajını göster
    if (successfulSteps === totalSteps) {
      globalToast.success(`Test başarıyla tamamlandı! ${successfulSteps}/${totalSteps} adım başarılı`);
    } else if (completedSteps < totalSteps) {
      globalToast.warning(`Test tamamlanamadı! ${completedSteps}/${totalSteps} adım tamamlandı. Başarılı: ${successfulSteps}`);
    } else {
      const errorMessage = analysisResult.result?.error ? ` Hata: ${analysisResult.result.error}` : '';
      globalToast.error(`Test başarısız! ${successfulSteps}/${totalSteps} adım başarılı${errorMessage}`);
    }

    return {
      success: analysisResult.success,
      results,
      analysis: analysisResult,
      stats: {
        total: totalSteps,
        completed: completedSteps,
        successful: successfulSteps,
        failed: completedSteps - successfulSteps
      }
    };

  } catch (error) {
    console.error('Test akışı çalıştırma hatası:', error);
    
    if (onTestComplete) {
      onTestComplete({
        success: false,
        error: error.message,
        results,
        stats: {
          total: totalSteps,
          completed: completedSteps,
          successful: successfulSteps,
          failed: completedSteps - successfulSteps
        }
      });
    }

    globalToast.warning(`Test tamamlanamadı! ${completedSteps}/${totalSteps} adım tamamlandı. Başarılı: ${successfulSteps}`);

    return {
      success: false,
      error: error.message,
      results,
      stats: {
        total: totalSteps,
        completed: completedSteps,
        successful: successfulSteps,
        failed: completedSteps - successfulSteps
      }
    };
  }
};

// Test sonuçlarını analiz et
export const analyzeTestResults = (results) => {
  const total = results.length;
  const successful = results.filter(r => r.result.success).length;
  const failed = total - successful;
  
  return {
    success: failed === 0,
    total,
    successful,
    failed,
    results
  };
};

// Aktif çalışan testleri yönetme fonksiyonları
export const addActiveRunningTest = (testId, testName) => {
  try {
    const activeTests = JSON.parse(localStorage.getItem('activeRunningTests') || '[]');
    
    // Aynı test zaten çalışıyorsa ekleme
    if (activeTests.some(test => test.id === testId)) {
      return;
    }
    
    const newTest = {
      id: testId,
      name: testName,
      startTime: new Date().toISOString()
    };
    
    activeTests.push(newTest);
    localStorage.setItem('activeRunningTests', JSON.stringify(activeTests));
    
    console.log('Aktif test eklendi:', newTest);
  } catch (error) {
    console.error('Aktif test ekleme hatası:', error);
  }
};

export const removeActiveRunningTest = (testId) => {
  try {
    const activeTests = JSON.parse(localStorage.getItem('activeRunningTests') || '[]');
    const filteredTests = activeTests.filter(test => test.id !== testId);
    
    localStorage.setItem('activeRunningTests', JSON.stringify(filteredTests));
    
    console.log('Aktif test kaldırıldı:', testId);
  } catch (error) {
    console.error('Aktif test kaldırma hatası:', error);
  }
};

export const getActiveRunningTests = () => {
  try {
    return JSON.parse(localStorage.getItem('activeRunningTests') || '[]');
  } catch (error) {
    console.error('Aktif testleri alma hatası:', error);
    return [];
  }
};

export const clearExpiredRunningTests = () => {
  try {
    const activeTests = getActiveRunningTests();
    const now = new Date();
    
    const validTests = activeTests.filter(test => {
      const testStartTime = new Date(test.startTime);
      const diffMinutes = (now - testStartTime) / (1000 * 60);
      return diffMinutes < 5; // 5 dakikadan eski testleri temizle
    });
    
    localStorage.setItem('activeRunningTests', JSON.stringify(validTests));
    return validTests.length;
  } catch (error) {
    console.error('Süresi geçmiş testleri temizleme hatası:', error);
    return 0;
  }
}; 