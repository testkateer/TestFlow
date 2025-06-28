import React from 'react';
import { RefreshCw } from 'lucide-react';

const LoadingState = ({ 
  message = "Veriler yükleniyor...", 
  icon = <RefreshCw size={24} className="loading-spinner" />,
  size = "default"
}) => {
  const containerClass = `loading-container state-container-${size === "small" ? "sm" : size === "large" ? "lg" : ""}`;
  
  return (
    <div className={containerClass}>
      {icon}
      <p>{message}</p>
    </div>
  );
};

export default LoadingState; 