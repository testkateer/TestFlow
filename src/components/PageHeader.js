import React from 'react';
import PropTypes from 'prop-types';
import '../styles/main.css';

/**
 * Tüm sayfalarda kullanılacak standart başlık bileşeni
 * 
 * @param {string} title - Sayfa başlığı
 * @param {string} subtitle - Sayfa alt başlığı/açıklaması
 * @param {React.ReactNode} actions - Başlık yanında görüntülenecek aksiyonlar (butonlar, vs.)
 * @param {React.ReactNode} stats - Başlık altında görüntülenecek istatistikler
 */
const PageHeader = ({ title, subtitle, actions, stats }) => {
  return (
    <div className="page-header">
      <div className="header-content">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      
      {actions && (
        <div className="header-actions">
          {actions}
        </div>
      )}
      
      {stats && (
        <div className="header-stats">
          {stats}
        </div>
      )}
    </div>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
  stats: PropTypes.node
};

export default PageHeader; 