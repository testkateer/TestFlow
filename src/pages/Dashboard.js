import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  PlayCircle,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const testSummary = [
    { label: 'Toplam Test', value: '24', change: '+3', trend: 'up' },
    { label: 'Başarılı', value: '18', change: '+2', trend: 'up' },
    { label: 'Başarısız', value: '4', change: '-1', trend: 'down' },
    { label: 'Çalışıyor', value: '2', change: '0', trend: 'neutral' }
  ];

  const recentTests = [
    { 
      id: 1, 
      name: 'Login Flow Test', 
      status: 'success', 
      duration: '2m 34s', 
      timestamp: '5 dakika önce' 
    },
    { 
      id: 2, 
      name: 'Payment Process', 
      status: 'error', 
      duration: '1m 12s', 
      timestamp: '12 dakika önce' 
    },
    { 
      id: 3, 
      name: 'User Registration', 
      status: 'success', 
      duration: '3m 45s', 
      timestamp: '1 saat önce' 
    },
    { 
      id: 4, 
      name: 'Search Functionality', 
      status: 'running', 
      duration: '-- ', 
      timestamp: 'Şimdi çalışıyor' 
    }
  ];

  const scheduledTests = [
    { 
      id: 1, 
      name: 'Daily Smoke Test', 
      nextRun: 'Bugün 09:00', 
      frequency: 'Günlük' 
    },
    { 
      id: 2, 
      name: 'Weekly Regression', 
      nextRun: 'Pazartesi 18:00', 
      frequency: 'Haftalık' 
    },
    { 
      id: 3, 
      name: 'API Health Check', 
      nextRun: '30 dakika sonra', 
      frequency: 'Saatlik' 
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle size={16} />;
      case 'error': return <XCircle size={16} />;
      case 'running': return <PlayCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Test otomasyonu platform genel durumu</p>
      </div>

      {/* Test Özeti Cards */}
      <div className="summary-grid">
        {testSummary.map((item, index) => (
          <div key={index} className="summary-card card">
            <div className="summary-content">
              <div className="summary-value">{item.value}</div>
              <div className="summary-label">{item.label}</div>
            </div>
            <div className="summary-change">
              {item.trend === 'up' && <TrendingUp size={16} className="trend-up" />}
              {item.trend === 'down' && <TrendingDown size={16} className="trend-down" />}
              <span className={`change-value ${item.trend}`}>{item.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-content">
        {/* Son Testler */}
        <div className="dashboard-section">
          <div className="card">
            <div className="section-header">
              <h2>📊 Son Test Çalıştırmaları</h2>
              <button className="btn btn-secondary">Tümünü Gör</button>
            </div>
            <div className="test-list">
              {recentTests.map((test) => (
                <div key={test.id} className="test-item">
                  <div className="test-info">
                    <div className="test-name">{test.name}</div>
                    <div className="test-timestamp">{test.timestamp}</div>
                  </div>
                  <div className="test-details">
                    <span className="test-duration">{test.duration}</span>
                    <span className={`status-badge status-${test.status}`}>
                      {getStatusIcon(test.status)}
                      {test.status === 'success' && 'Başarılı'}
                      {test.status === 'error' && 'Başarısız'}
                      {test.status === 'running' && 'Çalışıyor'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Planlanmış Testler */}
        <div className="dashboard-section">
          <div className="card">
            <div className="section-header">
              <h2>📆 Planlanmış Testler</h2>
              <button className="btn btn-secondary">Yönet</button>
            </div>
            <div className="scheduled-list">
              {scheduledTests.map((test) => (
                <div key={test.id} className="scheduled-item">
                  <div className="scheduled-info">
                    <div className="scheduled-name">{test.name}</div>
                    <div className="scheduled-frequency">{test.frequency}</div>
                  </div>
                  <div className="scheduled-time">
                    <Clock size={16} />
                    <span>{test.nextRun}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hızlı Aksiyonlar */}
      <div className="quick-actions card">
        <h3>🚀 Hızlı Aksiyonlar</h3>
        <div className="action-buttons">
          <button className="btn btn-primary">
            <PlayCircle size={16} />
            Yeni Test Çalıştır
          </button>
          <button className="btn btn-secondary">
            <Calendar size={16} />
            Test Zamanla
          </button>
          <button className="btn btn-secondary">
            Rapor Oluştur
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 