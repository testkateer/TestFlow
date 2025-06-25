import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  PlayCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { getFromStorage, setToStorage } from '../utils/storageUtils';
import { clearExpiredRunningTests } from '../utils/testRunner';
import { formatRelativeTime } from '../utils/dateUtils';
import '../styles/Dashboard.css';

const Dashboard = () => {
  // State tanımlamaları
  const [testSummary, setTestSummary] = useState([]);
  const [recentTests, setRecentTests] = useState([]);
  const [scheduledTests, setScheduledTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [runningTestsCount, setRunningTestsCount] = useState(0);

  // Gerçek zamanlı çalışan testleri takip et
  const checkRunningTests = () => {
    try {
      // Süresi geçmiş testleri temizle ve güncel sayıyı al
      const currentRunningCount = clearExpiredRunningTests();
      setRunningTestsCount(currentRunningCount);
      return currentRunningCount;
    } catch (error) {
      console.error('Çalışan testleri kontrol etme hatası:', error);
      return 0;
    }
  };

  // Gerçek veri yükleme fonksiyonları - storage utility kullan
  const loadTestSummaryFromStorage = () => {
    try {
      const testReports = getFromStorage('testReports', []);
      const savedTests = getFromStorage('savedTestFlows', []);
      
      // Son 30 güne ait raporları al
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentReports = testReports.filter(report => {
        const reportDate = new Date(report.timestamp || report.date);
        return reportDate >= thirtyDaysAgo;
      });
      
      // Başarılı ve başarısız testleri hesapla
      const totalTests = recentReports.length; // Çalıştırılan toplam test sayısı
      const successfulTests = recentReports.filter(report => report.status === 'success').length;
      const failedTests = recentReports.filter(report => report.status === 'error').length;
      const currentRunningTests = checkRunningTests(); // Gerçek zamanlı çalışan testler
      
      return [
        { 
          label: 'Toplam Test', 
          value: totalTests.toString()
        },
        { 
          label: 'Başarılı', 
          value: successfulTests.toString()
        },
        { 
          label: 'Başarısız', 
          value: failedTests.toString()
        },
        { 
          label: 'Çalışıyor', 
          value: currentRunningTests.toString()
        }
      ];
    } catch (error) {
      console.error('Test özeti yükleme hatası:', error);
      return [];
    }
  };

  const loadRecentTestsFromStorage = () => {
    try {
      const testReports = getFromStorage('testReports', []);
      
      // En son 4 test raporunu al ve tarih sırasına göre sırala
      return testReports
        .sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date))
        .slice(0, 4)
        .map(report => ({
          id: report.id,
          name: report.testName,
          status: report.status,
          duration: report.duration || '0s',
          timestamp: formatTimestamp(report.timestamp || report.date)
        }));
    } catch (error) {
      console.error('Son testler yükleme hatası:', error);
      return [];
    }
  };

  const loadScheduledTestsFromStorage = () => {
    try {
      const savedTests = getFromStorage('savedTestFlows', []);
      
      // Kaydedilmiş testleri planlanmış testler olarak göster
      // (Gerçek zamanlama sistemi olmadığı için mock bir yaklaşım)
      const scheduleTypes = ['Günlük', 'Haftalık', 'Saatlik'];
      const nextRunTimes = [
        'Bugün 09:00',
        'Pazartesi 18:00', 
        '30 dakika sonra',
        'Yarın 14:00',
        '2 saat sonra'
      ];
      
      return savedTests.slice(0, 3).map((test, index) => ({
        id: test.id,
        name: test.name,
        nextRun: nextRunTimes[index % nextRunTimes.length],
        frequency: scheduleTypes[index % scheduleTypes.length]
      }));
    } catch (error) {
      console.error('Planlanmış testler yükleme hatası:', error);
      return [];
    }
  };

  // Zaman damgasını daha okunabilir formata çevir
  const formatTimestamp = (timestamp) => {
    try {
      const now = new Date();
      const testDate = new Date(timestamp);
      const diffInMinutes = Math.floor((now - testDate) / 60000);
      
      if (diffInMinutes < 1) return 'Az önce';
      if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} saat önce`;
      return testDate.toLocaleDateString('tr-TR');
    } catch (error) {
      return 'Bilinmeyen';
    }
  };

  // Tüm verileri yükle
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Küçük bir delay ekle (loading animasyonunu görmek için)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const summaryData = loadTestSummaryFromStorage();
      const recentData = loadRecentTestsFromStorage();
      const scheduledData = loadScheduledTestsFromStorage();
      
      setTestSummary(summaryData);
      setRecentTests(recentData);
      setScheduledTests(scheduledData);
    } catch (err) {
      setError('Veriler yüklenirken bir hata oluştu');
      console.error('Dashboard veri yükleme hatası:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Component mount olduğunda verileri yükle
  useEffect(() => {
    loadDashboardData();
    
    // localStorage değişikliklerini dinle (diğer sekmelerdeki değişiklikleri yakala)
    const handleStorageChange = () => {
      loadDashboardData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Otomatik yenileme için ayrı useEffect
  useEffect(() => {
    // Çalışan testleri daha sık kontrol et (her 5 saniyede bir)
    const runningTestsInterval = setInterval(() => {
      checkRunningTests();
    }, 5 * 1000);
    
    // Genel dashboard verilerini yenile (her 30 saniyede bir)
    const refreshInterval = setInterval(() => {
      loadDashboardData();
    }, 30 * 1000);
    
    return () => {
      clearInterval(runningTestsInterval);
      clearInterval(refreshInterval);
    };
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle size={16} />;
      case 'error': return <XCircle size={16} />;
      case 'running': return <PlayCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };



  // Veri yoksa boş durum mesajı göster
  const hasData = testSummary.length > 0 || recentTests.length > 0 || scheduledTests.length > 0;

  if (isLoading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Test otomasyonu platform genel durumu</p>
        </div>
        <div className="loading-container">
          <RefreshCw className="loading-spinner" size={24} />
          <p>Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Test otomasyonu platform genel durumu</p>
        </div>
        <div className="error-container">
          <AlertCircle size={24} className="error-icon" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Test otomasyonu platform genel durumu</p>
        </div>
      </div>

      {/* Veri yoksa bilgilendirme mesajı */}
      {!hasData && (
        <div className="no-data-container">
          <AlertCircle size={48} className="no-data-icon" />
          <h3>Henüz test verisi yok</h3>
          <p>Dashboard'ı görmek için önce bazı testler oluşturun ve çalıştırın.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.href = '/editor'}
          >
            Test Oluştur
          </button>
        </div>
      )}

      {/* Test Özeti Cards */}
      {testSummary.length > 0 && (
        <div className="summary-grid">
          {testSummary.map((item, index) => (
            <div key={index} className="summary-card card">
              <div className="summary-content">
                <div className="summary-value">{item.value}</div>
                <div className="summary-label">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="dashboard-content">
        {/* Son Testler */}
        {recentTests.length > 0 && (
          <div className="dashboard-section">
            <div className="card">
              <div className="section-header">
                <h2>📊 Son Test Çalıştırmaları</h2>
                <button 
                  className="btn btn-secondary"
                  onClick={() => window.location.href = '/reports'}
                >
                  Tümünü Gör
                </button>
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
        )}

        {/* Planlanmış Testler */}
        {scheduledTests.length > 0 && (
          <div className="dashboard-section">
            <div className="card">
              <div className="section-header">
                <h2>📆 Kaydedilmiş Test Akışları</h2>
                <button 
                  className="btn btn-secondary"
                  onClick={() => window.location.href = '/scheduling'}
                >
                  Yönet
                </button>
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
        )}
      </div>

    </div>
  );
};

export default Dashboard;