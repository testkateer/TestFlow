import React, { useState } from 'react';
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
import '../styles/TestReport.css';

const TestReport = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const testDetails = {
    id: 1,
    name: 'E-commerce Checkout Flow',
    description: 'Complete checkout process test including cart, payment and confirmation',
    browser: 'Chrome 120.0',
    resolution: '1920x1080',
    createdDate: '15 Kasım 2024',
    lastRun: '2 saat önce',
    status: 'error',
    duration: '4m 12s',
    totalSteps: 8,
    passedSteps: 6,
    failedSteps: 2
  };

  const executionHistory = [
    {
      id: 1,
      date: '2024-11-15 14:30',
      status: 'error',
      duration: '4m 12s',
      trigger: 'Manuel'
    },
    {
      id: 2,
      date: '2024-11-15 09:00',
      status: 'success',
      duration: '3m 45s',
      trigger: 'Zamanlama'
    },
    {
      id: 3,
      date: '2024-11-14 09:00',
      status: 'success',
      duration: '3m 52s',
      trigger: 'Zamanlama'
    },
    {
      id: 4,
      date: '2024-11-13 18:00',
      status: 'error',
      duration: '2m 14s',
      trigger: 'Manuel'
    },
    {
      id: 5,
      date: '2024-11-13 09:00',
      status: 'success',
      duration: '4m 01s',
      trigger: 'Zamanlama'
    }
  ];

  const stepDetails = [
    {
      id: 1,
      name: 'Navigate to Homepage',
      type: 'navigation',
      status: 'success',
      duration: '1.2s',
      description: 'https://example-store.com',
      screenshot: true
    },
    {
      id: 2,
      name: 'Search for Product',
      type: 'input',
      status: 'success',
      duration: '0.8s',
      description: 'Enter "wireless headphones" in search field',
      screenshot: true
    },
    {
      id: 3,
      name: 'Select Product',
      type: 'click',
      status: 'success',
      duration: '2.1s',
      description: 'Click on first product result',
      screenshot: true
    },
    {
      id: 4,
      name: 'Add to Cart',
      type: 'click',
      status: 'success',
      duration: '1.5s',
      description: 'Click "Add to Cart" button',
      screenshot: true
    },
    {
      id: 5,
      name: 'Go to Checkout',
      type: 'click',
      status: 'success',
      duration: '1.8s',
      description: 'Navigate to checkout page',
      screenshot: true
    },
    {
      id: 6,
      name: 'Fill Shipping Information',
      type: 'input',
      status: 'success',
      duration: '3.2s',
      description: 'Enter shipping address details',
      screenshot: true
    },
    {
      id: 7,
      name: 'Select Payment Method',
      type: 'click',
      status: 'error',
      duration: '0.5s',
      description: 'Element not found: #payment-method-card',
      screenshot: true,
      error: 'NoSuchElementException: Unable to locate element: {"method":"css selector","selector":"#payment-method-card"}'
    },
    {
      id: 8,
      name: 'Complete Purchase',
      type: 'click',
      status: 'skipped',
      duration: '0.0s',
      description: 'Skipped due to previous failure',
      screenshot: false
    }
  ];

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

  return (
    <div className="test-report-page">
      {/* Header */}
      <div className="report-header">
        <div className="header-navigation">
          <button className="btn btn-secondary">
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
          <button className="btn btn-secondary">
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

            <div className="error-details card">
              <h3>🛑 Hata Detayları</h3>
              <div className="error-info">
                <div className="error-step">
                  <strong>Adım 7:</strong> Select Payment Method
                </div>
                <div className="error-message">
                  <code>NoSuchElementException: Unable to locate element: #payment-method-card</code>
                </div>
                <div className="error-suggestions">
                  <h4>Öneriler:</h4>
                  <ul>
                    <li>Element seçicisini kontrol edin</li>
                    <li>Sayfanın tamamen yüklendiğinden emin olun</li>
                    <li>Bekleme süresi ekleyin</li>
                  </ul>
                </div>
              </div>
            </div>
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