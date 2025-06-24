import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Download, 
  Share2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Image,
  Video,
  Monitor,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { downloadTestReport } from '../utils/reportUtils';
import '../styles/TestReport.css';

const TestReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [testDetails, setTestDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTestReport = () => {
      try {
        const savedReports = JSON.parse(localStorage.getItem('testReports') || '[]');
        const report = savedReports.find(r => r.id.toString() === id);
        
        if (report) {
          // Rapor verisini TestReport formatına çevir
          const formattedReport = {
            id: report.id,
            name: report.testName,
            description: report.description,
            browser: 'Chrome 120.0',
            resolution: '1920x1080',
            createdDate: report.date,
            lastRun: `${report.date} ${report.time}`,
            status: report.status,
            duration: report.duration,
            totalSteps: report.totalSteps,
            passedSteps: report.passedSteps,
            failedSteps: report.totalSteps - report.passedSteps
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
  }, [id]);

  // Gerçek test verilerinden stepDetails oluştur
  const getStepDetailsFromReport = () => {
    try {
      const savedReports = JSON.parse(localStorage.getItem('testReports') || '[]');
      const report = savedReports.find(r => r.id.toString() === id);
      
      if (report && report.results) {
        return report.results.map((result, index) => ({
          id: index + 1,
          name: result.step?.name || `Adım ${index + 1}`,
          type: result.step?.type || 'unknown',
          status: result.result?.success ? 'success' : 'error',
          duration: result.result?.duration || '0s',
          description: result.result?.message || result.step?.config?.url || result.step?.config?.selector || 'Açıklama yok',
          screenshot: true,
          error: result.result?.success ? null : result.result?.error || result.result?.message
        }));
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
      const savedReports = JSON.parse(localStorage.getItem('testReports') || '[]');
      const currentTestReports = savedReports.filter(r => r.testName === testDetails?.name);
      
      return currentTestReports.slice(0, 5).map((report, index) => ({
        id: report.id,
        date: `${report.date} ${report.time}`,
        status: report.status,
        duration: report.duration,
        trigger: report.trigger
      }));
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle size={16} className="status-icon success" />;
      case 'error': return <XCircle size={16} className="status-icon error" />;
      case 'skipped': return <AlertCircle size={16} className="status-icon skipped" />;
      default: return <AlertCircle size={16} className="status-icon" />;
    }
  };

  const getStepTypeIcon = (type) => {
    switch (type) {
      case 'navigation': return '🌐';
      case 'click': return '👆';
      case 'input': return '⌨️';
      case 'verify': return '👁️';
      default: return '⚡';
    }
  };

  const handleDownloadReport = () => {
    try {
      // localStorage'dan orijinal rapor verisini al
      const savedReports = JSON.parse(localStorage.getItem('testReports') || '[]');
      const originalReport = savedReports.find(r => r.id.toString() === id);
      
      if (originalReport) {
        downloadTestReport(originalReport);
      } else {
        alert('Rapor verisi bulunamadı.');
      }
    } catch (error) {
      console.error('Rapor indirme hatası:', error);
      alert('Rapor indirilirken bir hata oluştu.');
    }
  };

  // Loading durumu
  if (loading) {
    return (
      <div className="test-report-page">
        <div className="loading-container" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ fontSize: '48px' }}>⏳</div>
          <p>Rapor yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Rapor bulunamadı durumu
  if (!testDetails) {
    return (
      <div className="test-report-page">
        <div className="error-container" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ fontSize: '48px' }}>❌</div>
          <h2>Rapor Bulunamadı</h2>
          <p>Bu ID'ye sahip bir test raporu bulunamadı.</p>
          <button className="btn btn-primary" onClick={() => navigate('/reports')}>
            Raporlara Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="test-report-page">
      {/* Header */}
      <div className="report-header">
        <div className="header-navigation">
          <button className="btn btn-secondary" onClick={() => navigate('/reports')}>
            <ArrowLeft size={16} />
            Geri
          </button>
          <div className="breadcrumb">
            <span>Akışlar</span> / <span>{testDetails.name}</span> / <span>Rapor</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary">
            <Share2 size={16} />
            Paylaş
          </button>
          <button className="btn btn-secondary" onClick={handleDownloadReport}>
            <Download size={16} />
            Raporu İndir
          </button>
          <button className="btn btn-primary">
            <RefreshCw size={16} />
            Tekrar Çalıştır
          </button>
        </div>
      </div>

      {/* Test Info */}
      <div className="test-info-card card">
        <div className="test-meta">
          <div className="test-title">
            <h1>{testDetails.name}</h1>
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
                <span className="stat-value">{Math.round((testDetails.passedSteps / testDetails.totalSteps) * 100)}%</span>
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
          📋 Genel Bakış
        </button>
        <button 
          className={`tab-btn ${activeTab === 'steps' ? 'active' : ''}`}
          onClick={() => setActiveTab('steps')}
        >
          🔄 Adım Detayları
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📊 Çalıştırma Geçmişi
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
            <div className="summary-card card">
              <h3>📊 Test Özeti</h3>
              <div className="summary-stats">
                <div className="summary-row">
                  <span>Toplam Adım:</span>
                  <span>{testDetails.totalSteps}</span>
                </div>
                <div className="summary-row success">
                  <span>Başarılı:</span>
                  <span>{testDetails.passedSteps}</span>
                </div>
                <div className="summary-row error">
                  <span>Başarısız:</span>
                  <span>{testDetails.failedSteps}</span>
                </div>
                <div className="summary-row">
                  <span>Başarı Oranı:</span>
                  <span>{Math.round((testDetails.passedSteps / testDetails.totalSteps) * 100)}%</span>
                </div>
              </div>
              
              <div className="progress-bar">
                <div 
                  className="progress-fill success" 
                  style={{ width: `${(testDetails.passedSteps / testDetails.totalSteps) * 100}%` }}
                ></div>
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

          <div className="quick-actions card">
            <h3>🚀 Hızlı Aksiyonlar</h3>
            <div className="action-buttons">
              <button className="btn btn-primary">
                <RefreshCw size={16} />
                Testi Tekrar Çalıştır
              </button>
              <button className="btn btn-secondary">
                <ExternalLink size={16} />
                Editörde Aç
              </button>
              <button className="btn btn-secondary">
                <Download size={16} />
                Ekran Görüntülerini İndir
              </button>
              <button className="btn btn-secondary">
                <Video size={16} />
                Video Kaydını İzle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Steps Tab */}
      {activeTab === 'steps' && (
        <div className="steps-content">
          <div className="steps-list card">
            <h3>🔄 Adım Detayları</h3>
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
                    {step.error && (
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
            <h3>📊 Çalıştırma Geçmişi</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Durum</th>
                    <th>Süre</th>
                    <th>Tetikleyici</th>
                    <th>Aksiyonlar</th>
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
              <h3>📹 Video Kaydı</h3>
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