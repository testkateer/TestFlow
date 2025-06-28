import React, { useEffect } from 'react';
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
import ThemeToggle from './ThemeToggle';
import { useTestFlow } from '../contexts/TestFlowContext';
import '../styles/main.css';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getReportById } = useTestFlow();

  // Dinamik sayfa başlığı ayarlama
  useEffect(() => {
    const updatePageTitle = () => {
      const pathname = location.pathname;
      let title = 'TestFlow';
      
      if (pathname === '/dashboard') {
        title = 'Dashboard - TestFlow';
      } else if (pathname === '/editor') {
        title = 'Test Editörü - TestFlow';
      } else if (pathname === '/tests') {
        title = 'Test Akışları - TestFlow';
      } else if (pathname === '/scheduling') {
        title = 'Zamanlama - TestFlow';
      } else if (pathname === '/reports') {
        title = 'Raporlar - TestFlow';
      } else if (pathname.startsWith('/report/')) {
        const reportId = pathname.split('/')[2];
        // Test raporunun adını context'den almaya çalış
        try {
          const report = getReportById(parseInt(reportId));
          if (report && report.testName) {
            title = `${report.testName} - Rapor - TestFlow`;
          } else {
            title = `Rapor ${reportId} - TestFlow`;
          }
        } catch (error) {
          title = `Rapor ${reportId} - TestFlow`;
        }
      } else if (pathname === '/settings') {
        title = 'Ayarlar - TestFlow';
      }
      
      document.title = title;
      
      // Favicon'u da güncelle (test tüpü ikonu)
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      
      // Sayfa türüne göre favicon rengi belirle
      let iconColor = '#3b82f6'; // Varsayılan mavi
      if (pathname === '/editor') {
        iconColor = '#10b981'; // Yeşil - editör
      } else if (pathname.startsWith('/report/')) {
        iconColor = '#f59e0b'; // Turuncu - rapor
      } else if (pathname === '/dashboard') {
        iconColor = '#8b5cf6'; // Mor - dashboard
      } else if (pathname === '/settings') {
        iconColor = '#6b7280'; // Gri - ayarlar
      }
      
      // SVG favicon oluştur (test tüpü ikonu)
      const svgIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.5 2a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5h5z"/>
          <path d="M11.5 4.5h1a2 2 0 0 1 2 2v8.5a3 3 0 0 1-3 3h-3a3 3 0 0 1-3-3V6.5a2 2 0 0 1 2-2h1"/>
          <path d="m8.5 8.5 2 2 4-4"/>
        </svg>
      `;
      
      const encodedSvg = encodeURIComponent(svgIcon);
      link.href = `data:image/svg+xml,${encodedSvg}`;
    };

    updatePageTitle();
  }, [location.pathname, getReportById]);

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
          <ThemeToggle />
        </div>
        
        <div className="nav-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path === '/reports' && location.pathname.startsWith('/report/'));
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