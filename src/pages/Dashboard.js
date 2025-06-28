import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { getFromStorage} from '../utils/storageUtils';
import { clearExpiredRunningTests } from '../utils/testRunner';
import { getStatusIcon, getStatusText } from '../utils/statusUtils';
import { formatRelativeTime } from '../utils/dateUtils';
import { ErrorState, NoDataState, PageHeader } from '../components';
import '../styles/main.css';

const Dashboard = () => {
  const navigate = useNavigate();
  
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
          timestamp: formatRelativeTime(report.timestamp || report.date)
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

  // Tüm verileri yükle
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
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

  // Test raporuna yönlendirme fonksiyonu
  const navigateToTestReport = (testId) => {
    navigate(`/report/${testId}`);
  };

  // Test editörüne yönlendirme fonksiyonu
  const navigateToTestEditor = (testId) => {
    navigate(`/editor?id=${testId}`);
  };

  // Veri yoksa boş durum mesajı göster
  const hasData = testSummary.length > 0 || recentTests.length > 0 || scheduledTests.length > 0;

  if (error) {
    return (
      <div className="dashboard">
        <PageHeader 
          title="Dashboard" 
          subtitle="Test otomasyonu platform genel durumu" 
        />
        <ErrorState message={error} />
      </div>
    );
  }

  return (
    <div className="dashboard">
      <PageHeader 
        title="Dashboard" 
        subtitle="Test otomasyonu platform genel durumu" 
      />

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
        <div className="dashboard-section">
          <div className="card">
            <div className="section-header">
              <h2>
                <BarChart3 size={18} />
                Son Test Çalıştırmaları
              </h2>
              <button 
                className="btn btn-secondary"
                onClick={() => navigate('/reports')}
              >
                Tümünü Gör
              </button>
            </div>
            <div className="test-list">
              {recentTests.length > 0 ? (
                recentTests.map((test) => (
                  <div key={test.id} className="test-item">
                    <div className="test-info">
                      <div 
                        className="test-name clickable"
                        onClick={() => navigateToTestReport(test.id)}
                        title="Test raporunu görüntüle"
                      >
                        {test.name} <span className="test-id-display">{test.id}</span>
                      </div>
                      <div className="test-timestamp">{test.timestamp}</div>
                    </div>
                    <div className="test-details">
                      <span className="test-duration">{test.duration}</span>
                      <span className={`status-badge status-${test.status}`}>
                        {getStatusIcon(test.status)}
                        {getStatusText(test.status)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <NoDataState
                  title="Henüz test çalıştırılmamış"
                  message="Test sonuçlarını görmek için önce bazı testler çalıştırın."
                  size="small"
                  action={
                    <button 
                      className="btn btn-primary" 
                      onClick={() => navigate('/tests')}
                    >
                      Testlere Git
                    </button>
                  }
                />
              )}
            </div>
          </div>
        </div>

        {/* Planlanmış Testler */}
        <div className="dashboard-section">
          <div className="card">
            <div className="section-header">
              <h2>
                <Calendar size={18} />
                Kaydedilmiş Test Akışları
              </h2>
              <button 
                className="btn btn-secondary"
                onClick={() => navigate('/scheduling')}
              >
                Yönet
              </button>
            </div>
            <div className="scheduled-list">
              {scheduledTests.length > 0 ? (
                scheduledTests.map((test) => (
                  <div key={test.id} className="scheduled-item">
                    <div className="scheduled-info">
                      <div 
                        className="scheduled-name clickable"
                        onClick={() => navigateToTestEditor(test.id)}
                        title="Test akışını düzenle"
                      >
                        {test.name} <span className="test-id-display">{test.id}</span>
                      </div>
                      <div className="scheduled-frequency">{test.frequency}</div>
                    </div>
                    <div className="scheduled-time">
                      <Clock size={16} />
                      <span>{test.nextRun}</span>
                    </div>
                  </div>
                ))
              ) : (
                <NoDataState
                  title="Kaydedilmiş test akışı yok"
                  message="Henüz bir test akışı oluşturulmamış."
                  size="small"
                  action={
                    <button 
                      className="btn btn-primary" 
                      onClick={() => navigate('/editor')}
                    >
                      Test Oluştur
                    </button>
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;