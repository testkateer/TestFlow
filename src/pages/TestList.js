import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Settings, 
  Play, 
  Edit, 
  Clock, 
  Download, 
  MoreHorizontal,
  Trash2,
  Copy,
  Heart,
  CheckSquare,
  Square,
  X
} from 'lucide-react';
import { exportTestFlow } from '../utils/testUtils';
import { runTestWithHandling } from '../utils/testRunner';
import { getFromStorage, setToStorage,  setTempData } from '../utils/storageUtils';
import { getStatusText, getBrowserIcon } from '../utils/statusUtils';
import { formatDateTime} from '../utils/dateUtils';
import { saveTestReportToStorage, calculateTestDuration } from '../utils/reportUtils';
import { toast, notify } from '../utils/notificationUtils';
import { confirmActions } from '../utils/modalUtils';
import '../styles/main.css';

const TestList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBrowser, setFilterBrowser] = useState('all');
  const [tests, setTests] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [runningTests, setRunningTests] = useState(new Set());
  const [selectedTests, setSelectedTests] = useState(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

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
    navigate(`/editor?edit=${test.id}`);
    console.log('Editor sayfasına yönlendiriliyor, URL:', `/editor?edit=${test.id}`);
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

  // Test kopyalama işlevi
  const copyTest = (test) => {
    try {
      // Yeni ID oluştur
      const newId = Date.now().toString();
      
      // Kopyalanan test için yeni isim oluştur
      const copyName = `${test.name} - Kopya`;
      
      // Yeni test objesi oluştur
      const copiedTest = {
        ...test,
        id: newId,
        name: copyName,
        status: 'pending', // Yeni kopyalanan test beklemede durumunda
        lastRun: null, // Son çalıştırma bilgisini sıfırla
        duration: null, // Süre bilgisini sıfırla
        createdAt: new Date().toISOString() // Yeni oluşturma tarihi
      };
      
      // Mevcut testlere ekle
      const updatedTests = [...tests, copiedTest];
      setTests(updatedTests);
      setToStorage('savedTestFlows', updatedTests);
      
      setOpenDropdownId(null);
      notify.saveSuccess(`${test.name} kopyalandı`);
      
      // Kopyalanan testi düzenleme modunda aç
      setTimeout(() => {
        editTest(copiedTest);
      }, 500);
      
    } catch (error) {
      console.error('Kopyalama hatası:', error);
      notify.saveError('Test kopyalama');
    }
  };

  // Favori test işlemleri
  const toggleFavorite = (testId) => {
    const updatedTests = tests.map(test => {
      if (test.id === testId) {
        return { ...test, isFavorite: !test.isFavorite };
      }
      return test;
    });
    
    setTests(updatedTests);
    setToStorage('savedTestFlows', updatedTests);
    
    const test = tests.find(t => t.id === testId);
    const action = test.isFavorite ? 'favorilerden çıkarıldı' : 'favorilere eklendi';
    notify.saveSuccess(`${test.name} ${action}`);
  };

  // Çoklu seçim işlemleri
  const toggleTestSelection = (testId) => {
    const newSelected = new Set(selectedTests);
    if (newSelected.has(testId)) {
      newSelected.delete(testId);
    } else {
      newSelected.add(testId);
    }
    setSelectedTests(newSelected);
  };

  const selectAllTests = () => {
    const allTestIds = new Set(filteredTests.map(test => test.id));
    setSelectedTests(allTestIds);
  };

  const clearSelection = () => {
    setSelectedTests(new Set());
    setIsMultiSelectMode(false);
  };

  // Toplu işlemler
  const bulkDelete = async () => {
    if (selectedTests.size === 0) return;
    
    const confirmed = await confirmActions.delete(`${selectedTests.size} test`);
    if (confirmed) {
      const updatedTests = tests.filter(test => !selectedTests.has(test.id));
      setTests(updatedTests);
      setToStorage('savedTestFlows', updatedTests);
      notify.deleteSuccess(`${selectedTests.size} test silindi`);
      clearSelection();
    }
  };

  const bulkExport = () => {
    if (selectedTests.size === 0) return;
    
    try {
      const selectedTestsData = tests.filter(test => selectedTests.has(test.id));
      
      selectedTestsData.forEach(test => {
        const testData = {
          testName: test.name,
          steps: test.steps || []
        };
        exportTestFlow(testData);
      });
      
      notify.saveSuccess(`${selectedTests.size} test dışarı aktarıldı`);
      clearSelection();
    } catch (error) {
      console.error('Toplu export hatası:', error);
      notify.saveError('Toplu dışarı aktarma');
    }
  };

  const bulkCopy = () => {
    if (selectedTests.size === 0) return;
    
    try {
      const selectedTestsData = tests.filter(test => selectedTests.has(test.id));
      const copiedTests = [];
      
      selectedTestsData.forEach(test => {
        const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const copyName = `${test.name} - Kopya`;
        
        const copiedTest = {
          ...test,
          id: newId,
          name: copyName,
          status: 'pending',
          lastRun: null,
          duration: null,
          createdAt: new Date().toISOString()
        };
        
        copiedTests.push(copiedTest);
      });
      
      const updatedTests = [...tests, ...copiedTests];
      setTests(updatedTests);
      setToStorage('savedTestFlows', updatedTests);
      
      notify.saveSuccess(`${selectedTests.size} test kopyalandı`);
      clearSelection();
    } catch (error) {
      console.error('Toplu kopyalama hatası:', error);
      notify.saveError('Toplu kopyalama');
    }
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || test.status === filterStatus;
    const matchesBrowser = filterBrowser === 'all' || test.browser === filterBrowser;
    const matchesFavorite = !showFavorites || test.isFavorite;
    
    return matchesSearch && matchesStatus && matchesBrowser && matchesFavorite;
  });

  return (
    <div className="test-list-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Akışlar</h1>
          <p>Tüm test senaryolarınızı görüntüleyin ve yönetin</p>
        </div>
        <div className="header-actions">
          <button 
            className={`btn btn-secondary ${showFavorites ? 'active' : ''}`}
            onClick={() => setShowFavorites(!showFavorites)}
          >
            <Heart size={16} />
            {showFavorites ? 'Tüm Testler' : 'Favoriler'}
          </button>
          <button 
            className={`btn btn-secondary ${isMultiSelectMode ? 'active' : ''}`}
            onClick={() => {
              if (isMultiSelectMode) {
                clearSelection();
              } else {
                setIsMultiSelectMode(true);
              }
            }}
          >
            <CheckSquare size={16} />
            {isMultiSelectMode ? 'Seçimi İptal' : 'Çoklu Seçim'}
          </button>
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
          {searchTerm && (
            <button 
              className="search-clear-btn" 
              onClick={() => setSearchTerm('')}
              title="Aramayı temizle"
            >
              <X size={16} />
            </button>
          )}
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
          

        </div>
      </div>

      {/* Toplu İşlemler */}
      {isMultiSelectMode && (
        <div className="bulk-actions-bar card">
          <div className="bulk-selection">
            <span>{selectedTests.size} test seçildi</span>
            {selectedTests.size < filteredTests.length && (
              <button 
                className="btn btn-sm btn-secondary"
                onClick={selectAllTests}
              >
                Tümünü Seç
              </button>
            )}
            <button 
              className="btn btn-sm btn-secondary"
              onClick={clearSelection}
            >
              <X size={14} />
              Temizle
            </button>
          </div>
          
          {selectedTests.size > 0 && (
            <div className="bulk-actions">
              <button 
                className="btn btn-sm btn-secondary"
                onClick={bulkCopy}
              >
                <Copy size={14} />
                Kopyala ({selectedTests.size})
              </button>
              <button 
                className="btn btn-sm btn-secondary"
                onClick={bulkExport}
              >
                <Download size={14} />
                Dışarı Aktar ({selectedTests.size})
              </button>
              <button 
                className="btn btn-sm btn-danger"
                onClick={bulkDelete}
              >
                <Trash2 size={14} />
                Sil ({selectedTests.size})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Test Listesi */}
      <div className="tests-container">
        <div className="tests-header">
          <span className="results-count">
            {filteredTests.length} test bulundu
            {showFavorites && ` (${tests.filter(t => t.isFavorite).length} favori)`}
          </span>
        </div>

        <div className="tests-grid">
          {filteredTests.map((test) => (
            <div key={test.id} className={`test-card card ${selectedTests.has(test.id) ? 'selected' : ''}`}>
              <div className="test-card-header">
                {isMultiSelectMode && (
                  <div className="test-checkbox">
                    <button
                      className="checkbox-btn"
                      onClick={() => toggleTestSelection(test.id)}
                    >
                      {selectedTests.has(test.id) ? 
                        <CheckSquare size={18} className="checked" /> : 
                        <Square size={18} />
                      }
                    </button>
                  </div>
                )}
                <div className="test-info">
                  <div className="test-name-row">
                    <h3 className="test-name">{test.name}</h3>
                    <button
                      className={`favorite-btn ${test.isFavorite ? 'active' : ''}`}
                      onClick={() => toggleFavorite(test.id)}
                      title={test.isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                    >
                      <Heart size={16} />
                    </button>
                  </div>
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
                        className="dropdown-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          editTest(test);
                        }}
                      >
                        <Edit size={14} />
                        Düzenle
                      </button>
                      <button 
                        className="dropdown-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyTest(test);
                        }}
                      >
                        <Copy size={14} />
                        Kopyala
                      </button>
                      <button 
                        className="dropdown-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(test.id);
                        }}
                      >
                        <Heart size={14} />
                        {test.isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                      </button>
                      <button 
                        className="dropdown-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportTest(test);
                        }}
                      >
                        <Download size={14} />
                        Dışarı Aktar
                      </button>
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
                    {test.type === 'scheduled' && (
                      <>
                        <Clock size={12} />
                        Planlı
                      </>
                    )}
                    {(!test.type || test.type === 'manual') && (
                      <>
                        <Settings size={12} />
                        Manuel
                      </>
                    )}
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
                  <button className="btn btn-secondary btn-sm">
                    <Clock size={14} />
                    Zamanla
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