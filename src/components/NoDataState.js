import React from 'react';
import { AlertCircle } from 'lucide-react';

const NoDataState = ({
  title = "Veri bulunamadı",
  message = "Henüz herhangi bir veri bulunmamaktadır.",
  icon = <AlertCircle size={48} className="no-data-icon" />,
  action = null,
  size = "default"
}) => {
  const containerClass = `no-data-container state-container-${size === "small" ? "sm" : size === "large" ? "lg" : ""}`;

  return (
    <div 
      className={containerClass}
      style={{
        border: '2px dashed var(--border-primary)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-secondary)',
        padding: '2rem',
        margin: '2rem 0',
        maxWidth: '100%',
        width: '100%' 
      }}
    >
      {icon}
      <h3>{title}</h3>
      <p>{message}</p>
      {action && (
        <div className="state-actions">
          {action}
        </div>
      )}
    </div>
  );
};

export default NoDataState; 