import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Play, 
  Edit, 
  Clock, 
  Download, 
  MoreHorizontal,
  Chrome,
  Globe,
  Smartphone
} from 'lucide-react';
import '../styles/TestList.css';

const TestList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBrowser, setFilterBrowser] = useState('all');

  const tests = [
    {
      id: 1,
      name: 'User Login Flow',
      description: 'Complete user authentication process test',
      lastRun: '2 saat önce',
      status: 'success',
      browser: 'chrome',
      duration: '2m 34s',
      type: 'scheduled'
    },
    {
      id: 2,
      name: 'E-commerce Checkout',
      description: 'Full checkout process including payment',
      lastRun: '5 saat önce',
      status: 'error',
      browser: 'firefox',
      duration: '4m 12s',
      type: 'manual'
    },
    {
      id: 3,
      name: 'API Integration Test',
      description: 'Testing API endpoints and responses',
      lastRun: '1 gün önce',
      status: 'success',
      browser: 'chrome',
      duration: '1m 45s',
      type: 'scheduled'
    },
    {
      id: 4,
      name: 'Mobile Responsive Test',
      description: 'Testing mobile responsive design',
      lastRun: 'Hiç çalışmadı',
      status: 'pending',
      browser: 'safari',
      duration: '--',
      type: 'manual'
    },
    {
      id: 5,
      name: 'Search Functionality',
      description: 'Testing search filters and results',
      lastRun: '30 dakika önce',
      status: 'running',
      browser: 'chrome',
      duration: '--',
      type: 'manual'
    }
  ];

  const getBrowserIcon = (browser) => {
    switch (browser) {
      case 'chrome': return <Chrome size={16} />;
      case 'firefox': return <Globe size={16} />;
      case 'safari': return <Smartphone size={16} />;
      default: return <Chrome size={16} />;
    }
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || test.status === filterStatus;
    const matchesBrowser = filterBrowser === 'all' || test.browser === filterBrowser;
    
    return matchesSearch && matchesStatus && matchesBrowser;
  });

  return (
    <div className="test-list-page">
      <div className="page-header">
        <div className="header-content">
          <h1>🔍 Akışlar</h1>
          <p>Tüm test senaryolarınızı görüntüleyin ve yönetin</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} />
          Yeni Test Oluştur
        </button>
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
              <option value="pending">Bekliyor</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Tarayıcı:</label>
            <select 
              value={filterBrowser} 
              onChange={(e) => setFilterBrowser(e.target.value)}
            >
              <option value="all">Tümü</option>
              <option value="chrome">Chrome</option>
              <option value="firefox">Firefox</option>
              <option value="safari">Safari</option>
            </select>
          </div>
          
          <button className="btn btn-secondary">
            <Filter size={16} />
            Gelişmiş Filtre
          </button>
        </div>
      </div>

      {/* Test Listesi */}
      <div className="tests-container">
        <div className="tests-header">
          <span className="results-count">
            {filteredTests.length} test bulundu
          </span>
        </div>

        <div className="tests-grid">
          {filteredTests.map((test) => (
            <div key={test.id} className="test-card card">
              <div className="test-card-header">
                <div className="test-info">
                  <h3 className="test-name">{test.name}</h3>
                  <p className="test-description">{test.description}</p>
                </div>
                <div className="test-actions">
                  <button className="action-btn">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>

              <div className="test-meta">
                <div className="meta-item">
                  <span className="meta-label">Son Çalıştırma:</span>
                  <span className="meta-value">{test.lastRun}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Süre:</span>
                  <span className="meta-value">{test.duration}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Tarayıcı:</span>
                  <span className="meta-value browser-info">
                    {getBrowserIcon(test.browser)}
                    {test.browser}
                  </span>
                </div>
              </div>

              <div className="test-card-footer">
                <div className="test-status">
                  <span className={`status-badge status-${test.status}`}>
                    {test.status === 'success' && 'Başarılı'}
                    {test.status === 'error' && 'Başarısız'}
                    {test.status === 'running' && 'Çalışıyor'}
                    {test.status === 'pending' && 'Bekliyor'}
                  </span>
                  <span className={`type-badge ${test.type}`}>
                    {test.type === 'scheduled' && '⏰ Planlı'}
                    {test.type === 'manual' && '🔧 Manuel'}
                  </span>
                </div>

                <div className="card-actions">
                  <button className="btn btn-success btn-sm">
                    <Play size={14} />
                    Çalıştır
                  </button>
                  <button className="btn btn-secondary btn-sm">
                    <Edit size={14} />
                    Düzenle
                  </button>
                  <button className="btn btn-secondary btn-sm">
                    <Clock size={14} />
                    Zamanla
                  </button>
                  <button className="btn btn-secondary btn-sm">
                    <Download size={14} />
                    Export
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestList; 