import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  AlertCircle,
  X,
  Undo,
  Redo
} from 'lucide-react';
import useHistory from '../hooks/useHistory';
import { exportTestFlow, importTestFlow } from '../utils/testUtils';
import { runTestWithHandling } from '../utils/testRunner';
import { getFromStorage, setToStorage, setTempData } from '../utils/storageUtils';
import { validateTestFlow } from '../utils/validationUtils';
import { saveTestReportToStorage } from '../utils/reportUtils';
import { toast} from '../utils/notifications';
import '../styles/main.css';
import { useNotification } from '../contexts/NotificationContext';
import { useModal } from '../contexts/ModalContext';

const TestEditor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    state: editorState,
    setState: setEditorState,
    resetState: resetEditorState,
    undo,
    redo,
    canUndo,
    canRedo
  } = useHistory({ testName: 'Yeni Test Senaryosu', steps: [] });

  const { testName, steps } = editorState;

  const [selectedStep, setSelectedStep] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const { showError } = useNotification();
  const { showTripleConfirm } = useModal();
  const saveTestFlowRef = useRef();

  const hasUnsavedChanges = canUndo;

  const stepTypes = [
    { id: 'navigate', name: 'Git', icon: Navigation, description: 'Belirtilen URL ye git' },
    { id: 'click', name: 'Tıkla', icon: MousePointer, description: 'Element üzerine tıkla' },
    { id: 'input', name: 'Metin Gir', icon: Type, description: 'Alana metin gir' },
    { id: 'wait', name: 'Bekle', icon: Clock, description: 'Belirtilen süre bekle' },
    { id: 'verify', name: 'Doğrula', icon: Eye, description: 'Element varlığını doğrula' },
    { id: 'refresh', name: 'Yenile', icon: RefreshCw, description: 'Sayfayı yenile' }
  ];

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const isRerun = urlParams.get('rerun');
    const editTestId = urlParams.get('edit');
    
    const loadData = (data, nameKey, stepsKey) => {
      const stepsWithIcons = (data[stepsKey] || []).map(step => {
        const stepType = stepTypes.find(type => type.id === step.type);
        return { ...step, icon: stepType ? stepType.icon : AlertCircle };
      });
      resetEditorState({ testName: data[nameKey] || 'Yeni Test Senaryosu', steps: stepsWithIcons });
    };

    if (isRerun === 'true') {
      try {
        const rerunTestData = getFromStorage('tempTestRerun');
        if (rerunTestData) {
          loadData(rerunTestData, 'testName', 'steps');
          localStorage.removeItem('tempTestRerun');
          navigate('/editor', { replace: true });
        }
      } catch (error) {
        showError('Test tekrar yüklenirken bir hata oluştu.');
      }
    } else if (editTestId) {
      try {
        const editingTestData = getFromStorage('temp_editingTest');
        if (editingTestData) {
          loadData(editingTestData, 'name', 'steps');
          localStorage.removeItem('temp_editingTest');
          navigate('/editor', { replace: true });
        }
      } catch (error) {
        showError('Test düzenlenirken bir hata oluştu.');
      }
    }
  }, [location.search, navigate, showError, resetEditorState, stepTypes]);

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

  useEffect(() => {
    window.checkTestEditorUnsavedChanges = async () => {
      if (hasUnsavedChanges) {
        const result = await showTripleConfirm({
          title: 'Kaydedilmemiş Değişiklikler',
          message: 'Kaydedilmemiş değişiklikleriniz var. Bu sayfadan çıkmak istediğinizden emin misiniz?',
          saveText: 'Kaydet ve Çık',
          exitText: 'Çık',
          cancelText: 'İptal'
        });
        
        if (result === 'save') {
          await saveTestFlowRef.current();
          return true;
        } else if (result === 'exit') {
          return true;
        } else {
          return false;
        }
      }
      return true;
    };

    return () => {
      delete window.checkTestEditorUnsavedChanges;
    };
  }, [hasUnsavedChanges, showTripleConfirm]);

  const setTestNameState = (name) => {
    setEditorState(currentState => ({ ...currentState, testName: name }));
  };

  const addStep = (stepType) => {
    const newStep = {
      id: Date.now(),
      type: stepType.id,
      name: stepType.name,
      icon: stepType.icon,
      config: getDefaultConfig(stepType.id)
    };
    setEditorState(s => ({ ...s, steps: [...s.steps, newStep] }));
  };

  const getDefaultConfig = (type) => {
    switch (type) {
      case 'navigate': return { url: '' };
      case 'click': return { selector: '#button', description: 'Button element' };
      case 'input': return { selector: '#input', text: 'Sample text', description: 'Input field' };
      case 'wait': return { duration: 2000, description: '2 saniye bekle' };
      case 'verify': return { selector: '#element', description: 'Element visibility check' };
      case 'refresh': return { description: 'Sayfa yenileme' };
      default: return {};
    }
  };

  const removeStep = (stepId) => {
    setEditorState(s => ({ ...s, steps: s.steps.filter(step => step.id !== stepId) }));
    if (selectedStep?.id === stepId) {
      setSelectedStep(null);
    }
  };

  const updateStepConfig = (stepId, newConfig) => {
    setEditorState(s => ({
      ...s,
      steps: s.steps.map(step => 
        step.id === stepId ? { ...step, config: { ...step.config, ...newConfig } } : step
      )
    }));
    
    if (selectedStep && selectedStep.id === stepId) {
      setSelectedStep(prev => ({ ...prev, config: { ...prev.config, ...newConfig } }));
    }
  };

  const saveTestReport = (testResult) => {
    const testData = { testName, steps };
    saveTestReportToStorage(testResult, testData);
  };

  const runTest = async () => {
    const testData = { testName, steps };
    await runTestWithHandling(testData, {
      onStart: () => {
        setIsRunning(true);
        setTestResults(null);
        setTempData('testRerun', { testName, steps });
        // Başlatma bildirimi runTestWithHandling tarafından gösterilecek
      },
      onSuccess: (result) => {
        setTestResults(result);
        saveTestReport(result);
        // Başarı bildirimi runTestWithHandling tarafından gösterilecek
      },
      onError: (result) => {
        setTestResults(result);
        saveTestReport(result);
        // Hata bildirimi runTestWithHandling tarafından gösterilecek
      },
      onFinally: () => setIsRunning(false)
    });
  };

  const handleExportTestFlow = () => {
    try {
      exportTestFlow({ testName, steps });
    } catch (error) {
    }
  };

  const handleImportTestFlow = () => {
    importTestFlow(stepTypes, (importedData) => {
      resetEditorState({ testName: importedData.testName, steps: importedData.steps });
      setSelectedStep(null);
      // TestEditor'da direkt içe aktarma yapıldığı için bildirim göster
      toast.importSuccess(importedData.testName, importedData.steps.length);
    });
  };

  const saveTestFlow = useCallback(async () => {
    const validationResult = validateTestFlow({ testName, steps });
    if (!validationResult.isValid) {
      toast.error(`Validation Hatası: ${validationResult.errors.join(', ')}`);
      return;
    }

    try {
      const savedTests = getFromStorage('savedTestFlows', []);
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

      const existingTestIndex = savedTests.findIndex(test => test.name === testName);
      
      if (existingTestIndex !== -1) {
        const shouldUpdate = await showTripleConfirm({
          title: `"${testName}" adında bir test zaten mevcut. Güncellemek ister misiniz?`,
          message: `"${testName}" adında bir test zaten mevcut. Güncellemek ister misiniz?`,
          saveText: 'Evet',
          exitText: 'Hayır',
          cancelText: 'İptal'
        });
        if (shouldUpdate === 'save') {
          savedTests[existingTestIndex] = { ...savedTests[existingTestIndex], ...newTest, id: savedTests[existingTestIndex].id, updatedAt: new Date().toISOString() };
          toast.updateSuccess(testName);
        } else if (shouldUpdate === 'exit') {
          return;
        }
      } else {
        savedTests.push(newTest);
        toast.saveSuccess(testName);
      }

      setToStorage('savedTestFlows', savedTests);
      resetEditorState({ testName, steps });
      
    } catch (error) {
      toast.saveError(testName);
    }
  }, [testName, steps, resetEditorState, showTripleConfirm]);

  saveTestFlowRef.current = saveTestFlow;

  return (
    <div className="page-container">
      <div className="editor-header">
        <div className="header-content">
          <div className="test-name-wrapper">
            <Edit size={18} className="edit-icon" />
            <input 
              type="text" 
              value={testName} 
              onChange={(e) => setTestNameState(e.target.value)}
              className="test-name-input"
              placeholder="Test adı girin..."
            />
            {testName !== '' && (
              <button 
                className="test-name-clear-btn" 
                onClick={() => setTestNameState('')}
                title="Test adını temizle"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={undo} disabled={!canUndo} title="Geri Al">
            <Undo size={16} />
            Geri Al
          </button>
          <button className="btn btn-secondary" onClick={redo} disabled={!canRedo} title="İleri Al">
            <Redo size={16} />
            İleri Al
          </button>
          <button className="btn btn-secondary" onClick={handleImportTestFlow}>
            <Upload size={16} />
            İçe Aktar
          </button>
          <button className="btn btn-secondary" onClick={handleExportTestFlow}>
            <Download size={16} />
            Dışa Aktar
          </button>
          <button className="btn btn-primary" onClick={saveTestFlow} disabled={!hasUnsavedChanges || steps.length === 0}>
            <Save size={16} />
            Kaydet
          </button>
          <button 
            className={`btn btn-success ${isRunning ? 'disabled' : ''}`}
            onClick={runTest}
            disabled={isRunning || steps.length === 0}
          >
            <Play size={16} />
            {isRunning ? 'Çalışıyor...' : 'Çalıştır'}
          </button>
        </div>
      </div>

      <div className="editor-content">
        {/* Sol Panel - Adım Türleri */}
        <div className="steps-panel card">
          <h3>
            <Plus size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Test Adımları
          </h3>
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
            <h3>
              <RefreshCw size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Test Akışı
            </h3>
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
          <h3>
            <Edit size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Adım Detayları
          </h3>
          
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
    </div>
  );
};

export default TestEditor; 