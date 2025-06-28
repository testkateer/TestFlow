import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { getFromStorage, setToStorage } from '../utils/dataUtils';
import { toast } from '../utils/notifications';

// Storage keys
const STORAGE_KEYS = {
  TEST_FLOWS: 'savedTestFlows',
  TEST_REPORTS: 'testReports',
  SCHEDULED_TESTS: 'scheduledTests',
  ACTIVE_RUNNING_TESTS: 'activeRunningTests',
  USER_SETTINGS: 'userSettings'
};

// Initial state
const initialState = {
  testFlows: [],
  testReports: [],
  scheduledTests: [],
  activeRunningTests: [],
  userSettings: {},
  isLoading: true,
  error: null,
  lastUpdated: null
};

// Action types
const ACTION_TYPES = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  LOAD_ALL_DATA: 'LOAD_ALL_DATA',
  
  // Test Flows
  ADD_TEST_FLOW: 'ADD_TEST_FLOW',
  UPDATE_TEST_FLOW: 'UPDATE_TEST_FLOW',
  DELETE_TEST_FLOW: 'DELETE_TEST_FLOW',
  SET_TEST_FLOWS: 'SET_TEST_FLOWS',
  
  // Test Reports
  ADD_TEST_REPORT: 'ADD_TEST_REPORT',
  SET_TEST_REPORTS: 'SET_TEST_REPORTS',
  
  // Scheduled Tests
  ADD_SCHEDULED_TEST: 'ADD_SCHEDULED_TEST',
  UPDATE_SCHEDULED_TEST: 'UPDATE_SCHEDULED_TEST',
  DELETE_SCHEDULED_TEST: 'DELETE_SCHEDULED_TEST',
  SET_SCHEDULED_TESTS: 'SET_SCHEDULED_TESTS',
  
  // Running Tests
  ADD_RUNNING_TEST: 'ADD_RUNNING_TEST',
  REMOVE_RUNNING_TEST: 'REMOVE_RUNNING_TEST',
  SET_RUNNING_TESTS: 'SET_RUNNING_TESTS',
  CLEAR_EXPIRED_RUNNING_TESTS: 'CLEAR_EXPIRED_RUNNING_TESTS',
  
  // Settings
  UPDATE_SETTINGS: 'UPDATE_SETTINGS'
};

