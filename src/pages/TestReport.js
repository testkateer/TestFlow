import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  CheckCircle,
  AlertCircle,
  Image,
  Video,
  Monitor,
  ExternalLink,
  Play,
  Edit,
  BarChart3,
  RefreshCw,
  ClipboardList,
} from 'lucide-react';
import { downloadTestReport, setTempData } from '../utils/dataUtils';
import { runTestWithHandling } from '../utils/testRunner';
import { toast } from '../utils/notifications';
import { useTestFlow } from '../contexts/TestFlowContext';
import { getStatusIcon } from '../utils/statusUtils';
import { LoadingState, ErrorState } from '../components';
import '../styles/main.css';

const TestReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getReportById, addTestReport } = useTestFlow();
  const [activeTab, setActiveTab] = useState('overview');
  const [testDetails, setTestDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTestReport = () => {
      try {
        const report = getReportById(parseInt(id));

        if (report) {
          // Test sonuçlarından istatistikleri hesapla
          const totalSteps = report.totalSteps || (report.results ? report.results.length : 0);
          const successfulSteps = report.successfulSteps || report.passedSteps || 0;
          const failedSteps = totalSteps - successfulSteps;
          
          // Tarih formatını düzelt
          const reportDate = new Date(report.timestamp || report.date);
          const formattedDate = reportDate.toLocaleDateString('tr-TR');
          const formattedTime = reportDate.toLocaleTimeString('tr-TR');
          
          // Rapor verisini TestReport formatına çevir
          const formattedReport = {
            id: report.id,
            name: report.testName || report.name || 'İsimsiz Test',
            description: report.description || `${totalSteps} adımlı test raporu`,
            browser: 'Chrome 120.0',
            resolution: '1920x1080',
            createdDate: formattedDate,
            lastRun: `${formattedDate} ${formattedTime}`,
            status: report.status || 'unknown',
            duration: report.duration || '0s',
            totalSteps: totalSteps,
            passedSteps: successfulSteps,
            failedSteps: failedSteps
          };
          setTestDetails(formattedReport);
        } else {
          // Rapor bulunamadı
          console.error('Rapor bulunamadı:', id);
          setTestDetails(null);
        }
      } catch (error) {
        console.error('Rapor yükleme hatası:', error);
        setTestDetails(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadTestReport();
    } else {
      setLoading(false);
    }
  }, [id, getReportById]);

  // Gerçek test verilerinden stepDetails oluştur
  const getStepDetailsFromReport = () => {
    try {
      const report = getReportById(parseInt(id));

      if (report && report.results) {
        return report.results.map((result, index) => {
          const isSuccess = result.result?.success === true;
          const stepConfig = result.step?.config || {};
          
          // Adım açıklaması oluştur
          let description = '';
          if (stepConfig.url) {
            description = stepConfig.url;
          } else if (stepConfig.selector) {
            description = stepConfig.selector;
          } else if (stepConfig.text) {
            description = stepConfig.text;
          } else if (stepConfig.description) {
            description = stepConfig.description;
          } else {
            description = isSuccess ? 'Başarıyla tamamlandı' : 'Test adımı başarısız';
          }
          
          return {
            id: index + 1,
            name: result.step?.name || `Adım ${index + 1}`,
            type: result.step?.type || 'unknown',
            status: isSuccess ? 'success' : 'error',
            duration: result.result?.duration || '1.0s',
            description: description,
            screenshot: true,
            error: isSuccess ? null : (result.result?.error || result.result?.message || 'Adım başarısız oldu')
          };
        });
      }
    } catch (error) {
      console.error('Step details oluşturma hatası:', error);
    }

    // Fallback - basit step listesi
    const stepCount = testDetails?.totalSteps || 0;
    const passedCount = testDetails?.passedSteps || 0;

    return Array.from({ length: stepCount }, (_, index) => ({
      id: index + 1,
      name: `Test Adımı ${index + 1}`,
      type: 'unknown',
      status: index < passedCount ? 'success' : 'error',
      duration: '1.0s',
      description: index < passedCount ? 'Başarıyla tamamlandı' : 'Adım başarısız oldu',
      screenshot: true,
      error: index >= passedCount ? 'Test adımı başarısız oldu' : null
    }));
  };

  const stepDetails = getStepDetailsFromReport();

  // Execution history'yi bu test için gerçek verilerden oluştur
  const getExecutionHistory = () => {
    try {
      const report = getReportById(parseInt(id));
      if (!report) return [];

      // Aynı test için tüm raporları bul
      // Bu basit implementasyon - gelecekte test ID'ye göre filtrelenebilir
      return [report].slice(0, 5).map((report, index) => {
        const reportDate = new Date(report.timestamp || report.date);
        const formattedDateTime = `${reportDate.toLocaleDateString('tr-TR')} ${reportDate.toLocaleTimeString('tr-TR')}`;
        
        return {
          id: report.id,
          date: formattedDateTime,
          status: report.status || 'unknown',
          duration: report.duration || '0s',
          trigger: report.trigger || 'Manuel'
        };
      });
    } catch (error) {
      console.error('Execution history oluşturma hatası:', error);
      return [{
        id: testDetails?.id || 1,
        date: testDetails?.lastRun || 'Bilinmiyor',
        status: testDetails?.status || 'unknown',
        duration: testDetails?.duration || '0s',
        trigger: 'Manuel'
      }];
    }
  };

  const executionHistory = getExecutionHistory();

  // Gerçek hata detaylarını al
  const getErrorDetails = () => {
    const failedSteps = stepDetails.filter(step => step.status === 'error' && step.error);
    return failedSteps.length > 0 ? failedSteps[0] : null; // İlk hatayı göster
  };

  const errorDetails = getErrorDetails();

  const getStepTypeIcon = (type) => {
    switch (type) {
      case 'navigation': return <Monitor size={14} />;
      case 'click': return <ExternalLink size={14} />;
      case 'input': return <Edit size={14} />;
      case 'verify': return <CheckCircle size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  const handleDownloadReport = () => {
    try {
      const originalReport = getReportById(parseInt(id));

      if (originalReport) {
        downloadTestReport(originalReport);
        toast.success(`"${originalReport.testName || 'Test'}" raporu başarıyla indirildi`);
      } else {
        toast.error('Rapor verisi bulunamadı.');
      }
    } catch (error) {
      console.error('Rapor indirme hatası:', error);
      toast.reportDownloadError();
    }
  };

  // Test düzenleme işlevi - TestList.js ile aynı mantık
  const editTest = (testData) => {
    // Test verilerini geçici olarak kaydet - utility kullan
    setTempData('editingTest', testData);
    
    // Editor sayfasına yönlendir
    navigate(`/editor?edit=${testData.id}`);
  };

  // Rapordaki test verisini editTest için uygun formata çevir
  const handleEditTest = () => {
    try {
      const originalReport = getReportById(parseInt(id));

      if (originalReport && originalReport.results && originalReport.results.length > 0) {
        // Test verisini TestList formatına çevir
        const testData = {
          id: originalReport.id || Date.now(),
          name: originalReport.testName,
          description: originalReport.description || 'Test raporu',
          steps: originalReport.results.map((result, index) => ({
            id: Date.now() + index,
            type: result.step?.type || 'unknown',
            name: result.step?.name || `Adım ${index + 1}`,
            icon: getStepIcon(result.step?.type),
            config: result.step?.config || {}
          })),
          browser: 'chrome',
          status: originalReport.status || 'pending',
          createdAt: originalReport.date || new Date().toISOString()
        };

        // Standardize edilmiş editTest fonksiyonunu kullan
        editTest(testData);
              } else {
          toast.warning('Test adımları bulunamadı. Test düzenlenemiyor.');
        }
    } catch (error) {
      console.error('Test düzenleme hatası:', error);
      toast.error('Test düzenlenirken bir hata oluştu.');
    }
  };

  // Test çalıştırma işlevi - TestList.js ile aynı mantık
  const runTest = async (testData) => {
    await runTestWithHandling(testData, {
      onStart: () => {
        // Başlatma bildirimi runTestWithHandling tarafından gösterilecek
      },
      onSuccess: async (result) => {
        // Başarı bildirimi runTestWithHandling tarafından gösterilecek
        
        // Test sonucunu Reports sayfası için kaydet
        await addTestReport(result);
        
        // Sayfa yenilensin ki yeni rapor görülsün
        setTimeout(() => {
          navigate(`/report/${id}`, { replace: true });
        }, 1000);
      },
      onError: async (result) => {
        // Hata durumunda test raporunu kaydet
        await addTestReport(result);
        // Hata bildirimi runTestWithHandling tarafından gösterilecek
        
        // Sayfa yenilensin ki yeni rapor görülsün
        setTimeout(() => {
          navigate(`/report/${id}`, { replace: true });
        }, 1000);
      }
    });
  };

  // Rapordaki test verisini runTest için uygun formata çevir
  const handleRunTest = async () => {
    try {
      const originalReport = getReportById(parseInt(id));

      if (originalReport && originalReport.results && originalReport.results.length > 0) {
        // Test verilerini TestList formatına çevir
        const testData = {
          testName: originalReport.testName,
          steps: originalReport.results.map((result, index) => ({
            id: Date.now() + index,
            type: result.step?.type || 'unknown',
            name: result.step?.name || `Adım ${index + 1}`,
            config: result.step?.config || {}
          }))
        };

        // Standardize edilmiş runTest fonksiyonunu kullan
        await runTest(testData);
      } else {
        toast.warning('Test adımları bulunamadı. Test çalıştırılamıyor.');
      }
    } catch (error) {
      console.error('Test çalıştırma hatası:', error);
      toast.error('Test çalıştırılırken bir hata oluştu.');
    }
  };

  const getStepIcon = (stepType) => {
    // TestEditor'daki stepTypes ile uyumlu icon mapping
    const iconMap = {
      'navigate': 'Navigation',
      'click': 'MousePointer',
      'input': 'Type',
      'wait': 'Clock',
      'verify': 'Eye',
      'refresh': 'RefreshCw'
    };
    return iconMap[stepType] || 'AlertCircle';
  };

  // Loading durumu
  if (loading) {
    return (
      <div className="page-container">
        <LoadingState 
          message="Rapor yükleniyor..." 
          size="large"
          icon={<div style={{ fontSize: '48px' }}>⏳</div>}
        />
      </div>
    );
  }

  // Rapor bulunamadı durumu
  if (!testDetails) {
    return (
      <div className="page-container">
        <ErrorState 
          message="Bu ID'ye sahip bir test raporu bulunamadı." 
          size="large"
          icon={<div style={{ fontSize: '48px' }}>❌</div>}
          action={
            <button className="btn btn-primary" onClick={() => navigate('/reports')}>
              Raporlara Geri Dön
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="report-header">
        <div className="header-navigation">
          <button className="btn btn-secondary" onClick={() => navigate('/reports')}>
            <ArrowLeft size={16} />
            Geri
          </button>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary">
            <Video size={16} />
            Video Kaydını İzle
          </button>
          <button className="btn btn-secondary">
            <Download size={16} />
            Ekran Görüntülerini İndir
          </button>

          <button className="btn btn-secondary" onClick={handleDownloadReport}>
            <Download size={16} />
            Raporu İndir
          </button>
          <button className="btn btn-success" onClick={handleRunTest}>
            <Play size={16} />
            Çalıştır
          </button>
          <button className="btn btn-primary" onClick={handleEditTest}>
            <Edit size={16} />
            Düzenle
          </button>
        </div>
      </div>

      {/* Test Info */}
      <div className="test-info-card card">
        <div className="test-meta">
          <div className="test-title">
            <h1>
              {testDetails.name}
              <span className="test-id-display">{testDetails.id}</span>
            </h1>
            <span className={`status-badge status-${testDetails.status} large`}>
              {getStatusIcon(testDetails.status)}
              {testDetails.status === 'success' && 'Başarılı'}
              {testDetails.status === 'error' && 'Başarısız'}
              {testDetails.status === 'running' && 'Çalışıyor'}
            </span>
          </div>
          <p className="test-description">{testDetails.description}</p>
        </div>

        <div className="test-stats">
          <div className="stat-grid">
            <div className="stat-item">
              <Clock size={16} />
              <div>
                <span className="stat-label">Süre</span>
                <span className="stat-value">{testDetails.duration}</span>
              </div>
            </div>
            <div className="stat-item">
              <Calendar size={16} />
              <div>
                <span className="stat-label">Son Çalıştırma</span>
                <span className="stat-value">{testDetails.lastRun}</span>
              </div>
            </div>
            <div className="stat-item">
              <Monitor size={16} />
              <div>
                <span className="stat-label">Tarayıcı</span>
                <span className="stat-value">{testDetails.browser}</span>
              </div>
            </div>
            <div className="stat-item">
              <CheckCircle size={16} />
              <div>
                <span className="stat-label">Başarı Oranı</span>
                <span className="stat-value">
                  {testDetails.totalSteps > 0 
                    ? Math.round((testDetails.passedSteps / testDetails.totalSteps) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
                      <ClipboardList size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Genel Bakış
        </button>
        <button
          className={`tab-btn ${activeTab === 'steps' ? 'active' : ''}`}
          onClick={() => setActiveTab('steps')}
        >
                      <RefreshCw size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Adım Detayları
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
                      <BarChart3 size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Çalıştırma Geçmişi
        </button>
        <button
          className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`}
          onClick={() => setActiveTab('media')}
        >
          📸 Medya
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="overview-content">
          <div className="overview-grid">
            <div className="test-summary card">
              <div className="summary-header">
                <h3>Test Özeti</h3>
              </div>
              
              <div className="summary-metrics">
                <div className="metric-item">
                  <div className="metric-value">{testDetails.totalSteps}</div>
                  <div className="metric-label">Toplam Adım</div>
                </div>
                <div className="metric-item success">
                  <div className="metric-value">{testDetails.passedSteps}</div>
                  <div className="metric-label">Başarılı</div>
                </div>
                <div className="metric-item error">
                  <div className="metric-value">{testDetails.failedSteps}</div>
                  <div className="metric-label">Başarısız</div>
                </div>
              </div>


            </div>

            {/* Hata Detayları - Sadece hata varsa göster */}
            {errorDetails ? (
              <div className="error-details card">
                <h3>🛑 Hata Detayları</h3>
                <div className="error-info">
                  <div className="error-step">
                    <strong>Adım {errorDetails.id}:</strong> {errorDetails.name}
                  </div>
                  <div className="error-message">
                    <code>{errorDetails.error}</code>
                  </div>
                  <div className="error-suggestions">
                    <h4>Öneriler:</h4>
                    <ul>
                      {errorDetails.type === 'click' && (
                        <>
                          <li>Element seçicisini kontrol edin</li>
                          <li>Sayfanın tamamen yüklendiğinden emin olun</li>
                          <li>Bekleme süresi ekleyin</li>
                        </>
                      )}
                      {errorDetails.type === 'input' && (
                        <>
                          <li>Input alanının var olduğundan emin olun</li>
                          <li>Element focus edilebilir durumda mı kontrol edin</li>
                          <li>Sayfanın tamamen yüklendiğinden emin olun</li>
                        </>
                      )}
                      {errorDetails.type === 'navigate' && (
                        <>
                          <li>URL'nin doğru olduğundan emin olun</li>
                          <li>İnternet bağlantısını kontrol edin</li>
                          <li>Sayfanın erişilebilir olduğundan emin olun</li>
                        </>
                      )}
                      {!['click', 'input', 'navigate'].includes(errorDetails.type) && (
                        <>
                          <li>Adım konfigürasyonunu kontrol edin</li>
                          <li>Element seçicilerini doğrulayın</li>
                          <li>Bekleme süresi ekleyin</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="success-details card">
                <h3>✅ Test Başarısı</h3>
                <div className="success-info">
                  <div className="success-message">
                    🎉 Tüm test adımları başarıyla tamamlandı!
                  </div>
                  <div className="success-details-content">
                    <p>Bu test çalıştırmasında herhangi bir hata ile karşılaşılmadı.</p>
                    <p>Tüm adımlar beklenen şekilde çalıştı ve test başarılı sayıldı.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Steps Tab */}
      {activeTab === 'steps' && (
        <div className="steps-content">
          <div className="steps-list card">
                          <h3>
                <RefreshCw size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Adım Detayları
              </h3>
            <div className="steps-container">
              {stepDetails.map((step, index) => (
                <div key={step.id} className={`step-item ${step.status}`}>
                  <div className="step-number">{index + 1}</div>
                  <div className="step-content">
                    <div className="step-header">
                      <div className="step-title">
                        <span className="step-type">{getStepTypeIcon(step.type)}</span>
                        <span className="step-name">{step.name}</span>
                        {getStatusIcon(step.status)}
                      </div>
                      <div className="step-duration">{step.duration}</div>
                    </div>
                    <div className="step-description">{step.description}</div>
                    {step.error && step.status === 'error' && (
                      <div className="step-error">
                        <strong>Hata:</strong> <code>{step.error}</code>
                      </div>
                    )}
                    <div className="step-actions">
                      {step.screenshot && (
                        <button className="btn btn-secondary btn-sm">
                          <Image size={14} />
                          Ekran Görüntüsü
                        </button>
                      )}
                      <button className="btn btn-secondary btn-sm">
                        <ExternalLink size={14} />
                        Detay
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="history-content">
          <div className="history-table card">
                          <h3>
                <BarChart3 size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Çalıştırma Geçmişi
              </h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Durum</th>
                    <th>Süre</th>
                    <th>Tetikleyici</th>
                    <th>Loglar</th>
                  </tr>
                </thead>
                <tbody>
                  {executionHistory.map((execution) => (
                    <tr key={execution.id}>
                      <td>{execution.date}</td>
                      <td>
                        <span className={`status-badge status-${execution.status}`}>
                          {execution.status === 'success' ? 'Başarılı' : 'Başarısız'}
                        </span>
                      </td>
                      <td>{execution.duration}</td>
                      <td>{execution.trigger}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm">
                          Görüntüle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Media Tab */}
      {activeTab === 'media' && (
        <div className="media-content">
          <div className="media-grid">
            <div className="media-section card">
              <h3>📸 Ekran Görüntüleri</h3>
              <div className="screenshots-grid">
                {stepDetails.filter(step => step.screenshot).map((step, index) => (
                  <div key={step.id} className="screenshot-item">
                    <div className="screenshot-placeholder">
                      <Image size={48} />
                      <span>Adım {step.id}</span>
                    </div>
                    <div className="screenshot-info">
                      <span className="screenshot-name">{step.name}</span>
                      <span className="screenshot-time">{step.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="video-section card">
              <h3>
                <Video size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Video Kaydı
              </h3>
              <div className="video-placeholder">
                <Video size={64} />
                <h4>Test Çalıştırma Videosu</h4>
                <p>Testin tüm adımlarının video kaydı</p>
                <button className="btn btn-primary">
                  <Video size={16} />
                  Videoyu İzle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestReport; 