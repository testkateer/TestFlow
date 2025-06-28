import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ModalProvider } from './contexts/ModalContext';
import { TestFlowProvider } from './contexts/TestFlowContext';
import Layout from './components/Layout';
import AnimatedRoutes from './components/AnimatedRoutes';
import { ModalContainer } from './components/Modal';
import ContextSetup from './components/ContextSetup';

function App() {
  return (
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
  );
}

export default App; 