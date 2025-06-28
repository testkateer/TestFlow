import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { NotificationProvider } from './contexts/NotificationContext';
import { ModalProvider } from './contexts/ModalContext';
import Layout from './components/Layout';
import AnimatedRoutes from './components/AnimatedRoutes';
import { ToastContainer } from './components/Toast';
import { ModalContainer } from './components/Modal';
import ContextSetup from './components/ContextSetup';

function App() {
  return (
    <NotificationProvider>
      <ModalProvider>
        <Router>
          <Layout>
            <AnimatedRoutes />
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