// Reducer
const testFlowReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_LOADING:
      return { ...state, isLoading: action.payload };
      
    case ACTION_TYPES.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
      
    case ACTION_TYPES.LOAD_ALL_DATA:
      return {
        ...state,
        ...action.payload,
        isLoading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      };
      
    // Test Flows
    case ACTION_TYPES.ADD_TEST_FLOW:
      return {
        ...state,
        testFlows: [...state.testFlows, action.payload],
        lastUpdated: new Date().toISOString()
      };
      
    case ACTION_TYPES.UPDATE_TEST_FLOW:
      return {
        ...state,
        testFlows: state.testFlows.map(test => 
          test.id === action.payload.id ? { ...test, ...action.payload } : test
        ),
        lastUpdated: new Date().toISOString()
      };
      
    case ACTION_TYPES.DELETE_TEST_FLOW:
      return {
        ...state,
        testFlows: state.testFlows.filter(test => test.id !== action.payload),
        lastUpdated: new Date().toISOString()
      };
      
    case ACTION_TYPES.SET_TEST_FLOWS:
      return {
        ...state,
        testFlows: action.payload,
        lastUpdated: new Date().toISOString()
      };
      
    // Test Reports
    case ACTION_TYPES.ADD_TEST_REPORT:
      return {
        ...state,
        testReports: [action.payload, ...state.testReports],
        lastUpdated: new Date().toISOString()
      };
      
    case ACTION_TYPES.SET_TEST_REPORTS:
      return {
        ...state,
        testReports: action.payload,
        lastUpdated: new Date().toISOString()
      };
      
    // Scheduled Tests
    case ACTION_TYPES.ADD_SCHEDULED_TEST:
      return {
        ...state,
        scheduledTests: [...state.scheduledTests, action.payload],
        lastUpdated: new Date().toISOString()
      };
      
    case ACTION_TYPES.UPDATE_SCHEDULED_TEST:
      return {
        ...state,
        scheduledTests: state.scheduledTests.map(test => 
          test.id === action.payload.id ? { ...test, ...action.payload } : test
        ),
        lastUpdated: new Date().toISOString()
      };
      
    case ACTION_TYPES.DELETE_SCHEDULED_TEST:
      return {
        ...state,
        scheduledTests: state.scheduledTests.filter(test => test.id !== action.payload),
        lastUpdated: new Date().toISOString()
      };
      
    case ACTION_TYPES.SET_SCHEDULED_TESTS:
      return {
        ...state,
        scheduledTests: action.payload,
        lastUpdated: new Date().toISOString()
      };
      
    // Running Tests
    case ACTION_TYPES.ADD_RUNNING_TEST:
      return {
        ...state,
        activeRunningTests: [...state.activeRunningTests, action.payload],
        lastUpdated: new Date().toISOString()
      };
      
    case ACTION_TYPES.REMOVE_RUNNING_TEST:
      return {
        ...state,
        activeRunningTests: state.activeRunningTests.filter(test => test.id !== action.payload),
        lastUpdated: new Date().toISOString()
      };
      
    case ACTION_TYPES.SET_RUNNING_TESTS:
      return {
        ...state,
        activeRunningTests: action.payload,
        lastUpdated: new Date().toISOString()
      };
      
    case ACTION_TYPES.CLEAR_EXPIRED_RUNNING_TESTS:
      const now = new Date();
      const validTests = state.activeRunningTests.filter(test => {
        const testStartTime = new Date(test.startTime);
        const diffMinutes = (now - testStartTime) / (1000 * 60);
        return diffMinutes < 5; // 5 dakikadan eski testleri temizle
      });
      return {
        ...state,
        activeRunningTests: validTests,
        lastUpdated: new Date().toISOString()
      };
      
    // Settings
    case ACTION_TYPES.UPDATE_SETTINGS:
      return {
        ...state,
        userSettings: { ...state.userSettings, ...action.payload },
        lastUpdated: new Date().toISOString()
      };
      
    default:
      return state;
  }
};

// Context
const TestFlowContext = createContext();

// Hook to use context
export const useTestFlow = () => {
  const context = useContext(TestFlowContext);
  if (!context) {
    throw new Error('useTestFlow must be used within TestFlowProvider');
  }
  return context;
};

