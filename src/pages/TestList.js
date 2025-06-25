import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Play, 
  Edit, 
  Clock, 
  Download, 
  MoreHorizontal,
  Chrome,
  Globe,
  Smartphone,
  Trash2
} from 'lucide-react';
import { exportTestFlow } from '../utils/testUtils';
import '../styles/TestList.css';

const TestList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBrowser, setFilterBrowser] = useState('all');
  const [tests, setTests] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [runningTests, setRunningTests] = useState(new Set());

  // Kaydedilmiş testleri yükle
  useEffect(() => {
    const loadSavedTests = () => {
      try {
        const savedTests = JSON.parse(localStorage.getItem('savedTestFlows') || '[]');
        const allTests = [...savedTests];
        setTests(allTests);
      } catch (error) {
        console.error('Test yükleme hatası:', error);
        setTests([]);
      }
    };

    loadSavedTests();
    
    // Storage event listener ekle (farklı sekmelerde değişiklikleri dinlemek için)
    const handleStorageChange = () => {
      loadSavedTests();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.test-actions')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getBrowserIcon = (browser) => {
    switch (browser) {
      case 'chrome': return <Chrome size={16} />;
      case 'firefox': return <Globe size={16} />;
      case 'safari': return <Smartphone size={16} />;
      default: return <Chrome size={16} />;
    }
  };

  // Test silme işlevi
  const deleteTest = (testId) => {
    if (window.confirm('Bu akışı silmek istediğinizden emin misiniz?')) {
      try {
        const updatedTests = tests.filter(test => test.id !== testId);
        setTests(updatedTests);
        localStorage.setItem('savedTestFlows', JSON.stringify(updatedTests));
        setOpenDropdownId(null);
      } catch (error) {
        console.error('Test silme hatası:', error);
        alert('Test silinirken bir hata oluştu.');
      }
    }
  };

  // Test çalıştırma işlevi (TestEditor ile birebir aynı)
  const runTest = async (test) => {
    if (runningTests.has(test.id)) {
      alert('Bu test zaten çalışıyor.');
      return;
    }

    if (!test.steps || test.steps.length === 0) {
      alert('Test çalıştırmak için en az bir adım eklemelisiniz!');
      return;
    }

    setRunningTests(prev => new Set([...prev, test.id]));
    
    // Test durumunu güncelle
    const updatedTest = { ...test, status: 'running' };
    const updatedTests = tests.map(t => t.id === test.id ? updatedTest : t);
    setTests(updatedTests);

    try {
      // Browser environment - API endpoint'e istek gönder
      const response = await fetch('/api/run-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testName: test.name,
          steps: test.steps
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
      
      // Test sonucunu Reports sayfası için localStorage'a kaydet
      saveTestReport(result, test);
      
      const totalSteps = result.totalSteps || test.steps.length;
      const successfulSteps = result.successfulSteps || 0;
      const completedSteps = result.completedSteps || (result.results ? result.results.length : 0);
      
      // Test durumunu güncelle
      const finalStatus = result.success ? 'success' : 'error';
      const duration = calculateTestDuration(result);

      const finalTest = {
        ...test,
        status: finalStatus,
        lastRun: new Date().toLocaleString('tr-TR'),
        duration: duration
      };

      const finalTests = tests.map(t => t.id === test.id ? finalTest : t);
      setTests(finalTests);
      localStorage.setItem('savedTestFlows', JSON.stringify(finalTests));
      
      if (result.success && completedSteps === totalSteps && successfulSteps === totalSteps) {
        alert(`✅ Test başarıyla tamamlandı!\n\n📊 Sonuç: ${successfulSteps}/${totalSteps} adım başarılı`);
      } else if (completedSteps < totalSteps) {
        alert(`⚠️ Test tamamlanamadı!\n\n📊 Sonuç: ${completedSteps}/${totalSteps} adım tamamlandı\n✅ Başarılı: ${successfulSteps}\n❌ Başarısız: ${completedSteps - successfulSteps}`);
      } else {
        alert(`❌ Test başarısız!\n\n📊 Sonuç: ${successfulSteps}/${totalSteps} adım başarılı\n${result.error ? `\nHata: ${result.error}` : ''}`);
      }
      
    } catch (error) {
      console.error('Test çalıştırma hatası:', error);
      
      // Hata durumunda test durumunu güncelle
      const errorResult = {
        ...test,
        status: 'error',
        lastRun: new Date().toLocaleString('tr-TR'),
        duration: 'Hata'
      };

      const finalTests = tests.map(t => t.id === test.id ? errorResult : t);
      setTests(finalTests);
      localStorage.setItem('savedTestFlows', JSON.stringify(finalTests));
      
      // Hata mesajına server durum kontrolü ekle
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        alert(`❌ Server bağlantı hatası!\n\nLütfen şunları kontrol edin:\n1. 'npm run server' komutu ile server'ı başlattınız mı?\n2. Server 3001 portunda çalışıyor mu?\n\nHata: ${error.message}`);
      } else {
        alert(`Test çalıştırma hatası: ${error.message}`);
      }
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(test.id);
        return newSet;
      });
    }
  };

  // Test raporu kaydetme (TestEditor ile aynı)
  const saveTestReport = (testResult, test) => {
    try {
      // Mevcut raporları al
      const existingReports = JSON.parse(localStorage.getItem('testReports') || '[]');
      
      // Test durumunu daha detaylı analiz et
      const totalSteps = testResult.totalSteps || test.steps.length;
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
        testName: test.name || 'İsimsiz Test',
        description: `${test.steps.length} adımlı test akışı`,
        status: isSuccess ? 'success' : 'error',
        duration: testResult.duration || calculateTestDuration(testResult),
        date: new Date().toLocaleDateString('tr-TR'),
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
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
      
      // localStorage'a kaydet
      localStorage.setItem('testReports', JSON.stringify(existingReports));
      
      console.log('Test raporu kaydedildi:', newReport);
    } catch (error) {
      console.error('Test raporu kaydetme hatası:', error);
    }
  };

  // Test süresi hesaplama (TestEditor ile aynı)
  const calculateTestDuration = (testResult) => {
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

  // Test düzenleme işlevi
  const editTest = (test) => {
    try {
      console.log('editTest çağrıldı, test data:', test);
      
      // Test verilerini localStorage'a geçici olarak kaydet
      localStorage.setItem('editingTest', JSON.stringify(test));
      console.log('Test verileri localStorage\'a kaydedildi');
      
      // Editor sayfasına yönlendir
      navigate(`/editor?edit=${test.id}`);
      console.log('Editor sayfasına yönlendiriliyor, URL:', `/editor?edit=${test.id}`);
    } catch (error) {
      console.error('Test düzenleme hatası:', error);
      alert('Test düzenlenirken bir hata oluştu: ' + error.message);
    }
  };

  // Test export işlevi - ortak utility kullan
  const handleExportTest = (test) => {
    try {
      const testData = {
        testName: test.name,
        steps: test.steps || []
      };
      
      // TestEditor ile aynı dosya adlandırma mantığı - fileName parametresi geçmeyelim
      exportTestFlow(testData);
      setOpenDropdownId(null);
    } catch (error) {
      console.error('Export hatası:', error);
      alert('Test export edilirken bir hata oluştu.');
    }
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || test.status === filterStatus;
    const matchesBrowser = filterBrowser === 'all' || test.browser === filterBrowser;
    
    return matchesSearch && matchesStatus && matchesBrowser;
  });

  return (
    <div className="test-list-page">
      <div className="page-header">
        <div className="header-content">
          <h1>🔍 Akışlar</h1>
          <p>Tüm test senaryolarınızı görüntüleyin ve yönetin</p>
        </div>
      </div>

      {/* Arama ve Filtreler */}
      <div className="filters-section card">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Test adı veya açıklaması ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filters">
          <div className="filter-group">
            <label>Durum:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tümü</option>
              <option value="success">Başarılı</option>
              <option value="error">Başarısız</option>
              <option value="running">Çalışıyor</option>
              <option value="pending">Bekliyor</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Tarayıcı:</label>
            <select 
              value={filterBrowser} 
              onChange={(e) => setFilterBrowser(e.target.value)}
            >
              <option value="all">Tümü</option>
              <option value="chrome">Chrome</option>
              <option value="firefox">Firefox</option>
              <option value="safari">Safari</option>
            </select>
          </div>
          
          <button className="btn btn-secondary">
            <Filter size={16} />
            Gelişmiş Filtre
          </button>
        </div>
      </div>

      {/* Test Listesi */}
      <div className="tests-container">
        <div className="tests-header">
          <span className="results-count">
            {filteredTests.length} test bulundu
          </span>
        </div>

        <div className="tests-grid">
          {filteredTests.map((test) => (
            <div key={test.id} className="test-card card">
              <div className="test-card-header">
                <div className="test-info">
                  <h3 className="test-name">{test.name}</h3>
                  <p className="test-description">{test.description}</p>
                </div>
                <div className="test-actions">
                  <button 
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdownId(openDropdownId === test.id ? null : test.id);
                    }}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {openDropdownId === test.id && (
                    <div className="dropdown-menu">
                      <button 
                        className="dropdown-item delete-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTest(test.id);
                        }}
                      >
                        <Trash2 size={14} />
                        Sil
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="test-meta">
                <div className="meta-item">
                  <span className="meta-label">Son Çalıştırma:</span>
                  <span className="meta-value">{test.lastRun || 'Henüz çalıştırılmadı'}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Süre:</span>
                  <span className="meta-value">{test.duration || '-'}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Tarayıcı:</span>
                  <span className="meta-value browser-info">
                    {getBrowserIcon(test.browser)}
                    {test.browser || 'chrome'}
                  </span>
                </div>
              </div>

              <div className="test-card-footer">
                <div className="test-status">
                  <span className={`status-badge status-${test.status || 'pending'}`}>
                    {test.status === 'success' && 'Başarılı'}
                    {test.status === 'error' && 'Başarısız'}
                    {(test.status === 'running' || runningTests.has(test.id)) && 'Çalışıyor'}
                    {(!test.status || test.status === 'pending') && 'Bekliyor'}
                  </span>
                  <span className={`type-badge ${test.type || 'manual'}`}>
                    {test.type === 'scheduled' && '⏰ Planlı'}
                    {(!test.type || test.type === 'manual') && '🔧 Manuel'}
                  </span>
                </div>

                <div className="card-actions">
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={() => runTest(test)}
                    disabled={runningTests.has(test.id)}
                  >
                    <Play size={14} />
                    {runningTests.has(test.id) ? 'Çalışıyor...' : 'Çalıştır'}
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => editTest(test)}
                  >
                    <Edit size={14} />
                    Düzenle
                  </button>
                  <button className="btn btn-secondary btn-sm">
                    <Clock size={14} />
                    Zamanla
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleExportTest(test)}
                  >
                    <Download size={14} />
                    Export
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestList; 