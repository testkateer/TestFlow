import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorState = ({ 
  message = "Bir hata oluştu", 
  icon = <AlertCircle size={24} className="error-icon" />,
  size = "default",
  action = null
}) => {
  const containerClass = `error-container state-container-${size === "small" ? "sm" : size === "large" ? "lg" : ""}`;
  
  return (
    <div className={containerClass}>
      {icon}
      <p>{message}</p>
      {action && (
        <div className="state-actions">
          {action}
        </div>
      )}
    </div>
  );
};

export default ErrorState; 