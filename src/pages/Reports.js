import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Download,
  BarChart3
} from 'lucide-react';
import { downloadTestReport } from '../utils/reportUtils';
import '../styles/Reports.css';

const Reports = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [reportsList, setReportsList] = useState([]);

  // Test raporlarını localStorage'dan yükle
  useEffect(() => {
    const loadReports = () => {
      try {
        const savedReports = JSON.parse(localStorage.getItem('testReports') || '[]');
        setReportsList(savedReports);
      } catch (error) {
        console.error('Raporlar yükleme hatası:', error);
        setReportsList([]);
      }
    };

    loadReports();
    
    // Storage event listener ekle (farklı sekmelerde değişiklikleri dinlemek için)
    const handleStorageChange = () => {
      loadReports();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle size={16} className="status-icon success" />;
      case 'error': return <XCircle size={16} className="status-icon error" />;
      case 'running': return <AlertCircle size={16} className="status-icon running" />;
      default: return <AlertCircle size={16} className="status-icon" />;
    }
  };

  const getSuccessRate = (passed, total) => {
    return Math.round((passed / total) * 100);
  };

  const filteredReports = reportsList.filter(report => {
    const testName = report.testName || report.name || '';
    const description = report.description || '';
    
    const matchesSearch = testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    
    let matchesDate = true;
    if (filterDate !== 'all') {
      const today = new Date();
      const reportDate = new Date(report.date || report.timestamp);
      
      switch (filterDate) {
        case 'today':
          matchesDate = reportDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = reportDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = reportDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleViewReport = (reportId) => {
    navigate(`/report/${reportId}`);
  };

  const handleDownloadReport = (report) => {
    downloadTestReport(report);
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <div className="header-content">
          <h1>📊 Raporlar</h1>
          <p>Tüm test çalıştırma sonuçlarını görüntüleyin ve analiz edin</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <BarChart3 size={20} />
            <div>
              <span className="stat-number">{reportsList.length}</span>
              <span className="stat-label">Toplam Rapor</span>
            </div>
          </div>
          <div className="stat-card success">
            <CheckCircle size={20} />
            <div>
              <span className="stat-number">{reportsList.filter(r => r.status === 'success').length}</span>
              <span className="stat-label">Başarılı</span>
            </div>
          </div>
          <div className="stat-card error">
            <XCircle size={20} />
            <div>
              <span className="stat-number">{reportsList.filter(r => r.status === 'error').length}</span>
              <span className="stat-label">Başarısız</span>
            </div>
          </div>
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
            </select>
          </div>
          
          <div className="filter-group">
            <label>Tarih:</label>
            <select 
              value={filterDate} 
              onChange={(e) => setFilterDate(e.target.value)}
            >
              <option value="all">Tümü</option>
              <option value="today">Bugün</option>
              <option value="week">Son 7 Gün</option>
              <option value="month">Son 30 Gün</option>
            </select>
          </div>
          
          <button className="btn btn-secondary">
            <Filter size={16} />
            Gelişmiş Filtre
          </button>
        </div>
      </div>

      {/* Raporlar Tablosu */}
      <div className="reports-table card">
        <div className="table-header">
          <h3>Test Raporları</h3>
          <span className="results-count">
            {filteredReports.length} rapor bulundu
          </span>
        </div>
        
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Test Adı</th>
                <th>Durum</th>
                <th>Başarı Oranı</th>
                <th>Süre</th>
                <th>Tarih & Saat</th>
                <th>Tetikleyici</th>
                <th>Aksiyonlar</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => {
                const testName = report.testName || report.name || 'İsimsiz Test';
                const description = report.description || '';
                const totalSteps = report.totalSteps || 0;
                const successfulSteps = report.successfulSteps || report.passedSteps || 0;
                const timestamp = report.timestamp || report.date || new Date().toISOString();
                const reportDate = new Date(timestamp);
                const trigger = report.trigger || 'Manuel';
                
                return (
                <tr key={report.id}>
                  <td>
                    <div className="test-info">
                      <h4>{testName}</h4>
                      <p>{description}</p>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-${report.status}`}>
                      {getStatusIcon(report.status)}
                      {report.status === 'success' ? 'Başarılı' : 'Başarısız'}
                    </span>
                  </td>
                  <td>
                    <div className="success-rate">
                      <span className="percentage">{totalSteps > 0 ? getSuccessRate(successfulSteps, totalSteps) : 0}%</span>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${totalSteps > 0 ? getSuccessRate(successfulSteps, totalSteps) : 0}%` }}
                        ></div>
                      </div>
                      <span className="steps-count">{successfulSteps}/{totalSteps}</span>
                    </div>
                  </td>
                  <td>
                    <div className="duration">
                      <Clock size={14} />
                      {report.duration || '-'}
                    </div>
                  </td>
                  <td>
                    <div className="datetime">
                      <div className="date">
                        <Calendar size={14} />
                        {reportDate.toLocaleDateString('tr-TR')}
                      </div>
                      <div className="time">{reportDate.toLocaleTimeString('tr-TR')}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`trigger-badge ${trigger.toLowerCase()}`}>
                      {trigger}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleViewReport(report.id)}
                      >
                        <Eye size={14} />
                        Görüntüle
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDownloadReport(report)}
                      >
                        <Download size={14} />
                        İndir
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports; 