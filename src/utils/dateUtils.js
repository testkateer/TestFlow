// Tarih ve saat işlemleri için ortak fonksiyonlar

// Türkçe tarih formatı
export const formatDate = (date, options = {}) => {
  const dateObj = new Date(date);
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options
  };
  
  return dateObj.toLocaleDateString('tr-TR', defaultOptions);
};

// Türkçe saat formatı
export const formatTime = (date, options = {}) => {
  const dateObj = new Date(date);
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options
  };
  
  return dateObj.toLocaleTimeString('tr-TR', defaultOptions);
};

// Tarih ve saat birlikte
export const formatDateTime = (date) => {
  return `${formatDate(date)} ${formatTime(date)}`;
};

// Relatif zaman (X dakika önce, X saat önce)
export const formatRelativeTime = (timestamp) => {
  try {
    const now = new Date();
    const testDate = new Date(timestamp);
    const diffInMinutes = Math.floor((now - testDate) / 60000);
    
    if (diffInMinutes < 1) return 'Az önce';
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} saat önce`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} gün önce`;
    
    // 1 haftadan eski ise normal tarih formatını döndür
    return formatDate(testDate);
  } catch (error) {
    return 'Bilinmeyen';
  }
};

// İki tarih arasındaki farkı hesapla
export const getTimeDifference = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffInMs = end - start;
  
  return {
    milliseconds: diffInMs,
    seconds: Math.floor(diffInMs / 1000),
    minutes: Math.floor(diffInMs / 60000),
    hours: Math.floor(diffInMs / 3600000),
    days: Math.floor(diffInMs / 86400000)
  };
};

// Süre formatı (ms'den okunabilir formata)
export const formatDuration = (durationMs) => {
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  } else if (durationMs < 60000) {
    return `${Math.round(durationMs / 1000)}s`;
  } else if (durationMs < 3600000) {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.round((durationMs % 60000) / 1000);
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(durationMs / 3600000);
    const minutes = Math.floor((durationMs % 3600000) / 60000);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
};

// Bugünün başlangıcı
export const getStartOfDay = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

// Bugünün sonu
export const getEndOfDay = (date = new Date()) => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

// N gün önce
export const getDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

// Tarih aralığı kontrolü
export const isDateInRange = (date, startDate, endDate) => {
  const checkDate = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return checkDate >= start && checkDate <= end;
};

// Bugün mü kontrolü
export const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  
  return today.toDateString() === checkDate.toDateString();
};

// Bu hafta mı kontrolü
export const isThisWeek = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  const weekAgo = getDaysAgo(7);
  
  return checkDate >= weekAgo && checkDate <= today;
};

// ISO string'den Türkçe formatına
export const fromISOString = (isoString) => {
  if (!isoString) return 'Bilinmiyor';
  
  try {
    return formatDateTime(isoString);
  } catch (error) {
    return 'Geçersiz tarih';
  }
};

// Yaş hesaplama (tarihten şimdiye kadar geçen süre)
export const getAge = (date, unit = 'days') => {
  const diff = getTimeDifference(date, new Date());
  return diff[unit] || 0;
}; 