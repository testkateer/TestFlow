import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  PlayCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  Percent
} from 'lucide-react';
import { getStatusIcon, getStatusText } from '../utils/statusUtils';
import { formatRelativeTime } from '../utils/dateUtils';
import { ErrorState, NoDataState, PageHeader } from '../components';
import { useTestFlow } from '../contexts/TestFlowContext';
import '../styles/main.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { 
    testFlows, 
    testReports, 
    activeRunningTests,
    getTestStats,
    isLoading, 
    error 
  } = useTestFlow();
  
  // Local state for computed values
  const [testSummary, setTestSummary] = useState([]);
  const [recentTests, setRecentTests] = useState([]);

  // Computed values from context data
  const loadTestSummaryFromContext = useCallback(() => {
    try {
      const stats = getTestStats();
      
      return [
        { 
          label: 'Toplam Test', 
          value: stats.total.toString(),
          icon: <BarChart3 size={20} />,
          className: ''
        },
        { 
          label: 'Başarılı', 
          value: stats.successful.toString(),
          icon: <CheckCircle size={20} />,
          className: 'success'
        },
        { 
          label: 'Başarısız', 
          value: stats.failed.toString(),
          icon: <XCircle size={20} />,
          className: 'error'
        },
        { 
          label: 'Başarı Oranı', 
          value: `${stats.successRate}`,
          icon: <Percent size={20} />,
          className: 'rate'
        },
        { 
          label: 'Çalışıyor', 
          value: activeRunningTests.length.toString(),
          icon: <PlayCircle size={20} />,
          className: 'running'
        }
      ];
    } catch (error) {
      console.error('Test özeti yükleme hatası:', error);
      return [];
    }
  }, [getTestStats, activeRunningTests]);

  const loadRecentTestsFromContext = useCallback(() => {
    try {
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
  }, [testReports]);

  const loadScheduledTestsFromContext = () => {
    try {
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
      
      return testFlows.slice(0, 5).map((test, index) => ({
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

  // Update computed values when context data changes
  useEffect(() => {
    if (!isLoading && !error) {
      const summaryData = loadTestSummaryFromContext();
      const recentData = loadRecentTestsFromContext();
      
      setTestSummary(summaryData);
      setRecentTests(recentData);
    }
  }, [testFlows, testReports, activeRunningTests, isLoading, error, loadRecentTestsFromContext, loadTestSummaryFromContext]);

  // Test raporuna yönlendirme fonksiyonu
  const navigateToTestReport = (testId) => {
    navigate(`/report/${testId}`);
  };

  // Test editörüne yönlendirme fonksiyonu
  const navigateToTestEditor = (testId) => {
    navigate(`/editor?id=${testId}`);
  };

  // Veri yoksa boş durum mesajı göster - currently not used but kept for future use
  // const hasData = testSummary.length > 0 || recentTests.length > 0 || scheduledTests.length > 0;



  if (error) {
    return (
      <div className="page-container">
        <PageHeader 
          title="Dashboard" 
          subtitle="Test otomasyonu platform genel durumu" 
        />
        <ErrorState message={error} />
      </div>
    );
  }

  return (
    <div className="page-container">
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
                  <div 
                    key={test.id} 
                    className="test-item clickable animate-on-hover"
                    onClick={() => navigateToTestReport(test.id)}
                    title="Test raporunu görüntüle"
                  >
                    <div className="test-info">
                      <div className="test-name">
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
              {testFlows.length > 0 ? (
                loadScheduledTestsFromContext().map((test) => (
                  <div 
                    key={test.id} 
                    className="scheduled-item clickable animate-on-hover"
                    onClick={() => navigateToTestEditor(test.id)}
                    title="Test akışını düzenle"
                  >
                    <div className="scheduled-info">
                      <div className="scheduled-name">
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