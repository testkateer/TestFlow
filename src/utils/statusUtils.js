import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  Chrome,
  Globe,
  Smartphone,
  Settings,
  Bot,
  Navigation,
  MousePointer,
  Type,
  Eye,
  RefreshCw,
  Zap
} from 'lucide-react';

// Test durumu için icon döndür
export const getStatusIcon = (status, size = 16, className = '') => {
  const iconProps = { size, className: `status-icon ${status} ${className}` };
  
  switch (status) {
    case 'success': 
      return <CheckCircle {...iconProps} />;
    case 'error': 
      return <XCircle {...iconProps} />;
    case 'running': 
      return <AlertCircle {...iconProps} />;
    case 'pending':
      return <Clock {...iconProps} />;
    default: 
      return <AlertCircle {...iconProps} />;
  }
};

// Test durumu için Türkçe metin döndür
export const getStatusText = (status) => {
  switch (status) {
    case 'success': return 'Başarılı';
    case 'error': return 'Başarısız';
    case 'running': return 'Çalışıyor';
    case 'pending': return 'Bekliyor';
    default: return 'Bilinmiyor';
  }
};

// Test durumu için CSS class döndür
export const getStatusClass = (status) => {
  return `status-${status}`;
};

// Tarayıcı için icon döndür
export const getBrowserIcon = (browser, size = 16) => {
  const iconProps = { size };
  
  switch (browser?.toLowerCase()) {
    case 'chrome': 
      return <Chrome {...iconProps} />;
    case 'firefox': 
      return <Globe {...iconProps} />;
    case 'safari': 
      return <Smartphone {...iconProps} />;
    default: 
      return <Chrome {...iconProps} />;
  }
};

// Test tipi için icon döndür
export const getTestTypeIcon = (type, size = 12) => {
  const iconProps = { size };
  
  switch (type) {
    case 'scheduled': return <Clock {...iconProps} />;
    case 'manual': return <Settings {...iconProps} />;
    case 'automated': return <Bot {...iconProps} />;
    default: return <Settings {...iconProps} />;
  }
};

// Test tipi için metin döndür
export const getTestTypeText = (type) => {
  switch (type) {
    case 'scheduled': return 'Planlı';
    case 'manual': return 'Manuel';
    case 'automated': return 'Otomatik';
    default: return 'Manuel';
  }
};

// Adım tipi için icon döndür
export const getStepTypeIcon = (type, size = 12) => {
  const iconProps = { size };
  
  switch (type) {
    case 'navigate': return <Navigation {...iconProps} />;
    case 'click': return <MousePointer {...iconProps} />;
    case 'input': return <Type {...iconProps} />;
    case 'verify': return <Eye {...iconProps} />;
    case 'wait': return <Clock {...iconProps} />;
    case 'refresh': return <RefreshCw {...iconProps} />;
    default: return <Zap {...iconProps} />;
  }
};

// Başarı oranı hesapla
export const calculateSuccessRate = (passed, total) => {
  if (total === 0) return 0;
  return Math.round((passed / total) * 100);
};

// Durum badge component'i
export const StatusBadge = ({ status, children, className = '' }) => (
  <span className={`status-badge ${getStatusClass(status)} ${className}`}>
    {getStatusIcon(status, 16)}
    {children || getStatusText(status)}
  </span>
);

// Tarayıcı bilgi component'i
export const BrowserInfo = ({ browser, className = '' }) => (
  <span className={`browser-info ${className}`}>
    {getBrowserIcon(browser)}
    {browser || 'chrome'}
  </span>
);

// Test tipi badge component'i
export const TypeBadge = ({ type, className = '' }) => (
  <span className={`type-badge ${type || 'manual'} ${className}`}>
    {getTestTypeIcon(type)}
    {getTestTypeText(type)}
  </span>
); 