import React, { useState } from 'react';
import { 
  Clock, 
  Calendar, 
  Play,
  Edit, 
  Trash2, 
  Bell,
  ToggleLeft,
  ToggleRight,
  Plus,
  BarChart3
} from 'lucide-react';
import { PageHeader } from '../components';
import '../styles/main.css';

const Scheduling = () => {
  const [activeTab, setActiveTab] = useState('scheduled');

  const scheduledTests = [
    {
      id: 1,
      testName: 'Login Flow Test',
      schedule: 'Her gün 09:00',
      cronExpression: '0 9 * * *',
      nextRun: 'Yarın 09:00',
      isActive: true,
      lastRun: '2 saat önce',
      status: 'success',
      notifications: true
    },
    {
      id: 2,
      testName: 'API Health Check',
      schedule: 'Her 30 dakikada',
      cronExpression: '*/30 * * * *',
      nextRun: '12 dakika sonra',
      isActive: true,
      lastRun: '18 dakika önce',
      status: 'success',
      notifications: false
    },
    {
      id: 3,
      testName: 'Weekly Regression',
      schedule: 'Her Pazartesi 18:00',
      cronExpression: '0 18 * * 1',
      nextRun: 'Pazartesi 18:00',
      isActive: false,
      lastRun: '3 gün önce',
      status: 'error',
      notifications: true
    },
    {
      id: 4,
      testName: 'E-commerce Checkout',
      schedule: 'Her 2 saatte',
      cronExpression: '0 */2 * * *',
      nextRun: '1 saat 23 dakika sonra',
      isActive: true,
      lastRun: '37 dakika önce',
      status: 'success',
      notifications: true
    }
  ];

  const cronPresets = [
    { name: 'Her dakika', expression: '* * * * *' },
    { name: 'Her 5 dakikada', expression: '*/5 * * * *' },
    { name: 'Her 30 dakikada', expression: '*/30 * * * *' },
    { name: 'Her saat', expression: '0 * * * *' },
    { name: 'Her gün 09:00', expression: '0 9 * * *' },
    { name: 'Her Pazartesi 18:00', expression: '0 18 * * 1' },
    { name: 'Hafta sonları 10:00', expression: '0 10 * * 6,0' }
  ];

  const toggleSchedule = (scheduleId) => {
    // Toggle aktif/pasif durumu
    console.log('Toggle schedule:', scheduleId);
  };

  return (
    <div className="scheduling-page">
      <PageHeader 
        title="Zamanlama" 
        subtitle="Testlerin otomatik çalıştırma zamanlarını yönetin" 
      />

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'scheduled' ? 'active' : ''}`}
          onClick={() => setActiveTab('scheduled')}
        >
          <Calendar size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Planlı Testler
        </button>
        <button 
          className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <Plus size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Yeni Zamanlama
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <BarChart3 size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Çalıştırma Geçmişi
        </button>
      </div>

      {/* Scheduled Tests Tab */}
      {activeTab === 'scheduled' && (
        <div className="scheduled-tests">
          <div className="tests-summary card">
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-value">4</span>
                <span className="stat-label">Toplam Zamanlama</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">3</span>
                <span className="stat-label">Aktif</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">1</span>
                <span className="stat-label">Pasif</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">12 dk</span>
                <span className="stat-label">Sonraki Çalıştırma</span>
              </div>
            </div>
          </div>

          <div className="schedules-list">
            {scheduledTests.map((schedule) => (
              <div key={schedule.id} className="schedule-card card">
                <div className="schedule-header">
                  <div className="schedule-info">
                    <h3 className="schedule-name">{schedule.testName}</h3>
                    <div className="schedule-meta">
                      <span className="schedule-frequency">
                        <Clock size={14} />
                        {schedule.schedule}
                      </span>
                      <span className="cron-expression">
                        CRON: {schedule.cronExpression}
                      </span>
                    </div>
                  </div>
                  <div className="schedule-status">
                    <button 
                      className={`toggle-btn ${schedule.isActive ? 'active' : ''}`}
                      onClick={() => toggleSchedule(schedule.id)}
                    >
                      {schedule.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                  </div>
                </div>

                <div className="schedule-details">
                  <div className="detail-row">
                    <div className="detail-item">
                      <span className="detail-label">Sonraki Çalıştırma:</span>
                      <span className="detail-value next-run">{schedule.nextRun}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Son Çalıştırma:</span>
                      <span className="detail-value">{schedule.lastRun}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Durum:</span>
                      <span className={`status-badge status-${schedule.status}`}>
                        {schedule.status === 'success' ? 'Başarılı' : 'Başarısız'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="schedule-actions">
                  <div className="notification-setting">
                    <Bell size={16} className={schedule.notifications ? 'active' : 'inactive'} />
                    <span>Bildirimler {schedule.notifications ? 'Açık' : 'Kapalı'}</span>
                  </div>
                  <div className="action-buttons">
                    <button className="btn btn-success btn-sm">
                      <Play size={14} />
                      Şimdi Çalıştır
                    </button>
                    <button className="btn btn-secondary btn-sm">
                      <Edit size={14} />
                      Düzenle
                    </button>
                    <button className="btn btn-danger btn-sm">
                      <Trash2 size={14} />
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Schedule Tab */}
      {activeTab === 'create' && (
        <div className="create-schedule">
          <div className="schedule-form card">
            <h3>
              <Clock size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Yeni Zamanlama Oluştur
            </h3>
            
            <div className="form-section">
              <h4>Test Seçimi</h4>
              <div className="form-group">
                <label>Test Senaryosu:</label>
                <select>
                  <option>Login Flow Test</option>
                  <option>E-commerce Checkout</option>
                  <option>API Health Check</option>
                  <option>User Registration</option>
                </select>
              </div>
            </div>

            <div className="form-section">
              <h4>Zamanlama Ayarları</h4>
              
              <div className="schedule-options">
                <div className="option-tabs">
                  <button className="option-tab active">Basit Zamanlama</button>
                  <button className="option-tab">CRON İfadesi</button>
                </div>

                <div className="simple-schedule">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Sıklık:</label>
                      <select>
                        <option>Dakika</option>
                        <option>Saat</option>
                        <option>Gün</option>
                        <option>Hafta</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Değer:</label>
                      <input type="number" defaultValue="1" min="1" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Başlangıç Zamanı:</label>
                    <input type="datetime-local" />
                  </div>
                </div>
              </div>

              <div className="preset-schedules">
                <h5>Hazır Şablonlar:</h5>
                <div className="preset-grid">
                  {cronPresets.map((preset, index) => (
                    <button key={index} className="preset-btn">
                      <span className="preset-name">{preset.name}</span>
                      <span className="preset-cron">{preset.expression}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Bildirim Ayarları</h4>
              <div className="notification-options">
                <label className="checkbox-group">
                  <input type="checkbox" defaultChecked />
                  <span>Test başarılı olduğunda bildir</span>
                </label>
                <label className="checkbox-group">
                  <input type="checkbox" defaultChecked />
                  <span>Test başarısız olduğunda bildir</span>
                </label>
                <label className="checkbox-group">
                  <input type="checkbox" />
                  <span>Test başlamadan önce bildir</span>
                </label>
              </div>

              <div className="form-group">
                <label>Bildirim Kanalları:</label>
                <div className="notification-channels">
                  <label className="checkbox-group">
                    <input type="checkbox" defaultChecked />
                    <span>E-posta</span>
                  </label>
                  <label className="checkbox-group">
                    <input type="checkbox" />
                    <span>Slack</span>
                  </label>
                  <label className="checkbox-group">
                    <input type="checkbox" />
                    <span>Webhook</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn btn-secondary">İptal</button>
              <button className="btn btn-primary">
                <Calendar size={16} />
                Zamanlamayı Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="schedule-history">
          <div className="history-filters card">
            <div className="filter-row">
              <div className="form-group">
                <label>Tarih Aralığı:</label>
                <select>
                  <option>Son 7 gün</option>
                  <option>Son 30 gün</option>
                  <option>Son 3 ay</option>
                  <option>Özel aralık</option>
                </select>
              </div>
              <div className="form-group">
                <label>Test:</label>
                <select>
                  <option>Tüm testler</option>
                  <option>Login Flow Test</option>
                  <option>API Health Check</option>
                  <option>E-commerce Checkout</option>
                </select>
              </div>
              <div className="form-group">
                <label>Durum:</label>
                <select>
                  <option>Tümü</option>
                  <option>Başarılı</option>
                  <option>Başarısız</option>
                </select>
              </div>
            </div>
          </div>

          <div className="history-table card">
            <h3>
              <BarChart3 size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Çalıştırma Geçmişi
            </h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Test Adı</th>
                    <th>Zamanlama</th>
                    <th>Çalıştırma Zamanı</th>
                    <th>Süre</th>
                    <th>Durum</th>
                    <th>Detay</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Login Flow Test</td>
                    <td>Her gün 09:00</td>
                    <td>Bugün 09:00</td>
                    <td>2m 34s</td>
                    <td><span className="status-badge status-success">Başarılı</span></td>
                    <td><button className="btn btn-secondary btn-sm">Görüntüle</button></td>
                  </tr>
                  <tr>
                    <td>API Health Check</td>
                    <td>Her 30 dakika</td>
                    <td>Bugün 08:30</td>
                    <td>45s</td>
                    <td><span className="status-badge status-success">Başarılı</span></td>
                    <td><button className="btn btn-secondary btn-sm">Görüntüle</button></td>
                  </tr>
                  <tr>
                    <td>E-commerce Checkout</td>
                    <td>Her 2 saatte</td>
                    <td>Bugün 08:00</td>
                    <td>4m 12s</td>
                    <td><span className="status-badge status-error">Başarısız</span></td>
                    <td><button className="btn btn-secondary btn-sm">Görüntüle</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scheduling; 