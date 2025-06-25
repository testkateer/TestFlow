import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NotificationProvider } from './contexts/NotificationContext';
import { ModalProvider } from './contexts/ModalContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TestList from './pages/TestList';
import TestEditor from './pages/TestEditor';
import Scheduling from './pages/Scheduling';
import TestReport from './pages/TestReport';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { ToastContainer } from './components/Toast';
import { ModalContainer } from './components/Modal';
import ContextSetup from './components/ContextSetup';

function App() {
  return (
    <NotificationProvider>
      <ModalProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tests" element={<TestList />} />
              <Route path="/editor" element={<TestEditor />} />
              <Route path="/editor/:id" element={<TestEditor />} />
              <Route path="/scheduling" element={<Scheduling />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/report/:id" element={<TestReport />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
          <ContextSetup />
          <ToastContainer />
          <ModalContainer />
        </Router>
      </ModalProvider>
    </NotificationProvider>
  );
}

export default App; 