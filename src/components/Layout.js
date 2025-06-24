import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  List, 
  Edit3, 
  Clock, 
  BarChart3, 
  Settings,
  Play,
  TestTube2
} from 'lucide-react';
import './Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/tests', icon: List, label: 'Akışlar' },
    { path: '/editor', icon: Edit3, label: 'Akış Oluştur' },
    { path: '/scheduling', icon: Clock, label: 'Zamanlama' },
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
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <button className="btn btn-primary sidebar-action">
            <Play size={16} />
            Hızlı Test
          </button>
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