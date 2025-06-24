import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TestList from './pages/TestList';
import TestEditor from './pages/TestEditor';
import Scheduling from './pages/Scheduling';
import TestReport from './pages/TestReport';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tests" element={<TestList />} />
          <Route path="/editor" element={<TestEditor />} />
          <Route path="/editor/:id" element={<TestEditor />} />
          <Route path="/scheduling" element={<Scheduling />} />
          <Route path="/report/:id" element={<TestReport />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App; 