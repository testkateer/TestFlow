import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Save, 
  Play, 
  Download, 
  Upload, 
  Settings, 
  MousePointer,
  Type,
  Navigation,
  Clock,
  Eye,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  AlertCircle
} from 'lucide-react';
import { exportTestFlow, importTestFlow } from '../utils/testUtils';
import { runTestWithHandling } from '../utils/testRunner';
import { getFromStorage, setToStorage, setTempData } from '../utils/storageUtils';
import { validateTestFlow } from '../utils/validationUtils';
import { saveTestReportToStorage } from '../utils/reportUtils';
import { toast, notify } from '../utils/notificationUtils';
import { confirmActions } from '../utils/modalUtils';
import '../styles/TestEditor.css';
import { useNotification } from '../contexts/NotificationContext';
import { useModal } from '../contexts/ModalContext';

const TestEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [testName, setTestName] = useState('Yeni Test Senaryosu');
  const [selectedStep, setSelectedStep] = useState(null);
  const [steps, setSteps] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] = useState({ testName: 'Yeni Test Senaryosu', steps: [] });
  const { showError } = useNotification();
  const { showConfirm } = useModal();

  const stepTypes = [
    { id: 'navigate', name: 'Git', icon: Navigation, description: 'Belirtilen URL\'ye git' },
    { id: 'click', name: 'Tıkla', icon: MousePointer, description: 'Element üzerine tıkla' },
    { id: 'input', name: 'Metin Gir', icon: Type, description: 'Alana metin gir' },
    { id: 'wait', name: 'Bekle', icon: Clock, description: 'Belirtilen süre bekle' },
    { id: 'verify', name: 'Doğrula', icon: Eye, description: 'Element varlığını doğrula' },
    { id: 'refresh', name: 'Yenile', icon: RefreshCw, description: 'Sayfayı yenile' }
  ];

  // Test adı ve steps değiştiğinde unsaved changes durumunu kontrol et
  useEffect(() => {
    const hasChanges = 
      testName !== originalData.testName || 
      JSON.stringify(steps) !== JSON.stringify(originalData.steps);
    setHasUnsavedChanges(hasChanges);
  }, [testName, steps, originalData]);

  // Sayfa yüklendiğinde rerun parametresi ve düzenleme modu kontrolü
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const isRerun = urlParams.get('rerun');
    const editTestId = urlParams.get('edit');
    
    if (isRerun === 'true') {
      try {
        // localStorage'dan rerun test verisini al
        const rerunTestData = JSON.parse(localStorage.getItem('tempTestRerun') || '{}');
        if (rerunTestData.testName && rerunTestData.steps) {
          // Icon'ları doğru şekilde map et
          const stepsWithIcons = rerunTestData.steps.map(step => {
            const stepType = stepTypes.find(type => type.id === step.type);
            return {
              ...step,
              icon: stepType ? stepType.icon : AlertCircle
            };
          });
          
          setTestName(rerunTestData.testName);
          setSteps(stepsWithIcons);
          setOriginalData({ testName: rerunTestData.testName, steps: stepsWithIcons });
          
          // Geçici veriyi temizle
          localStorage.removeItem('tempTestRerun');
          localStorage.removeItem('temp_testRerun');
          
          // URL'den rerun parametresini temizle
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
          
          console.log('Test tekrar çalıştırma için yüklendi:', rerunTestData.testName);
        }
      } catch (error) {
        console.error('Test tekrar yükleme hatası:', error);
        showError('Test tekrar yüklenirken bir hata oluştu.');
      }
    } else if (editTestId) {
      try {
        // Düzenleme modunda test verilerini yükle - storageUtils kullan
        const editingTestData = getFromStorage('temp_editingTest');
        if (editingTestData) {
          // Icon'ları doğru şekilde map et
          const stepsWithIcons = (editingTestData.steps || []).map(step => {
            const stepType = stepTypes.find(type => type.id === step.type);
            return {
              ...step,
              icon: stepType ? stepType.icon : AlertCircle
            };
          });
          
          setTestName(editingTestData.name || 'Yeni Test Senaryosu');
          setSteps(stepsWithIcons);
          setOriginalData({ testName: editingTestData.name || 'Yeni Test Senaryosu', steps: stepsWithIcons });
          
          // Geçici veriyi temizle
          localStorage.removeItem('temp_editingTest');
          
          // URL'den edit parametresini temizle
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
          
          console.log('Test düzenleme için yüklendi:', editingTestData.name);
        }
      } catch (error) {
        console.error('Test düzenleme yükleme hatası:', error);
        showError('Test düzenlenirken bir hata oluştu.');
      }
    }
  }, [location.search, stepTypes, showError]);

  // Sayfa kapatma/yenileme durumunda uyarı
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = 'Kaydedilmemiş değişiklikleriniz var. Sayfadan çıkmak istediğinizden emin misiniz?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Sayfa değişim kontrolü için global fonksiyon ekle
  useEffect(() => {
    // Global window objesine TestEditor'ın unsaved changes kontrolünü ekle
    window.checkTestEditorUnsavedChanges = async () => {
      if (hasUnsavedChanges) {
        const shouldLeave = await showConfirm({
          title: 'Kaydedilmemiş Değişiklikler',
          message: 'Kaydedilmemiş değişiklikleriniz var. Bu sayfadan çıkmak istediğinizden emin misiniz?',
          confirmText: 'Çık',
          cancelText: 'Kal',
          variant: 'warning'
        });
        return shouldLeave;
      }
      return true;
    };

    // Cleanup - component unmount olduğunda global fonksiyonu temizle
    return () => {
      delete window.checkTestEditorUnsavedChanges;
    };
  }, [hasUnsavedChanges, showConfirm]);

  const addStep = (stepType) => {
    const newStep = {
      id: Date.now(),
      type: stepType.id,
      name: stepType.name,
      icon: stepType.icon,
      config: getDefaultConfig(stepType.id)
    };
    setSteps([...steps, newStep]);
  };

  const getDefaultConfig = (type) => {
    switch (type) {
      case 'navigate':
        return { url: '' };
      case 'click':
        return { selector: '#button', description: 'Button element' };
      case 'input':
        return { selector: '#input', text: 'Sample text', description: 'Input field' };
      case 'wait':
        return { duration: 2000, description: '2 saniye bekle' };
      case 'verify':
        return { selector: '#element', description: 'Element visibility check' };
      case 'refresh':
        return { description: 'Sayfa yenileme' };
      default:
        return {};
    }
  };

  const removeStep = (stepId) => {
    setSteps(steps.filter(step => step.id !== stepId));
    if (selectedStep?.id === stepId) {
      setSelectedStep(null);
    }
  };

  const updateStepConfig = (stepId, newConfig) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, config: { ...step.config, ...newConfig } } : step
    ));
    
    // Eğer güncelenen adım seçili adım ise, selectedStep'i de güncelle
    if (selectedStep && selectedStep.id === stepId) {
      setSelectedStep(prev => ({
        ...prev,
        config: { ...prev.config, ...newConfig }
      }));
    }
    
    // hasUnsavedChanges artık otomatik olarak useEffect'te hesaplanıyor
  };

  // Test raporu kaydetme - ortak utility kullan
  const saveTestReport = (testResult) => {
    const testData = { testName, steps };
    saveTestReportToStorage(testResult, testData);
  };

  // calculateTestDuration artık reportUtils'de, yerel fonksiyonu kaldır

  // Test çalıştırma işlevi - ortak utility kullan
  const runTest = async () => {
    const testData = { testName, steps };
    
    await runTestWithHandling(testData, {
      onStart: () => {
        setIsRunning(true);
        setTestResults(null);
        
        // Test verilerini geçici olarak kaydet (tekrar çalıştırma için)
        setTempData('testRerun', {
          testName,
          steps: steps.map(step => ({
            type: step.type,
            action: step.action,
            selector: step.selector,
            value: step.value,
            wait: step.wait,
            assertion: step.assertion
          }))
        });
        
        toast.info(`${testName} testi başlatılıyor...`);
      },
      onSuccess: (result) => {
        setTestResults(result);
        saveTestReport(result);
        toast.success(`${testName} testi başarıyla tamamlandı!`);
      },
      onError: (result) => {
        setTestResults(result);
        saveTestReport(result);
        toast.error(`${testName} testi başarısız oldu!`);
      },
      onFinally: () => {
        setIsRunning(false);
      }
    });
  };



  const handleExportTestFlow = () => {
    try {
      const testData = {
        testName,
        steps
      };
      exportTestFlow(testData);
      notify.saveSuccess(`${testName} dışa aktarıldı`);
    } catch (error) {
      console.error('Export hatası:', error);
      notify.saveError('Test dışa aktarma');
    }
  };

  const handleImportTestFlow = () => {
    importTestFlow(stepTypes, (importedData) => {
      setTestName(importedData.testName);
      setSteps(importedData.steps);
      setSelectedStep(null);
      // Import sonrası originalData güncelle (unsaved changes olarak işaretle)
      setOriginalData({ testName: 'Yeni Test Senaryosu', steps: [] });
      notify.saveSuccess('Test akışı içe aktarıldı');
    });
  };

  const saveTestFlow = async () => {
    // Validation
    const validationResult = validateTestFlow({ testName, steps });
    if (!validationResult.isValid) {
      toast.error(`Validation Hatası: ${validationResult.errors.join(', ')}`);
      return;
    }

    try {
      // Mevcut kaydedilmiş testleri al - storage utility kullan
      const savedTests = getFromStorage('savedTestFlows', []);
      
      // Yeni test verisi oluştur
      const newTest = {
        id: Date.now(),
        name: testName,
        description: `${steps.length} adımlı test akışı`,
        steps: steps,
        createdAt: new Date().toISOString(),
        lastRun: 'Hiç çalışmadı',
        status: 'pending',
        browser: 'chrome',
        duration: '--',
        type: 'manual'
      };

      // Aynı isimde test var mı kontrol et
      const existingTestIndex = savedTests.findIndex(test => test.name === testName);
      
      if (existingTestIndex !== -1) {
        // Varolan testi güncelle
        const shouldUpdate = await confirmActions.save(`"${testName}" adında bir test zaten mevcut. Güncellemek ister misiniz?`);
        if (shouldUpdate) {
          savedTests[existingTestIndex] = {
            ...savedTests[existingTestIndex],
            ...newTest,
            id: savedTests[existingTestIndex].id, // Orijinal ID'yi koru
            updatedAt: new Date().toISOString()
          };
          notify.updateSuccess(testName);
        } else {
          return;
        }
      } else {
        // Yeni test ekle
        savedTests.push(newTest);
        notify.saveSuccess(testName);
      }

      // localStorage'a kaydet - storage utility kullan
      setToStorage('savedTestFlows', savedTests);
      
      // Kaydetme başarılı olduğunda original data'yı güncelle
      setOriginalData({ testName, steps });
      
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      notify.saveError(testName);
    }
  };

  return (
    <div className="test-editor">
      <div className="editor-header">
        <div className="header-content">
          <div className="test-name-wrapper">
            <input 
              type="text" 
              value={testName} 
              onChange={(e) => {
                setTestName(e.target.value);
              }}
              className="test-name-input"
              placeholder="Test adı girin..."
            />
            <Edit size={18} className="edit-icon" />
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleImportTestFlow}>
            <Upload size={16} />
            İçe Aktar
          </button>
          <button className="btn btn-secondary" onClick={handleExportTestFlow}>
            <Download size={16} />
            Dışa Aktar
          </button>
          <button className="btn btn-primary" onClick={saveTestFlow}>
            <Save size={16} />
            Kaydet
          </button>
          <button 
            className={`btn btn-success ${isRunning ? 'disabled' : ''}`}
            onClick={runTest}
            disabled={isRunning}
          >
            <Play size={16} />
            {isRunning ? 'Test Çalışıyor...' : 'Testi Çalıştır'}
          </button>
        </div>
      </div>

      <div className="editor-content">
        {/* Sol Panel - Adım Türleri */}
        <div className="steps-panel card">
          <h3>🧩 Test Adımları</h3>
          <div className="step-types">
            {stepTypes.map((stepType) => {
              const Icon = stepType.icon;
              return (
                <div 
                  key={stepType.id}
                  className="step-type"
                  onClick={() => addStep(stepType)}
                >
                  <Icon size={20} />
                  <div className="step-type-info">
                    <span className="step-type-name">{stepType.name}</span>
                    <span className="step-type-desc">{stepType.description}</span>
                  </div>
                  <Plus size={16} className="add-icon" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Orta Panel - Akış Görünümü */}
        <div className="flow-panel card">
          <div className="flow-header">
            <h3>🔄 Test Akışı</h3>
            <span className="step-count">{steps.length} adım</span>
          </div>
          
          <div className="flow-container">
            {steps.length === 0 ? (
              <div className="empty-flow">
                <div className="empty-content">
                  <Plus size={48} className="empty-icon" />
                  <h4>Test adımı ekleyin</h4>
                  <p>Sol panelden bir adım türü seçerek başlayın</p>
                </div>
              </div>
            ) : (
              <div className="flow-steps">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="flow-step-container">
                      <div 
                        className={`flow-step ${selectedStep?.id === step.id ? 'selected' : ''}`}
                        onClick={() => setSelectedStep(step)}
                      >
                        <div className="step-number">{index + 1}</div>
                        <div className="step-content">
                          <div className="step-header">
                            <Icon size={16} />
                            <span className="step-name">{step.name}</span>
                          </div>
                          <div className="step-description">
                            {step.config.description || step.config.url || step.config.text || 'Yapılandırılmamış'}
                          </div>
                        </div>
                        <div className="step-actions">
                          <button 
                            className="step-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStep(step);
                            }}
                          >
                            <Edit size={12} />
                          </button>
                          <button 
                            className="step-action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeStep(step.id);
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <div className="flow-connector">
                          <div className="connector-arrow">↓</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sağ Panel - Adım Detayları */}
        <div className="config-panel card">
          <h3>📝 Adım Detayları</h3>
          
          {selectedStep ? (
            <div className="step-config">
              <div className="config-header">
                <selectedStep.icon size={20} />
                <span>{selectedStep.name}</span>
              </div>
              
              <div className="config-form">
                {selectedStep.type === 'navigate' && (
                  <div className="form-group">
                    <label>URL:</label>
                    <input
                      type="text"
                      value={selectedStep.config.url || ''}
                      onChange={(e) => updateStepConfig(selectedStep.id, { url: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                )}
                
                {selectedStep.type === 'click' && (
                  <>
                  <div className="form-group">
                      <label>Adım Açıklaması:</label>
                      <input
                        type="text"
                        value={selectedStep.config.description || ''}
                        onChange={(e) => updateStepConfig(selectedStep.id, { description: e.target.value })}
                        placeholder="Tıklama açıklaması"
                      />
                    </div>
                    <div className="form-group">
                      <label>Element/XPath/Selector Seçici:</label>
                      <input
                        type="text"
                        value={selectedStep.config.selector || ''}
                        onChange={(e) => updateStepConfig(selectedStep.id, { selector: e.target.value })}
                        placeholder="#button"
                      />
                    </div>
                    
                  </>
                )}
                
                {selectedStep.type === 'input' && (
                  <>
                    <div className="form-group">
                      <label>Adım Açıklaması:</label>
                      <input
                        type="text"
                        value={selectedStep.config.description || ''}
                        onChange={(e) => updateStepConfig(selectedStep.id, { description: e.target.value })}
                        placeholder="Alan açıklaması"
                      />
                    </div>
                    <div className="form-group">
                      <label>Element/XPath/Selector Seçici:</label>
                      <input
                        type="text"
                        value={selectedStep.config.selector || ''}
                        onChange={(e) => updateStepConfig(selectedStep.id, { selector: e.target.value })}
                        placeholder="#input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Metin:</label>
                      <input
                        type="text"
                        value={selectedStep.config.text || ''}
                        onChange={(e) => updateStepConfig(selectedStep.id, { text: e.target.value })}
                        placeholder="Girilecek metin"
                      />
                    </div>
                    
                  </>
                )}
                
                {selectedStep.type === 'wait' && (
                  <>
                    <div className="form-group">
                      <label>Adım Açıklaması:</label>
                      <input
                        type="text"
                        value={selectedStep.config.description || ''}
                        onChange={(e) => updateStepConfig(selectedStep.id, { description: e.target.value })}
                        placeholder="Bekleme açıklaması"
                      />
                    </div>
                    <div className="form-group">
                      <label>Süre (ms):</label>
                      <input
                        type="number"
                        value={selectedStep.config.duration || ''}
                        onChange={(e) => updateStepConfig(selectedStep.id, { duration: parseInt(e.target.value) || 0 })}
                        placeholder="2000"
                      />
                    </div>
                  </>
                )}
                
                {selectedStep.type === 'verify' && (
                  <>  
                    <div className="form-group">
                      <label>Adım Açıklaması:</label>
                      <input
                        type="text"
                        value={selectedStep.config.description || ''}
                        onChange={(e) => updateStepConfig(selectedStep.id, { description: e.target.value })}
                        placeholder="Doğrulama açıklaması"
                      />
                    </div>
                    <div className="form-group">
                      <label>Element/XPath/Selector Seçici:</label>
                      <input
                        type="text"
                        value={selectedStep.config.selector || ''}
                        onChange={(e) => updateStepConfig(selectedStep.id, { selector: e.target.value })}
                        placeholder="#element"
                      />
                    </div>
                  </>
                )}
                
                {selectedStep.type === 'refresh' && (
                  <div className="form-group">
                    <label>Adım Açıklaması:</label>
                    <input
                      type="text"
                      value={selectedStep.config.description || ''}
                      onChange={(e) => updateStepConfig(selectedStep.id, { description: e.target.value })}
                      placeholder="Yenileme açıklaması"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <Settings size={48} className="settings-icon" />
              <h4>Adım seçin</h4>
              <p>Bir test adımını seçerek detaylarını düzenleyin</p>
            </div>
          )}
        </div>
      </div>

      {/* Alt Panel - Test Ayarları */}
      <div className="test-settings card">
        <h3>🧪 Test Ayarları</h3>
        <div className="settings-grid">
          <div className="setting-group">
            <label>Varsayılan Timeout:</label>
            <select>
              <option>30 saniye</option>
              <option>60 saniye</option>
              <option>120 saniye</option>
            </select>
          </div>
          <div className="setting-group">
            <label>Tarayıcı:</label>
            <select>
              <option>Chrome</option>
              <option>Firefox</option>
              <option>Safari</option>
            </select>
          </div>
          <div className="setting-group">
            <label>Ekran Çözünürlüğü:</label>
            <select>
              <option>1920x1080</option>
              <option>1366x768</option>
              <option>Mobile (375x667)</option>
            </select>
          </div>
          <div className="setting-group">
            <label>Ekran Kaydı:</label>
            <select>
              <option>Açık</option>
              <option>Kapalı</option>
              <option>Sadece Hata Durumunda</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestEditor; 