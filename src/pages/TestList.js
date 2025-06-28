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
  X,
  Upload,
  AlertCircle
} from 'lucide-react';
import { exportTestFlow, importTestFlow } from '../utils/testUtils';
import { runTestWithHandling } from '../utils/testRunner';
import { getFromStorage, setToStorage,  setTempData } from '../utils/storageUtils';
import { getStatusText, getBrowserIcon } from '../utils/statusUtils';
import { formatDateTime} from '../utils/dateUtils';
import { saveTestReportToStorage, calculateTestDuration } from '../utils/reportUtils';
import { toast } from '../utils/notifications';
import { confirmActions, modal, confirm } from '../utils/modalUtils';
import { LoadingState, ErrorState, NoDataState, PageHeader } from '../components';
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Kaydedilmiş testleri yükle - storage utility kullan
  useEffect(() => {
    const loadSavedTests = () => {
      try {
        setIsLoading(true);
        setError(null);
        const savedTests = getFromStorage('savedTestFlows', []);
        setTests(savedTests);
      } catch (err) {
        setError('Test akışlarını yüklerken bir hata oluştu');
        console.error('Test yükleme hatası:', err);
      } finally {
        setIsLoading(false);
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
      toast.deleteSuccess(testName);
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
        
        // Başlatma bildirimi runTestWithHandling tarafından gösterilecek
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
        
        // Başarı bildirimi runTestWithHandling tarafından gösterilecek
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
        
        // Hata bildirimi runTestWithHandling tarafından gösterilecek
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
      toast.saveSuccess(`${test.name} dışa aktarıldı`);
    } catch (error) {
      console.error('Export hatası:', error);
      toast.saveError('Test dışa aktarma');
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
      toast.saveSuccess(`${test.name} kopyalandı`);
      
      // Kopyalanan testi düzenleme modunda aç
      setTimeout(() => {
        editTest(copiedTest);
      }, 500);
      
    } catch (error) {
      console.error('Kopyalama hatası:', error);
      toast.saveError('Test kopyalama');
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
    toast.saveSuccess(`${test.name} ${action}`);
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
      toast.deleteSuccess(`${selectedTests.size} test silindi`);
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
      
      toast.saveSuccess(`${selectedTests.size} test dışarı aktarıldı`);
      clearSelection();
    } catch (error) {
      console.error('Toplu export hatası:', error);
      toast.saveError('Toplu dışarı aktarma');
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
      
      toast.saveSuccess(`${selectedTests.size} test kopyalandı`);
      clearSelection();
    } catch (error) {
      console.error('Toplu kopyalama hatası:', error);
      toast.saveError('Toplu kopyalama');
    }
  };

  // Toplu içeri aktarma işlevi
  const handleImportTests = async () => {
    try {
      // Adım türlerini al (step tiplerini belirtmek için)
      const stepTypes = [
        { id: 'navigation', icon: 'Globe' },
        { id: 'click', icon: 'MousePointer' },
        { id: 'input', icon: 'Type' },
        { id: 'screenshot', icon: 'Camera' },
        { id: 'wait', icon: 'Clock' },
        { id: 'assertion', icon: 'CheckCircle' },
        { id: 'custom', icon: 'Code' }
      ];

      // Dosya seçme diyaloğu oluştur
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';
      fileInput.multiple = true; // Çoklu dosya seçimine izin ver
      fileInput.click();

      fileInput.onchange = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        let importedTests = [];
        let errorCount = 0;
        
        // Her dosya için işleme yap
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          try {
            // importTestFlow fonksiyonu için onImportSuccess callback'i tanımla
            const onImportSuccess = (importedData) => {
              // Yeni ID oluştur
              const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
              
              // Test nesnesini oluştur
              const importedTest = {
                id: newId,
                name: importedData.testName,
                steps: importedData.steps,
                status: 'pending',
                lastRun: null,
                duration: null,
                createdAt: new Date().toISOString(),
                browser: importedData.browser || 'chrome'
              };
              
              importedTests.push(importedTest);
            };
            
            // Dosyayı içeri aktar - özel dosya parametresi ile
            await importTestFlow(stepTypes, onImportSuccess, file);
          } catch (error) {
            console.error(`${file.name} için içeri aktarma hatası:`, error);
            errorCount++;
          }
        }
        
        // Çakışma kontrolü yap
        const existingTestNames = tests.map(test => test.name.toLowerCase());
        const conflictingTests = [];
        const nonConflictingTests = [];
        
        importedTests.forEach(test => {
          if (existingTestNames.includes(test.name.toLowerCase())) {
            conflictingTests.push(test);
          } else {
            nonConflictingTests.push(test);
          }
        });
        
        // Çakışmayan testleri direkt içeri aktar
        if (nonConflictingTests.length > 0) {
          const updatedTests = [...tests, ...nonConflictingTests];
          setTests(updatedTests);
          setToStorage('savedTestFlows', updatedTests);
          
          toast.saveSuccess(`${nonConflictingTests.length} test içeri aktarıldı`);
        }
        
        // Çakışan testler varsa modal göster
        if (conflictingTests.length > 0) {
          // Çakışma çözme modalını göster
          await handleConflictingTests(conflictingTests);
        }
        
        if (errorCount > 0) {
          toast.saveError(`${errorCount} dosya içeri aktarılamadı`);
        }
      };
    } catch (error) {
      console.error('İçeri aktarma hatası:', error);
      toast.saveError('Test içeri aktarma');
    }
  };

  // Çakışan testleri yönetme fonksiyonu
  const handleConflictingTests = async (conflictingTests) => {
    if (conflictingTests.length === 0) return;
    
    // Tek bir test için çakışma çözme
    if (conflictingTests.length === 1) {
      const test = conflictingTests[0];
      const existingTest = tests.find(t => t.name.toLowerCase() === test.name.toLowerCase());
      
      const action = await confirm({
        title: 'Test İsmi Çakışması',
        message: `"${test.name}" isimli bir test zaten mevcut. Ne yapmak istersiniz?`,
        confirmText: 'Üzerine Yaz',
        cancelText: 'Yeni İsimle Kaydet',
        confirmVariant: 'warning',
        showCloseButton: true,
        closeOnEsc: true,
        closeOnOverlay: true,
        onClose: () => {
          // X butonuna basıldığında veya ESC/overlay tıklamasında hiçbir işlem yapma
          toast.importCanceled();
          return null;
        }
      });
      
      if (action === true) {
        // Üzerine yaz
        const updatedTests = tests.map(t => {
          if (t.id === existingTest.id) {
            return {
              ...t,
              steps: test.steps,
              browser: test.browser,
              updatedAt: new Date().toISOString()
            };
          }
          return t;
        });
        
        setTests(updatedTests);
        setToStorage('savedTestFlows', updatedTests);
        toast.saveSuccess(`"${test.name}" testi güncellendi`);
      } else if (action === false) {
        // Yeni isimle kaydet
        const newName = `${test.name} (Kopyası)`;
        const newTest = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: newName,
          steps: test.steps,
          status: 'pending',
          lastRun: null,
          duration: null,
          createdAt: new Date().toISOString(),
          browser: test.browser
        };
        
        const updatedTests = [...tests, newTest];
        setTests(updatedTests);
        setToStorage('savedTestFlows', updatedTests);
        toast.saveSuccess(`"${newName}" testi oluşturuldu`);
      }
      // Eğer modal kapatılırsa hiçbir şey yapma
    } 
    // Birden fazla çakışan test varsa
    else {
      // Toplu çakışma çözme için özel bir modal göster
      const modalContent = (
        <div className="conflict-resolution-modal">
          <div className="conflict-header">
            <AlertCircle size={24} color="#f59e0b" />
            <h3>{conflictingTests.length} adet test ismi çakışması</h3>
          </div>
          <p className="conflict-description">
            Aşağıdaki testler mevcut testlerle aynı isimlere sahip. Her biri için ne yapmak istediğinizi seçin.
          </p>
          <div className="conflict-list">
            {conflictingTests.map((test, index) => (
              <div key={index} className="conflict-item">
                <div className="conflict-test-info">
                  <strong>{test.name}</strong>
                </div>
                <div className="conflict-actions">
                  <button 
                    className="btn btn-sm btn-warning"
                    onClick={() => handleSingleConflict(test, 'overwrite')}
                  >
                    Üzerine Yaz
                  </button>
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleSingleConflict(test, 'rename')}
                  >
                    Yeni İsimle Kaydet
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleSingleConflict(test, 'skip')}
                  >
                    Atla
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="conflict-bulk-actions">
            <button 
              className="btn btn-warning"
              onClick={() => handleBulkConflicts(conflictingTests, 'overwrite')}
            >
              Tümünün Üzerine Yaz
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => handleBulkConflicts(conflictingTests, 'rename')}
            >
              Tümünü Yeni İsimle Kaydet
            </button>
            <button 
              className="btn btn-danger"
              onClick={() => handleBulkConflicts(conflictingTests, 'skip')}
            >
              Tümünü Atla
            </button>
          </div>
        </div>
      );
      
      // Modal'ı göster
      const { id, resolve } = await modal.show({
        title: 'Test İsmi Çakışmaları',
        content: modalContent,
        width: '600px',
        showCloseButton: true,
        closeOnEsc: true,
        closeOnOverlay: true,
        onClose: () => {
          // X butonuna basıldığında veya ESC/overlay tıklamasında hiçbir işlem yapma
          toast.importCanceled();
          resolve(null);
        }
      });
      
      // Modal'ı kapatma fonksiyonu
      const closeModal = () => {
        modal.close(id);
        resolve(null);
      };
      
      // Tek bir çakışmayı çözme
      const handleSingleConflict = async (test, action) => {
        const existingTest = tests.find(t => t.name.toLowerCase() === test.name.toLowerCase());
        let updatedTests = [...tests];
        
        if (action === 'overwrite') {
          // Üzerine yaz
          updatedTests = tests.map(t => {
            if (t.id === existingTest.id) {
              return {
                ...t,
                steps: test.steps,
                browser: test.browser,
                updatedAt: new Date().toISOString()
              };
            }
            return t;
          });
          
          toast.saveSuccess(`"${test.name}" testi güncellendi`);
        } else if (action === 'rename') {
          // Yeni isimle kaydet
          const newName = `${test.name} (Kopyası)`;
          const newTest = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: newName,
            steps: test.steps,
            status: 'pending',
            lastRun: null,
            duration: null,
            createdAt: new Date().toISOString(),
            browser: test.browser
          };
          
          updatedTests = [...tests, newTest];
          toast.saveSuccess(`"${newName}" testi oluşturuldu`);
        } else if (action === 'skip') {
          // Atla - hiçbir şey yapma
          toast.info(`"${test.name}" testi atlandı`);
        }
        
        // Çakışan testi listeden kaldır
        const updatedConflictingTests = conflictingTests.filter(t => 
          t.name.toLowerCase() !== test.name.toLowerCase()
        );
        
        // Testleri güncelle
        setTests(updatedTests);
        setToStorage('savedTestFlows', updatedTests);
        
        // Eğer başka çakışan test kalmadıysa modal'ı kapat
        if (updatedConflictingTests.length === 0) {
          closeModal();
        }
      };
      
      // Toplu çakışma çözme
      const handleBulkConflicts = async (conflictTests, action) => {
        let updatedTests = [...tests];
        
        if (action === 'overwrite') {
          // Tümünün üzerine yaz
          conflictTests.forEach(test => {
            const existingTest = tests.find(t => t.name.toLowerCase() === test.name.toLowerCase());
            updatedTests = updatedTests.map(t => {
              if (t.id === existingTest.id) {
                return {
                  ...t,
                  steps: test.steps,
                  browser: test.browser,
                  updatedAt: new Date().toISOString()
                };
              }
              return t;
            });
          });
          
          toast.saveSuccess(`${conflictTests.length} test güncellendi`);
        } else if (action === 'rename') {
          // Tümünü yeni isimle kaydet
          const newTests = conflictTests.map(test => ({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + Math.random(),
            name: `${test.name} (Kopyası)`,
            steps: test.steps,
            status: 'pending',
            lastRun: null,
            duration: null,
            createdAt: new Date().toISOString(),
            browser: test.browser
          }));
          
          updatedTests = [...tests, ...newTests];
          toast.saveSuccess(`${newTests.length} yeni test oluşturuldu`);
        } else if (action === 'skip') {
          // Tümünü atla - hiçbir şey yapma
          toast.info(`${conflictTests.length} test atlandı`);
        }
        
        // Testleri güncelle
        setTests(updatedTests);
        setToStorage('savedTestFlows', updatedTests);
        
        // Modal'ı kapat
        closeModal();
      };
    }
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = searchTerm === '' || 
      (test.name && test.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (test.description && test.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || test.status === filterStatus;
    const matchesBrowser = filterBrowser === 'all' || test.browser === filterBrowser;
    const matchesFavorite = !showFavorites || test.isFavorite;
    
    return matchesSearch && matchesStatus && matchesBrowser && matchesFavorite;
  });
  
  // Eğer yükleme durumundaysa LoadingState göster
  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader 
          title="Akışlar" 
          subtitle="Tüm test senaryolarınızı görüntüleyin ve yönetin" 
        />
        <LoadingState message="Test akışları yükleniyor..." />
      </div>
    );
  }

  // Eğer hata varsa ErrorState göster
  if (error) {
    return (
      <div className="page-container">
        <PageHeader 
          title="Akışlar" 
          subtitle="Tüm test senaryolarınızı görüntüleyin ve yönetin" 
        />
        <ErrorState message={error} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader 
        title="Akışlar" 
        subtitle="Tüm test senaryolarınızı görüntüleyin ve yönetin"
        actions={
          <>
            <button 
              className="btn btn-secondary"
              onClick={handleImportTests}
              title="Test senaryolarını içeri aktar"
            >
              <Upload size={16} />
              İçeri Aktar
            </button>
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
          </>
        }
      />

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
          {filteredTests.length === 0 ? (
            <NoDataState 
              title="Kaydedilmiş test akışı yok" 
              message={showFavorites ? "Henüz bir test akışı oluşturulmamış." : 
                searchTerm || filterStatus !== 'all' || filterBrowser !== 'all' ? 
                "Arama veya filtreleme kriterlerinize uygun test bulunamadı." : 
                "Henüz bir test akışı oluşturulmamış."}
              action={
                <button 
                  className="btn btn-primary" 
                  onClick={() => navigate('/editor')}
                >
                Test Oluştur
                </button>
              }
            />
          ) : (
            filteredTests.map((test) => (
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
                    <h3 className="test-name">
                      {test.name}
                      <span className="test-id-display">{test.id}</span>
                    </h3>
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
          ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TestList; 