import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ModalProvider } from './contexts/ModalContext';
import { TestFlowProvider } from './contexts/TestFlowContext';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import AnimatedRoutes from './components/AnimatedRoutes';
import { ModalContainer } from './components/Modal';
import ContextSetup from './components/ContextSetup';

function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <TestFlowProvider>
          <Router>
            <Layout>
              <AnimatedRoutes />
            </Layout>
            <ContextSetup />
            <ModalContainer />
          </Router>
        </TestFlowProvider>
      </ModalProvider>
    </AuthProvider>
  );
}

export default App; 