// Provider component
export const TestFlowProvider = ({ children }) => {
  const [state, dispatch] = useReducer(testFlowReducer, initialState);

  // Load all data from storage
  const loadAllData = useCallback(async () => {
    try {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });
      
      const [testFlows, testReports, scheduledTests, activeRunningTests, userSettings] = await Promise.all([
        getFromStorage(STORAGE_KEYS.TEST_FLOWS, []),
        getFromStorage(STORAGE_KEYS.TEST_REPORTS, []),
        getFromStorage(STORAGE_KEYS.SCHEDULED_TESTS, []),
        getFromStorage(STORAGE_KEYS.ACTIVE_RUNNING_TESTS, []),
        getFromStorage(STORAGE_KEYS.USER_SETTINGS, {})
      ]);
      
      dispatch({
        type: ACTION_TYPES.LOAD_ALL_DATA,
        payload: {
          testFlows,
          testReports,
          scheduledTests,
          activeRunningTests,
          userSettings
        }
      });
      
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: 'Veriler yüklenirken bir hata oluştu' });
      toast.error('Veriler yüklenirken bir hata oluştu');
    }
  }, []);

  // Persist data to storage
  const persistData = useCallback(async (key, data) => {
    try {
      await setToStorage(key, data);
    } catch (error) {
      console.error(`Veri kaydetme hatası (${key}):`, error);
      toast.error('Veri kaydedilirken bir hata oluştu');
    }
  }, []);

  // Test Flow Actions
  const addTestFlow = useCallback(async (testFlow) => {
    const newTestFlow = {
      ...testFlow,
      id: testFlow.id || Date.now(),
      createdAt: testFlow.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    dispatch({ type: ACTION_TYPES.ADD_TEST_FLOW, payload: newTestFlow });
    
    const updatedFlows = [...state.testFlows, newTestFlow];
    await persistData(STORAGE_KEYS.TEST_FLOWS, updatedFlows);
    
    toast.success(`"${newTestFlow.name}" test akışı oluşturuldu`);
    return newTestFlow;
  }, [state.testFlows, persistData]);

  const updateTestFlow = useCallback(async (id, updates) => {
    const updatedTestFlow = {
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    };
    
    dispatch({ type: ACTION_TYPES.UPDATE_TEST_FLOW, payload: updatedTestFlow });
    
    const updatedFlows = state.testFlows.map(test => 
      test.id === id ? { ...test, ...updatedTestFlow } : test
    );
    await persistData(STORAGE_KEYS.TEST_FLOWS, updatedFlows);
    
    toast.success('Test akışı güncellendi');
    return updatedTestFlow;
  }, [state.testFlows, persistData]);

  const deleteTestFlow = useCallback(async (id) => {
    const testFlow = state.testFlows.find(test => test.id === id);
    if (!testFlow) return false;
    
    dispatch({ type: ACTION_TYPES.DELETE_TEST_FLOW, payload: id });
    
    const updatedFlows = state.testFlows.filter(test => test.id !== id);
    await persistData(STORAGE_KEYS.TEST_FLOWS, updatedFlows);
    
    toast.success(`"${testFlow.name}" test akışı silindi`);
    return true;
  }, [state.testFlows, persistData]);

  // Test Report Actions
  const addTestReport = useCallback(async (testReport) => {
    const newReport = {
      ...testReport,
      id: testReport.id || Date.now(),
      timestamp: testReport.timestamp || new Date().toISOString(),
      testName: testReport.testName || testReport.name || 'İsimsiz Test',
      status: testReport.status || 'error'
    };
    
    dispatch({ type: ACTION_TYPES.ADD_TEST_REPORT, payload: newReport });
    
    const updatedReports = [newReport, ...state.testReports];
    await persistData(STORAGE_KEYS.TEST_REPORTS, updatedReports);
    
    return newReport;
  }, [state.testReports, persistData]);

  // Scheduled Test Actions
  const addScheduledTest = useCallback(async (scheduledTest) => {
    const newScheduledTest = {
      ...scheduledTest,
      id: scheduledTest.id || Date.now(),
      createdAt: scheduledTest.createdAt || new Date().toISOString(),
      isActive: scheduledTest.isActive !== undefined ? scheduledTest.isActive : true
    };
    
    dispatch({ type: ACTION_TYPES.ADD_SCHEDULED_TEST, payload: newScheduledTest });
    
    const updatedScheduled = [...state.scheduledTests, newScheduledTest];
    await persistData(STORAGE_KEYS.SCHEDULED_TESTS, updatedScheduled);
    
    toast.success(`"${newScheduledTest.testName}" zamanlaması oluşturuldu`);
    return newScheduledTest;
  }, [state.scheduledTests, persistData]);

  const updateScheduledTest = useCallback(async (id, updates) => {
    const updatedScheduledTest = {
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    };
    
    dispatch({ type: ACTION_TYPES.UPDATE_SCHEDULED_TEST, payload: updatedScheduledTest });
    
    const updatedScheduled = state.scheduledTests.map(test => 
      test.id === id ? { ...test, ...updatedScheduledTest } : test
    );
    await persistData(STORAGE_KEYS.SCHEDULED_TESTS, updatedScheduled);
    
    toast.success('Zamanlama güncellendi');
    return updatedScheduledTest;
  }, [state.scheduledTests, persistData]);

  const deleteScheduledTest = useCallback(async (id) => {
    const scheduledTest = state.scheduledTests.find(test => test.id === id);
    if (!scheduledTest) return false;
    
    dispatch({ type: ACTION_TYPES.DELETE_SCHEDULED_TEST, payload: id });
    
    const updatedScheduled = state.scheduledTests.filter(test => test.id !== id);
    await persistData(STORAGE_KEYS.SCHEDULED_TESTS, updatedScheduled);
    
    toast.success(`"${scheduledTest.testName}" zamanlaması silindi`);
    return true;
  }, [state.scheduledTests, persistData]);

  // Running Test Actions
  const addRunningTest = useCallback(async (testId, testName) => {
    const runningTest = {
      id: testId,
      name: testName,
      startTime: new Date().toISOString()
    };
    
    dispatch({ type: ACTION_TYPES.ADD_RUNNING_TEST, payload: runningTest });
    
    const updatedRunning = [...state.activeRunningTests, runningTest];
    await persistData(STORAGE_KEYS.ACTIVE_RUNNING_TESTS, updatedRunning);
    
    return runningTest;
  }, [state.activeRunningTests, persistData]);

  const removeRunningTest = useCallback(async (testId) => {
    dispatch({ type: ACTION_TYPES.REMOVE_RUNNING_TEST, payload: testId });
    
    const updatedRunning = state.activeRunningTests.filter(test => test.id !== testId);
    await persistData(STORAGE_KEYS.ACTIVE_RUNNING_TESTS, updatedRunning);
  }, [state.activeRunningTests, persistData]);

  const clearExpiredRunningTests = useCallback(async () => {
    dispatch({ type: ACTION_TYPES.CLEAR_EXPIRED_RUNNING_TESTS });
    
    const now = new Date();
    const validTests = state.activeRunningTests.filter(test => {
      const testStartTime = new Date(test.startTime);
      const diffMinutes = (now - testStartTime) / (1000 * 60);
      return diffMinutes < 5;
    });
    
    await persistData(STORAGE_KEYS.ACTIVE_RUNNING_TESTS, validTests);
    return validTests.length;
  }, [state.activeRunningTests, persistData]);

  // Settings Actions
  const updateSettings = useCallback(async (newSettings) => {
    dispatch({ type: ACTION_TYPES.UPDATE_SETTINGS, payload: newSettings });
    
    const updatedSettings = { ...state.userSettings, ...newSettings };
    await persistData(STORAGE_KEYS.USER_SETTINGS, updatedSettings);
  }, [state.userSettings, persistData]);

  // Listen to storage changes (cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (Object.values(STORAGE_KEYS).includes(event.key)) {
        // Reload data when storage changes in another tab
        loadAllData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadAllData]);

  // Periodic cleanup of expired running tests
  useEffect(() => {
    const interval = setInterval(() => {
      clearExpiredRunningTests();
    }, 30000); // Her 30 saniyede bir temizle

    return () => clearInterval(interval);
  }, [clearExpiredRunningTests]);

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Computed values
  const computedValues = {
    totalTests: state.testFlows.length,
    totalReports: state.testReports.length,
    activeScheduledTests: state.scheduledTests.filter(test => test.isActive).length,
    runningTestsCount: state.activeRunningTests.length,
    
    // Statistics
    getTestStats: () => {
      const reports = state.testReports;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentReports = reports.filter(report => {
        const reportDate = new Date(report.timestamp || report.date);
        return reportDate >= thirtyDaysAgo;
      });
      
      const successful = recentReports.filter(r => r.status === 'success').length;
      const failed = recentReports.filter(r => r.status === 'error').length;
      const successRate = recentReports.length > 0 ? Math.round((successful / recentReports.length) * 100) : 0;
      
      return {
        total: recentReports.length,
        successful,
        failed,
        successRate,
        running: state.activeRunningTests.length
      };
    },
    
    // Get test by ID
    getTestById: (id) => state.testFlows.find(test => test.id === id),
    getReportById: (id) => state.testReports.find(report => report.id === id),
    getScheduledTestById: (id) => state.scheduledTests.find(test => test.id === id)
  };

  const value = {
    // State
    ...state,
    ...computedValues,
    
    // Actions
    loadAllData,
    
    // Test Flow Actions
    addTestFlow,
    updateTestFlow,
    deleteTestFlow,
    
    // Test Report Actions
    addTestReport,
    
    // Scheduled Test Actions
    addScheduledTest,
    updateScheduledTest,
    deleteScheduledTest,
    
    // Running Test Actions
    addRunningTest,
    removeRunningTest,
    clearExpiredRunningTests,
    
    // Settings Actions
    updateSettings
  };

  return (
    <TestFlowContext.Provider value={value}>
      {children}
    </TestFlowContext.Provider>
  );
};

export default TestFlowProvider; 