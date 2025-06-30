import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import Dashboard from '../pages/Dashboard';
import TestList from '../pages/TestList';
import TestEditor from '../pages/TestEditor';
import TestReport from '../pages/TestReport';
import Reports from '../pages/Reports';
import Scheduling from '../pages/Scheduling';
import Settings from '../pages/Settings';
import Login from '../pages/Login';
import ProtectedRoute from './ProtectedRoute';
import '../styles/transitions.css';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <div className="routes-wrapper">
      <SwitchTransition>
        <CSSTransition
          key={location.pathname}
          timeout={300}
          classNames="fade"
          unmountOnExit
        >
          <Routes location={location}>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/tests" element={<ProtectedRoute><TestList /></ProtectedRoute>} />
            <Route path="/editor" element={<ProtectedRoute><TestEditor /></ProtectedRoute>} />
            <Route path="/editor/:id" element={<ProtectedRoute><TestEditor /></ProtectedRoute>} />
            <Route path="/report/:id" element={<ProtectedRoute><TestReport /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/scheduling" element={<ProtectedRoute><Scheduling /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          </Routes>
        </CSSTransition>
      </SwitchTransition>
    </div>
  );
};

export default AnimatedRoutes;
