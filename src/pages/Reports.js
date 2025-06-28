import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  BarChart3,
  X
} from 'lucide-react';
import { downloadTestReport } from '../utils/reportUtils';
import { getFromStorage } from '../utils/storageUtils';
import { isToday, isThisWeek } from '../utils/dateUtils';
import { NoDataState, PageHeader } from '../components';
import '../styles/main.css';

const Reports = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [reportsList, setReportsList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25); // Varsayılan 25

  // Test raporlarını localStorage'dan yükle - storage utility kullan
  useEffect(() => {
    const loadReports = () => {
      const savedReports = getFromStorage('testReports', []);
      setReportsList(savedReports);
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
      const reportDate = new Date(report.timestamp || report.date);
      
      switch (filterDate) {
        case 'today':
          matchesDate = isToday(reportDate);
          break;
        case 'week':
          matchesDate = isThisWeek(reportDate);
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = reportDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Sayfalama için raporları dilimle
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReports = filteredReports.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Sayfa başına öğe değiştiğinde ilk sayfaya dön
  };

  const handleViewReport = (reportId) => {
    navigate(`/report/${reportId}`);
  };

  const handleDownloadReport = (report) => {
    downloadTestReport(report);
  };

  return (
    <div className="page-container">
      <PageHeader 
        title="Raporlar" 
        subtitle="Tüm test çalıştırma sonuçlarını görüntüleyin ve analiz edin"
        stats={
          <>
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
          {filteredReports.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Test Adı</th>
                  <th>Durum</th>
                  <th>Başarı Oranı</th>
                  <th>Süre</th>
                  <th>Tarih & Saat</th>
                  <th>Tetikleyici</th>
                  <th>Loglar</th>
                </tr>
              </thead>
              <tbody>
                {currentReports.map((report) => {
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
                        <h4>
                          {testName}
                          <span className="test-id-display">{report.id}</span>
                        </h4>
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
                        {report.duration || '-'}
                      </div>
                    </td>
                    <td>
                      <div className="datetime">
                        <div className="date">
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
                          Görüntüle
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDownloadReport(report)}
                        >
                          İndir
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{maxWidth : '96%', margin : '0 auto'}}>
            <NoDataState 
              title="Henüz test çalıştırılmamış" 
              message={searchTerm || filterStatus !== 'all' || filterDate !== 'all' ? 
                "Arama veya filtreleme kriterlerinize uygun rapor bulunamadı." : 
                "Test sonuçlarını görmek için önce bazı testler çalıştırın."}
              size="small"
              icon={<AlertCircle size={40} className="no-data-icon" />}
            />
            </div>
          )}
        </div>
        {/* Pagination Controls */}
        {filteredReports.length > 0 && (
          <div className="pagination-controls">
            <div className="items-per-page">
              <label>Sayfa başına rapor:</label>
              <select value={itemsPerPage} onChange={handleItemsPerPageChange}>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="pagination-buttons">
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Önceki
              </button>
              <span>Sayfa {currentPage} / {totalPages}</span>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Sonraki
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports; 