import React, { useState } from 'react';
import { 
  User, 
  Globe, 
  Monitor, 
  Bell, 
  Shield, 
  Database,
  Download,
  Upload,
  Key,
  Mail,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  AlertCircle,
  Keyboard
} from 'lucide-react';
import { toast } from '../utils/notifications';
import { confirmActions } from '../utils/modalUtils';
import { exportAllData } from '../utils/dataUtils';
import { PageHeader } from '../components';
import ShortcutsSettings from '../components/Settings/ShortcutsSettings';
import { useTestFlow } from '../contexts/TestFlowContext';
import '../styles/main.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showApiKey, setShowApiKey] = useState(false);
  const { updateSettings } = useTestFlow();

  // Settings kaydetme fonksiyonu
  const handleSaveSettings = async () => {
    try {
      const settings = {
        // Diğer ayarlar...
        lastUpdated: new Date().toISOString()
      };
      await updateSettings(settings);
      toast.saveSuccess('Ayarlar');
    } catch (error) {
      toast.saveError('Ayarlar');
    }
  };

  // Ayarları sıfırlama fonksiyonu
  const handleResetSettings = async () => {
    const confirmed = await confirmActions.reset('tüm ayarları');
    if (confirmed) {
      setShowApiKey(false);
      await updateSettings({});
      toast.saveSuccess('Ayarlar sıfırlandı');
    }
  };

  // Veri dışa aktarma
  const handleExportData = () => {
    try {
      const data = exportAllData();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `testflow-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.saveSuccess('Veriler dışa aktarıldı');
    } catch (error) {
      toast.saveError('Veri dışa aktarma');
    }
  };

  // Profil fotoğrafı yükleme
  const handleAvatarUpload = () => {
    // Simülasyon
    setTimeout(() => {
      toast.success('Profil fotoğrafı yüklendi!');
    }, 1000);
  };

  const tabs = [
    { id: 'profile', name: 'Profil', icon: User },
    // { id: 'test', name: 'Test Ayarları', icon: Monitor }, // Kaldırıldı
    { id: 'shortcuts', name: 'Kısayollar', icon: Keyboard },
    { id: 'notifications', name: 'Bildirimler', icon: Bell },
    { id: 'security', name: 'Güvenlik', icon: Shield },
    { id: 'data', name: 'Veri Yönetimi', icon: Database }
  ];

  return (
    <div className="page-container">
      <PageHeader 
        title="Ayarlar" 
        subtitle="Kişisel tercihlerinizi ve sistem ayarlarınızı yönetin" 
      />

      <div className="settings-layout">
        {/* Sidebar */}
        <div className="settings-sidebar card">
          <nav className="settings-nav">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={18} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="settings-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="settings-section card">
              <div className="section-header">
                <h2>
                  <User size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Profil Bilgileri
                </h2>
                <p>Kişisel bilgilerinizi ve hesap ayarlarınızı düzenleyin</p>
              </div>

              <div className="profile-section">
                <div className="avatar-section">
                  <div className="avatar-placeholder">
                    <User size={48} />
                  </div>
                  <div className="avatar-actions">
                    <button className="btn btn-secondary btn-sm" onClick={handleAvatarUpload}>
                      <Upload size={14} />
                      Fotoğraf Yükle
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => toast.info('Avatar sıfırlandı')}>
                      <RotateCcw size={14} />
                      Sıfırla
                    </button>
                  </div>
                </div>

                <div className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Ad:</label>
                      <input type="text"/>
                    </div>
                    <div className="form-group">
                      <label>Soyad:</label>
                      <input type="text"/>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>E-posta:</label>
                    <input type="email" />
                  </div>

                  <div className="form-group">
                    <label>Şirket:</label>
                    <input type="text"/>
                  </div>

                  <div className="form-group">
                    <label>Pozisyon:</label>
                    <input type="text"/>
                  </div>

                  <div className="form-group">
                    <label>Bio:</label>
                    <textarea 
                      rows="3" 
                      placeholder="Kendiniz hakkında kısa bir açıklama..."
                    />
                  </div>
                </div>
              </div>

              <div className="appearance-section">
                <h3>
                  <Monitor size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Görünüm
                </h3>
                <div className="preference-group">
                  <div className="preference-item">
                    <div className="preference-info">
                      <span className="preference-label">Dil</span>
                      <span className="preference-desc">Arayüz dili</span>
                    </div>
                    <select>
                      <option>Türkçe</option>
                      <option>English</option>
                      <option>Español</option>
                    </select>
                  </div>

                  <div className="preference-item">
                    <div className="preference-info">
                      <span className="preference-label">Saat Dilimi</span>
                      <span className="preference-desc">Rapor ve loglar için saat dilimi</span>
                    </div>
                    <select>
                      <option>Europe/Istanbul</option>
                      <option>UTC</option>
                      <option>America/New_York</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Shortcuts Tab */}
          {activeTab === 'shortcuts' && <ShortcutsSettings />}

          {/* Test Settings Tab - Removed */}
          {/* {activeTab === 'test' && ( ... )} */}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="settings-section card">
              <div className="section-header">
                <h2>🔔 Bildirim Ayarları</h2>
                <p>Ne zaman bildirim almak istediğinizi belirleyin</p>
              </div>

              <div className="notification-types">
                <h3>📧 E-posta Bildirimleri</h3>
                <div className="preference-group">
                  <div className="preference-item">
                    <div className="preference-info">
                      <span className="preference-label">Test Başarılı</span>
                      <span className="preference-desc">Test başarıyla tamamlandığında</span>
                    </div>
                    <button className="toggle-switch active">
                      <div className="toggle-thumb"></div>
                    </button>
                  </div>

                  <div className="preference-item">
                    <div className="preference-info">
                      <span className="preference-label">Test Başarısız</span>
                      <span className="preference-desc">Test hata verdiğinde</span>
                    </div>
                    <button className="toggle-switch active">
                      <div className="toggle-thumb"></div>
                    </button>
                  </div>

                  <div className="preference-item">
                    <div className="preference-info">
                      <span className="preference-label">Zamanlanmış Test</span>
                      <span className="preference-desc">Zamanlanmış test başlamadan önce</span>
                    </div>
                    <button className="toggle-switch">
                      <div className="toggle-thumb"></div>
                    </button>
                  </div>

                  <div className="preference-item">
                    <div className="preference-info">
                      <span className="preference-label">Haftalık Özet</span>
                      <span className="preference-desc">Haftalık test özeti raporu</span>
                    </div>
                    <button className="toggle-switch active">
                      <div className="toggle-thumb"></div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="notification-channels">
                <h3>🔗 Bildirim Kanalları</h3>
                <div className="channel-list">
                  <div className="channel-item">
                    <div className="channel-info">
                      <Mail size={20} />
                      <div>
                        <span className="channel-name">E-posta</span>
                        <span className="channel-desc">ahmet@example.com</span>
                      </div>
                    </div>
                    <span className="channel-status active">Aktif</span>
                  </div>

                  <div className="channel-item">
                    <div className="channel-info">
                      <div className="slack-icon">S</div>
                      <div>
                        <span className="channel-name">Slack</span>
                        <span className="channel-desc">Henüz bağlanmadı</span>
                      </div>
                    </div>
                    <button className="btn btn-secondary btn-sm">Bağla</button>
                  </div>

                  <div className="channel-item">
                    <div className="channel-info">
                      <Globe size={20} />
                      <div>
                        <span className="channel-name">Webhook</span>
                        <span className="channel-desc">Özel webhook URL'si</span>
                      </div>
                    </div>
                    <button className="btn btn-secondary btn-sm">Yapılandır</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="settings-section card">
              <div className="section-header">
                <h2>🔒 Güvenlik</h2>
                <p>Hesap güvenliği ve API erişim ayarları</p>
              </div>

              <div className="password-section">
                <h3>🔑 Şifre Değiştir</h3>
                <div className="form-group">
                  <label>Mevcut Şifre:</label>
                  <input type="password" placeholder="Mevcut şifrenizi girin" />
                </div>
                <div className="form-group">
                  <label>Yeni Şifre:</label>
                  <input type="password" placeholder="Yeni şifrenizi girin" />
                </div>
                <div className="form-group">
                  <label>Yeni Şifre (Tekrar):</label>
                  <input type="password" placeholder="Yeni şifrenizi tekrar girin" />
                </div>
                <button className="btn btn-primary">Şifreyi Güncelle</button>
              </div>

              <div className="api-section">
                <h3>🔗 API Erişimi</h3>
                <div className="api-key-section">
                  <div className="form-group">
                    <label>API Anahtarı:</label>
                    <div className="input-with-action">
                      <input 
                        type={showApiKey ? "text" : "password"} 
                        value="sk-test-4f9c8e7d6b5a3f2e1d0c9b8a7f6e5d4c"
                        readOnly
                      />
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="api-actions">
                    <button className="btn btn-secondary">
                      <Key size={14} />
                      Yeni Anahtar Oluştur
                    </button>
                    <button className="btn btn-secondary">
                      <Download size={14} />
                      İndir
                    </button>
                  </div>
                </div>
              </div>

              <div className="session-section">
                <h3>
                  <Monitor size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Aktif Oturumlar
                </h3>
                <div className="session-list">
                  <div className="session-item current">
                    <div className="session-info">
                      <div className="session-device">
                        <Monitor size={16} />
                        <span>Chrome - Windows 11</span>
                      </div>
                      <div className="session-details">
                        <span>192.168.1.100 • İstanbul, Türkiye</span>
                        <span className="current-badge">Mevcut Oturum</span>
                      </div>
                    </div>
                  </div>

                  <div className="session-item">
                    <div className="session-info">
                      <div className="session-device">
                        <Monitor size={16} />
                        <span>Safari - macOS</span>
                      </div>
                      <div className="session-details">
                        <span>192.168.1.105 • İstanbul, Türkiye</span>
                        <span>2 saat önce</span>
                      </div>
                    </div>
                    <button className="btn btn-danger btn-sm">Sonlandır</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Management Tab */}
          {activeTab === 'data' && (
            <div className="settings-section card">
              <div className="section-header">
                <h2>💾 Veri Yönetimi</h2>
                <p>Verilerinizi yedekleyin, geri yükleyin veya silin</p>
              </div>

              <div className="backup-section">
                <h3>💿 Yedekleme</h3>
                <div className="backup-options">
                  <div className="backup-item">
                    <div className="backup-info">
                      <span className="backup-name">Test Verileri</span>
                      <span className="backup-desc">Tüm test senaryoları, adımlar ve ayarlar</span>
                    </div>
                    <button className="btn btn-primary" onClick={handleExportData}>
                      <Download size={14} />
                      Yedekle
                    </button>
                  </div>

                  <div className="backup-item">
                    <div className="backup-info">
                      <span className="backup-name">Raporlar</span>
                      <span className="backup-desc">Test çalıştırma geçmişi ve raporları</span>
                    </div>
                    <button className="btn btn-primary">
                      <Download size={14} />
                      Yedekle
                    </button>
                  </div>

                  <div className="backup-item">
                    <div className="backup-info">
                      <span className="backup-name">Ayarlar</span>
                      <span className="backup-desc">Kişisel tercihler ve yapılandırmalar</span>
                    </div>
                    <button className="btn btn-primary">
                      <Download size={14} />
                      Yedekle
                    </button>
                  </div>
                </div>
              </div>

              <div className="restore-section">
                <h3>
                  <Upload size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Geri Yükleme
                </h3>
                <div className="restore-area">
                  <div className="upload-area">
                    <Upload size={48} />
                    <h4>Yedek Dosyası Yükle</h4>
                    <p>Daha önce aldığınız yedek dosyasını sürükleyip bırakın</p>
                    <button className="btn btn-secondary">Dosya Seç</button>
                  </div>
                </div>
              </div>

              <div className="danger-section">
                <h3>
                  <AlertCircle size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Tehlikeli Bölge
                </h3>
                <div className="danger-actions">
                  <div className="danger-item">
                    <div className="danger-info">
                      <span className="danger-name">Tüm Test Verilerini Sil</span>
                      <span className="danger-desc">Bu işlem geri alınamaz!</span>
                    </div>
                    <button className="btn btn-danger">Sil</button>
                  </div>

                  <div className="danger-item">
                    <div className="danger-info">
                      <span className="danger-name">Hesabı Kapat</span>
                      <span className="danger-desc">Hesabınızı kalıcı olarak silin</span>
                    </div>
                    <button className="btn btn-danger">Hesabı Kapat</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Actions */}
          <div className="save-actions">
            <button className="btn btn-secondary" onClick={handleResetSettings}>
              <RotateCcw size={16} />
              Sıfırla
            </button>
            <button className="btn btn-primary" onClick={handleSaveSettings}>
              <Save size={16} />
              Değişiklikleri Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 