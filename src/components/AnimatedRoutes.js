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
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tests" element={<TestList />} />
            <Route path="/editor" element={<TestEditor />} />
            <Route path="/editor/:id" element={<TestEditor />} />
            <Route path="/report/:id" element={<TestReport />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/scheduling" element={<Scheduling />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </CSSTransition>
      </SwitchTransition>
    </div>
  );
};

export default AnimatedRoutes;
