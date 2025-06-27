  import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  PlayCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Percent
} from 'lucide-react';
import { getFromStorage, setToStorage } from '../utils/storageUtils';
import { clearExpiredRunningTests } from '../utils/testRunner';
import { formatRelativeTime } from '../utils/dateUtils';
import '../styles/main.css';

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
      
      // Başarı oranını hesapla
      const successRate = totalTests > 0 ? Math.round((successfulTests / totalTests) * 100) : 0;
      
      return [
        { 
          label: 'Toplam Test', 
          value: totalTests.toString(),
          icon: <BarChart3 size={20} />,
          className: ''
        },
        { 
          label: 'Başarılı', 
          value: successfulTests.toString(),
          icon: <CheckCircle size={20} />,
          className: 'success'
        },
        { 
          label: 'Başarısız', 
          value: failedTests.toString(),
          icon: <XCircle size={20} />,
          className: 'error'
        },
        { 
          label: 'Başarı Oranı', 
          value: `${successRate}`,
          icon: <Percent size={20} />,
          className: 'rate'
        },
        { 
          label: 'Çalışıyor', 
          value: currentRunningTests.toString(),
          icon: <PlayCircle size={20} />,
          className: 'running'
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
      
      // En son 5 test raporunu al ve tarih sırasına göre sırala
      return testReports
        .sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date))
        .slice(0, 5)
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
      const scheduleTypes = ['Günlük', 'Haftalık', 'Saatlik', 'Aylık', 'Tekrar'];
      const nextRunTimes = [
        'Bugün 09:00',
        'Pazartesi 18:00', 
        '30 dakika sonra',
        'Yarın 14:00',
        '2 saat sonra',
        'Salı 10:30',
        'Çarşamba 16:00'
      ];
      
      return savedTests.slice(0, 5).map((test, index) => ({
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
      
      // Tarih ve saat bilgisini birlikte göster
      const dateStr = testDate.toLocaleDateString('tr-TR');
      const timeStr = testDate.toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      return `${dateStr} ${timeStr}`;
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

  // Test raporuna yönlendirme fonksiyonu
  const navigateToTestReport = (testId) => {
    window.location.href = `/report/${testId}`;
  };

  // Test editörüne yönlendirme fonksiyonu
  const navigateToTestEditor = (testId) => {
    window.location.href = `/editor?id=${testId}`;
  };

  // Veri yoksa boş durum mesajı göster
  const hasData = testSummary.length > 0 || recentTests.length > 0 || scheduledTests.length > 0;

  if (isLoading) {
    return (
      <div className="dashboard">
        <div className="page-header">
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
        <div className="page-header">
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
      <div className="page-header">
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
            <div key={index} className={`summary-card ${item.className}`}>
              {item.icon}
              <div className="summary-content">
                <span className="summary-value">{item.value}</span>
                <span className="summary-label">{item.label}</span>
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
                <h2>
                  <BarChart3 size={18} />
                  Son Test Çalıştırmaları
                </h2>
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
                      <div 
                        className="test-name clickable"
                        onClick={() => navigateToTestReport(test.id)}
                        title="Test raporunu görüntüle"
                      >
                        {test.name}
                      </div>
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
                <h2>
                  <Calendar size={18} />
                  Kaydedilmiş Test Akışları
                </h2>
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
                      <div 
                        className="scheduled-name clickable"
                        onClick={() => navigateToTestEditor(test.id)}
                        title="Test akışını düzenle"
                      >
                        {test.name}
                      </div>
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