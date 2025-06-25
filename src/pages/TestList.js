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
import { runTestWithHandling } from '../utils/testRunner';
import { getFromStorage, setToStorage, getTempData, setTempData } from '../utils/storageUtils';
import { getStatusIcon, getStatusText, getBrowserIcon } from '../utils/statusUtils';
import { formatDateTime, formatDate, formatTime } from '../utils/dateUtils';
import { saveTestReportToStorage, calculateTestDuration } from '../utils/reportUtils';
import { toast, notify } from '../utils/notificationUtils';
import { confirmActions } from '../utils/modalUtils';
import '../styles/TestList.css';

const TestList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBrowser, setFilterBrowser] = useState('all');
  const [tests, setTests] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [runningTests, setRunningTests] = useState(new Set());

  // Kaydedilmiş testleri yükle - storage utility kullan
  useEffect(() => {
    const loadSavedTests = () => {
      const savedTests = getFromStorage('savedTestFlows', []);
      setTests(savedTests);
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

  // getBrowserIcon artık utility'den geldi, yerel fonksiyonu kaldır

  // Test silme işlevi - storage utility kullan
  const deleteTest = async (testId) => {
    const testName = tests.find(test => test.id === testId)?.name || 'akışı';
    const confirmed = await confirmActions.delete(testName);
    
    if (confirmed) {
      const updatedTests = tests.filter(test => test.id !== testId);
      setTests(updatedTests);
      setToStorage('savedTestFlows', updatedTests);
      setOpenDropdownId(null);
      notify.deleteSuccess(testName);
    }
  };

  // Test çalıştırma işlevi - ortak utility kullan
  const runTest = async (test) => {
    if (runningTests.has(test.id)) {
      toast.warning('Bu test zaten çalışıyor!');
      return;
    }

    const testData = { testName: test.name, steps: test.steps };
    
    await runTestWithHandling(testData, {
      onStart: () => {
        setRunningTests(prev => new Set([...prev, test.id]));
        
        // Test durumunu güncelle
        const updatedTest = { ...test, status: 'running' };
        const updatedTests = tests.map(t => t.id === test.id ? updatedTest : t);
        setTests(updatedTests);
        
        toast.info(`${test.name} testi başlatılıyor...`);
      },
      onSuccess: (result) => {
        // Test sonucunu Reports sayfası için kaydet
        saveTestReport(result, test);
        
        // Test durumunu güncelle
        const finalTest = {
          ...test,
          status: 'success',
          lastRun: formatDateTime(new Date()),
          duration: calculateTestDuration(result)
        };

        const finalTests = tests.map(t => t.id === test.id ? finalTest : t);
        setTests(finalTests);
        setToStorage('savedTestFlows', finalTests);
        
        toast.success(`${test.name} testi başarıyla tamamlandı!`);
      },
      onError: (result) => {
        // Hata durumunda test raporunu kaydet
        saveTestReport(result, test);
        
        // Test durumunu güncelle
        const errorResult = {
          ...test,
          status: 'error',
          lastRun: formatDateTime(new Date()),
          duration: calculateTestDuration(result) // Gerçek süreyi hesapla
        };

        const finalTests = tests.map(t => t.id === test.id ? errorResult : t);
        setTests(finalTests);
        setToStorage('savedTestFlows', finalTests);
        
        toast.error(`${test.name} testi başarısız oldu!`);
      },
      onFinally: () => {
        setRunningTests(prev => {
          const newSet = new Set(prev);
          newSet.delete(test.id);
          return newSet;
        });
      }
    });
  };

  // Test raporu kaydetme - ortak utility kullan
  const saveTestReport = (testResult, test) => {
    const testData = { testName: test.name, steps: test.steps };
    saveTestReportToStorage(testResult, testData);
  };

  // calculateTestDuration artık reportUtils'de, yerel fonksiyonu kaldır

  // Test düzenleme işlevi - storage utility kullan
  const editTest = (test) => {
    console.log('editTest çağrıldı, test data:', test);
    
    // Test verilerini geçici olarak kaydet - utility kullan
    setTempData('editingTest', test);
    console.log('Test verileri geçici olarak kaydedildi');
    
    // Editor sayfasına yönlendir
    navigate(`/test-editor?edit=${test.id}`);
    console.log('Editor sayfasına yönlendiriliyor, URL:', `/test-editor?edit=${test.id}`);
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
      notify.saveSuccess(`${test.name} dışa aktarıldı`);
    } catch (error) {
      console.error('Export hatası:', error);
      notify.saveError('Test dışa aktarma');
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
                    {getBrowserIcon(test.browser, 16)}
                    {test.browser || 'chrome'}
                  </span>
                </div>
              </div>

              <div className="test-card-footer">
                <div className="test-status">
                  <span className={`status-badge status-${test.status || 'pending'}`}>
                    {getStatusText(test.status || 'pending')}
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