import React, { useState } from 'react';
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
  Edit
} from 'lucide-react';
import '../styles/TestEditor.css';

const TestEditor = () => {
  const [testName, setTestName] = useState('Yeni Test Senaryosu');
  const [selectedStep, setSelectedStep] = useState(null);
  const [steps, setSteps] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);

  const stepTypes = [
    { id: 'navigate', name: 'Git', icon: Navigation, description: 'Belirtilen URL\'ye git' },
    { id: 'click', name: 'Tıkla', icon: MousePointer, description: 'Element üzerine tıkla' },
    { id: 'input', name: 'Metin Gir', icon: Type, description: 'Alana metin gir' },
    { id: 'wait', name: 'Bekle', icon: Clock, description: 'Belirtilen süre bekle' },
    { id: 'verify', name: 'Doğrula', icon: Eye, description: 'Element varlığını doğrula' },
    { id: 'refresh', name: 'Yenile', icon: RefreshCw, description: 'Sayfayı yenile' }
  ];

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
  };

  const runTest = async () => {
    if (steps.length === 0) {
      alert('Test çalıştırmak için en az bir adım eklemelisiniz!');
      return;
    }

    setIsRunning(true);
    setTestResults(null);

    try {
      // Browser environment - API endpoint'e istek gönder
      const response = await fetch('/api/run-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testName,
          steps
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
      setTestResults(result);
      
      if (result.success) {
        alert(`Test başarıyla tamamlandı! ${result.successfulSteps}/${result.totalSteps} adım başarılı.`);
      } else {
        alert(`Test hatası: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Test çalıştırma hatası:', error);
      
      // Hata mesajına server durum kontrolü ekle
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        alert(`❌ Server bağlantı hatası!\n\nLütfen şunları kontrol edin:\n1. 'npm run server' komutu ile server'ı başlattınız mı?\n2. Server 3001 portunda çalışıyor mu?\n\nHata: ${error.message}`);
      } else {
        alert(`Test çalıştırma hatası: ${error.message}`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const testSingleStep = async (step) => {
    if (!step || !step.config.url) {
      alert('URL boş olamaz!');
      return;
    }

    setIsRunning(true);

    try {
      const response = await fetch('/api/run-single-step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ step })
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
      
      if (result.success) {
        alert(`✅ Git adımı başarılı!\n${result.message}`);
      } else {
        alert(`❌ Git adımı başarısız!\n${result.message}`);
      }
      
    } catch (error) {
      console.error('Tek adım test hatası:', error);
      
      // Hata mesajına server durum kontrolü ekle
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        alert(`❌ Server bağlantı hatası!\n\nLütfen şunları kontrol edin:\n1. 'npm run server' komutu ile server'ı başlattınız mı?\n2. Server 3001 portunda çalışıyor mu?\n\nHata: ${error.message}`);
      } else {
        alert(`❌ Tek adım test hatası: ${error.message}`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const exportTestFlow = () => {
    try {
      const testData = {
        testName,
        steps,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const jsonString = JSON.stringify(testData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${testName.replace(/\s+/g, '_')}_test_flow.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      alert(`✅ Test akışı başarıyla dışa aktarıldı!\nDosya adı: ${testName.replace(/\s+/g, '_')}_test_flow.json`);
    } catch (error) {
      console.error('Dışa aktarma hatası:', error);
      alert(`❌ Dışa aktarma hatası: ${error.message}`);
    }
  };

  const importTestFlow = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (!file) return;

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

          setTestName(testData.testName);
          setSteps(validSteps);
          setSelectedStep(null);
          
          alert(`✅ Test akışı başarıyla içe aktarıldı!\nTest adı: ${testData.testName}\nAdım sayısı: ${validSteps.length}`);
        } catch (error) {
          console.error('İçe aktarma hatası:', error);
          alert(`❌ İçe aktarma hatası: ${error.message}\n\nDosyanın geçerli bir test akışı JSON dosyası olduğundan emin olun.`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const saveTestFlow = () => {
    if (!testName.trim()) {
      alert('❌ Test adı boş olamaz!');
      return;
    }

    if (steps.length === 0) {
      alert('❌ Test akışı boş olamaz! En az bir adım eklemelisiniz.');
      return;
    }

    try {
      // Mevcut kaydedilmiş testleri al
      const savedTests = JSON.parse(localStorage.getItem('savedTestFlows') || '[]');
      
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
        const shouldUpdate = window.confirm(`"${testName}" adında bir test zaten mevcut. Güncellemek ister misiniz?`);
        if (shouldUpdate) {
          savedTests[existingTestIndex] = {
            ...savedTests[existingTestIndex],
            ...newTest,
            id: savedTests[existingTestIndex].id, // Orijinal ID'yi koru
            updatedAt: new Date().toISOString()
          };
          alert(`✅ "${testName}" test akışı başarıyla güncellendi!`);
        } else {
          return;
        }
      } else {
        // Yeni test ekle
        savedTests.push(newTest);
        alert(`✅ "${testName}" test akışı başarıyla kaydedildi!\n\nAkışlar sayfasından görüntüleyebilirsiniz.`);
      }

      // localStorage'a kaydet
      localStorage.setItem('savedTestFlows', JSON.stringify(savedTests));
      
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert(`❌ Kaydetme hatası: ${error.message}`);
    }
  };

  return (
    <div className="test-editor">
      <div className="editor-header">
        <div className="header-content">
          <input 
            type="text" 
            value={testName} 
            onChange={(e) => setTestName(e.target.value)}
            className="test-name-input"
          />
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={importTestFlow}>
            <Upload size={16} />
            İçe Aktar
          </button>
          <button className="btn btn-secondary" onClick={exportTestFlow}>
            <Download size={16} />
            Dışa Aktar
          </button>
          <button 
            className={`btn btn-success ${isRunning ? 'disabled' : ''}`}
            onClick={runTest}
            disabled={isRunning}
          >
            <Play size={16} />
            {isRunning ? 'Test Çalışıyor...' : 'Testi Çalıştır'}
          </button>
          <button className="btn btn-primary" onClick={saveTestFlow}>
            <Save size={16} />
            Kaydet
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
                          <div className="connector-line"></div>
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
                  <>
                    <div className="form-group">
                      <label>URL:</label>
                      <input
                        type="text"
                        value={selectedStep.config.url || ''}
                        onChange={(e) => updateStepConfig(selectedStep.id, { url: e.target.value })}
                        placeholder="https://example.com"
                      />
                    </div>
                    <div className="form-group">
                      <button 
                        className="btn btn-secondary btn-small"
                        onClick={() => testSingleStep(selectedStep)}
                        disabled={isRunning || !selectedStep.config.url}
                      >
                        <Play size={14} />
                        Bu Adımı Test Et
                      </button>
                    </div>
                  </>
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