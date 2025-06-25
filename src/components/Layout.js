import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  PieChart, 
  Workflow,
  Clock,
  FileText,
  Settings,
  Plus,
  TestTube2
} from 'lucide-react';
import './Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Navigasyon öncesi TestEditor unsaved changes kontrolü
  const handleNavigation = async (e, targetPath) => {
    e.preventDefault();
    
    // Sadece TestEditor sayfasındayken kontrol et
    if (location.pathname === '/editor' && window.checkTestEditorUnsavedChanges) {
      const canLeave = await window.checkTestEditorUnsavedChanges();
      if (canLeave) {
        navigate(targetPath);
      }
    } else {
      navigate(targetPath);
    }
  };

  const navItems = [
    { path: '/editor', icon: Plus, label: 'Yeni Akış' },
    { path: '/dashboard', icon: PieChart, label: 'Dashboard' },
    { path: '/tests', icon: Workflow, label: 'Akışlar' },
    { path: '/scheduling', icon: Clock, label: 'Zamanlama' },
    { path: '/reports', icon: FileText, label: 'Raporlar' },
    { path: '/settings', icon: Settings, label: 'Ayarlar' },
  ];

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <TestTube2 size={32} className="logo-icon" />
            <span className="logo-text">TestFlow</span>
          </div>
        </div>
        
        <div className="nav-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isNewFlow = item.label === 'Yeni Akış';
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''} ${isNewFlow ? 'new-flow' : ''}`}
                onClick={(e) => handleNavigation(e, item.path)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>


      </nav>

      <main className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout; 