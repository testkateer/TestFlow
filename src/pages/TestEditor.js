import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Save, 
  Play, 
  Download, 
  Upload, 
  Settings, 
  MousePointer,
  Type,
  Navigation,
  Clock,
  Eye,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  AlertCircle,
  X,
  Undo,
  Redo
} from 'lucide-react';
import useHistory from '../hooks/useHistory';
import { exportTestFlow, importTestFlow } from '../utils/testUtils';
import { runTestWithHandling } from '../utils/testRunner';
import { getFromStorage, setToStorage, setTempData } from '../utils/storageUtils';
import { validateTestFlow } from '../utils/validationUtils';
import { saveTestReportToStorage } from '../utils/reportUtils';
import { toast} from '../utils/notifications';
import '../styles/main.css';
import { useNotification } from '../contexts/NotificationContext';
import { useModal } from '../contexts/ModalContext';

// Dnd-kit imports
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

// New modular components
import DraggableStep from '../components/TestEditor/DraggableStep';
import DroppableFlowCanvas from '../components/TestEditor/DroppableFlowCanvas';
import SortableStep from '../components/TestEditor/SortableStep';
import Trash from '../components/TestEditor/Trash';

const TestEditor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    state: editorState,
    setState: setEditorState,
    resetState: resetEditorState,
    undo,
    redo,
    canUndo,
    canRedo
  } = useHistory({ testName: 'Yeni Test Senaryosu', steps: [] });

  const { testName, steps } = editorState;

  const [selectedStep, setSelectedStep] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const { showError } = useNotification();
  const { showTripleConfirm } = useModal();
  const saveTestFlowRef = useRef();

  // Dnd-kit states
  const [activeId, setActiveId] = useState(null);
  const [isOverTrash, setIsOverTrash] = useState(false);

  const hasUnsavedChanges = canUndo;

  const stepTypes = [
    { id: 'navigate', name: 'Git', icon: Navigation, description: 'Belirtilen URL ye git' },
    { id: 'click', name: 'Tıkla', icon: MousePointer, description: 'Element üzerine tıkla' },
    { id: 'input', name: 'Metin Gir', icon: Type, description: 'Alana metin gir' },
    { id: 'wait', name: 'Bekle', icon: Clock, description: 'Belirtilen süre bekle' },
    { id: 'verify', name: 'Doğrula', icon: Eye, description: 'Element varlığını doğrula' },
    { id: 'refresh', name: 'Yenile', icon: RefreshCw, description: 'Sayfayı yenile' }
  ];

  const activeStepForOverlay = steps.find(step => step.id === activeId);
  const activeStepTypeForOverlay = stepTypes.find(st => `draggable-${st.id}` === activeId);

  // Dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const isRerun = urlParams.get('rerun');
    const editTestId = urlParams.get('edit');
    
    const loadData = (data, nameKey, stepsKey) => {
      const stepsWithIcons = (data[stepsKey] || []).map(step => {
        const stepType = stepTypes.find(type => type.id === step.type);
        return { ...step, icon: stepType ? stepType.icon : AlertCircle };
      });
      resetEditorState({ testName: data[nameKey] || 'Yeni Test Senaryosu', steps: stepsWithIcons });
    };

    if (isRerun === 'true') {
      try {
        const rerunTestData = getFromStorage('tempTestRerun');
        if (rerunTestData) {
          loadData(rerunTestData, 'testName', 'steps');
          localStorage.removeItem('tempTestRerun');
          navigate('/editor', { replace: true });
        }
      } catch (error) {
        showError('Test tekrar yüklenirken bir hata oluştu.');
      }
    } else if (editTestId) {
      try {
        const editingTestData = getFromStorage('temp_editingTest');
        if (editingTestData) {
          loadData(editingTestData, 'name', 'steps');
          localStorage.removeItem('temp_editingTest');
          navigate('/editor', { replace: true });
        }
      } catch (error) {
        showError('Test düzenlenirken bir hata oluştu.');
      }
    }
  }, [location.search, navigate, showError, resetEditorState]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = 'Kaydedilmemiş değişiklikleriniz var. Sayfadan çıkmak istediğinizden emin misiniz?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    window.checkTestEditorUnsavedChanges = async () => {
      if (hasUnsavedChanges) {
        const result = await showTripleConfirm({
          title: 'Kaydedilmemiş Değişiklikler',
          message: 'Kaydedilmemiş değişiklikleriniz var. Bu sayfadan çıkmak istediğinizden emin misiniz?',
          saveText: 'Kaydet ve Çık',
          exitText: 'Çık',
          cancelText: 'İptal'
        });
        
        if (result === 'save') {
          await saveTestFlowRef.current();
          return true;
        } else if (result === 'exit') {
          return true;
        } else {
          return false;
        }
      }
      return true;
    };

    return () => {
      delete window.checkTestEditorUnsavedChanges;
    };
  }, [hasUnsavedChanges, showTripleConfirm]);

  const setTestNameState = (name) => {
    setEditorState(currentState => ({ ...currentState, testName: name }));
  };

  const addStep = (stepType, insertIndex = null) => {
    const newStep = {
      id: Date.now(),
      type: stepType.id,
      name: stepType.name,
      icon: stepType.icon,
      config: getDefaultConfig(stepType.id)
    };
    
    setEditorState(s => {
      const newSteps = [...s.steps];
      if (insertIndex !== null && insertIndex >= 0 && insertIndex <= newSteps.length) {
        // Insert at specific position
        newSteps.splice(insertIndex, 0, newStep);
      } else {
        // Add to end (default behavior)
        newSteps.push(newStep);
      }
      return { ...s, steps: newSteps };
    });
    
    // Automatically select the new step to configure it
    setSelectedStep(newStep);
  };

  const getDefaultConfig = (type) => {
    switch (type) {
      case 'navigate': return { url: '' };
      case 'click': return { selector: '#button', description: 'Button element' };
      case 'input': return { selector: '#input', text: 'Sample text', description: 'Input field' };
      case 'wait': return { duration: 2000, description: '2 saniye bekle' };
      case 'verify': return { selector: '#element', description: 'Element visibility check' };
      case 'refresh': return { description: 'Sayfa yenileme' };
      default: return {};
    }
  };

  const removeStep = (stepId) => {
    setEditorState(s => ({ ...s, steps: s.steps.filter(step => step.id !== stepId) }));
    if (selectedStep?.id === stepId) {
      setSelectedStep(null);
    }
  };

  const reorderSteps = (fromId, toId) => {
    setEditorState(currentState => {
      const oldIndex = currentState.steps.findIndex(s => s.id === fromId);
      const newIndex = currentState.steps.findIndex(s => s.id === toId);
      if (oldIndex === -1 || newIndex === -1) return currentState;
      return {
        ...currentState,
        steps: arrayMove(currentState.steps, oldIndex, newIndex),
      };
    });
  };

  const updateStepConfig = (stepId, newConfig) => {
    setEditorState(s => ({
      ...s,
      steps: s.steps.map(step => 
        step.id === stepId ? { ...step, config: { ...step.config, ...newConfig } } : step
      )
    }));
    
    if (selectedStep && selectedStep.id === stepId) {
      setSelectedStep(prev => ({ ...prev, config: { ...prev.config, ...newConfig } }));
    }
  };

  const saveTestReport = (testResult) => {
    const testData = { testName, steps };
    saveTestReportToStorage(testResult, testData);
  };

  const runTest = async () => {
    const testData = { testName, steps };
    await runTestWithHandling(testData, {
      onStart: () => {
        setIsRunning(true);
        setTestResults(null);
        setTempData('testRerun', { testName, steps });
      },
      onSuccess: (result) => {
        setTestResults(result);
        saveTestReport(result);
      },
      onError: (result) => {
        setTestResults(result);
        saveTestReport(result);
      },
      onFinally: () => setIsRunning(false)
    });
  };

  const handleExportTestFlow = () => {
    try {
      exportTestFlow({ testName, steps });
    } catch (error) {
    }
  };

  const handleImportTestFlow = () => {
    importTestFlow(stepTypes, (importedData) => {
      resetEditorState({ testName: importedData.testName, steps: importedData.steps });
      setSelectedStep(null);
      toast.importSuccess(importedData.testName, importedData.steps.length);
    });
  };

  // --- DND-KIT HANDLERS ---
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { over } = event;
    setIsOverTrash(over?.id === 'trash-can');
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    setActiveId(null);
    setIsOverTrash(false);

    if (!over) return;

    if (over.id === 'trash-can') {
      const draggedFromFlow = active.data.current?.type === 'flowStep';
      if (draggedFromFlow) {
        removeStep(active.id);
        toast.info("Test adımı silindi.");
      }
      return;
    }

    const isMovingInFlow = active.data.current?.type === 'flowStep' && over.data.current?.type === 'flowStep';
    if (isMovingInFlow) {
      if (active.id !== over.id) {
        reorderSteps(active.id, over.id);
      }
      return;
    }
    
    const isDroppingNewStep = active.data.current?.type === 'stepType';
    if (isDroppingNewStep) {
      const stepType = active.data.current?.step;
      if (stepType) {
        // Check if dropping over an existing step to insert before it
        if (over.data.current?.type === 'flowStep') {
          const targetStepIndex = steps.findIndex(s => s.id === over.id);
          addStep(stepType, targetStepIndex);
        } else if (over.id === 'flow-end' || over.id === 'flow-canvas') {
          // Dropping on end zone or empty canvas - add to end
          addStep(stepType);
        }
      }
    }
  };

  const saveTestFlow = useCallback(async () => {
    const validationResult = validateTestFlow({ testName, steps });
    if (!validationResult.isValid) {
      toast.error(`Validation Hatası: ${validationResult.errors.join(', ')}`);
      return;
    }

    try {
      const savedTests = getFromStorage('savedTestFlows', []);
      const newTest = {
        id: Date.now(),
        name: testName,
        description: `${steps.length} adımlı test akışı`,
        steps,
        createdAt: new Date().toISOString()
      };
      
      const existingTestIndex = savedTests.findIndex(t => t.id === newTest.id);
      if(existingTestIndex > -1){
        savedTests[existingTestIndex] = newTest;
      } else {
        savedTests.push(newTest);
      }

      setToStorage('savedTestFlows', savedTests);
      toast.saveSuccess(testName);
      
      resetEditorState({ testName, steps });
      
    } catch (error) {
      toast.error('Test akışı kaydedilirken hata oluştu.');
      console.error("Save error:", error);
    }
  }, [testName, steps, resetEditorState]);

  saveTestFlowRef.current = saveTestFlow;

  const renderSelectedStepConfig = () => {
    if (!selectedStep) {
      return (
        <div className="no-selection">
          <Settings size={48} className="settings-icon" />
          <h4>Adım seçin</h4>
          <p>Bir test adımını seçerek detaylarını düzenleyin</p>
        </div>
      );
    }

    const { id, config, icon: Icon, name } = selectedStep;

    const handleConfigChange = (key, value) => {
      updateStepConfig(id, { ...config, [key]: value });
    };

    return (
      <div className="step-config">
        <div className="config-header">
          {Icon && <Icon size={20} />}
          <span>{name}</span>
        </div>
        <div className="config-form">
          {Object.entries(config).map(([key, value]) => (
            <div className="form-group" key={key}>
              <label className="capitalize">{key}:</label>
              <input
                type={typeof value === 'number' ? 'number' : 'text'}
                value={value}
                onChange={(e) => handleConfigChange(key, typeof value === 'number' ? parseInt(e.target.value, 10) || 0 : e.target.value)}
                placeholder={`${key} değeri girin...`}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
    <div className="page-container">
      <div className="editor-header">
        <div className="header-content">
          <div className="test-name-wrapper">
            <Edit size={18} className="edit-icon" />
            <input 
              type="text" 
              value={testName} 
              onChange={(e) => setTestNameState(e.target.value)}
              className="test-name-input"
              placeholder="Test adı girin..."
            />
            {testName !== '' && (
              <button 
                className="test-name-clear-btn" 
                onClick={() => setTestNameState('')}
                title="Test adını temizle"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="header-actions">
            <button className="btn btn-secondary" onClick={undo} disabled={!canUndo} title="Geri Al"><Undo size={16} /> Geri Al</button>
            <button className="btn btn-secondary" onClick={redo} disabled={!canRedo} title="İleri Al"><Redo size={16} /> İleri Al</button>
            <button className="btn btn-secondary" onClick={handleImportTestFlow}><Upload size={16} /> İçe Aktar</button>
            <button className="btn btn-secondary" onClick={handleExportTestFlow}><Download size={16} /> Dışa Aktar</button>
            <button className="btn btn-primary" onClick={saveTestFlow} disabled={!hasUnsavedChanges || steps.length === 0}><Save size={16} /> Kaydet</button>
            <button className={`btn btn-success ${isRunning ? 'disabled' : ''}`} onClick={runTest} disabled={isRunning || steps.length === 0}><Play size={16} /> {isRunning ? 'Çalışıyor...' : 'Çalıştır'}</button>
          </div>
      </div>

      <div className="editor-content">
        <div className="steps-panel card">
            <h3><Plus size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />Test Adımları</h3>
          <div className="step-types">
              {stepTypes.map(stepType => (
                <DraggableStep key={stepType.id} stepType={stepType} />
              ))}
                  </div>
            <Trash isDraggingOver={isOverTrash} />
        </div>

        <div className="flow-panel card">
          <div className="flow-header">
              <h3><RefreshCw size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />Test Akışı</h3>
            <span className="step-count">{steps.length} adım</span>
            </div>
            <DroppableFlowCanvas
              steps={steps}
              onSelect={(stepId) => setSelectedStep(steps.find(s => s.id === stepId))}
              onRemove={removeStep}
              selectedStep={selectedStep}
            />
          </div>
          
          <div className="config-panel card">
            <h3><Edit size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />Adım Detayları</h3>
            {renderSelectedStepConfig()}
          </div>
        </div>
              </div>
      <DragOverlay dropAnimation={dropAnimation}>
        {activeId ? (
          activeStepForOverlay ? (
            <SortableStep 
              step={activeStepForOverlay} 
              index={steps.findIndex(s => s.id === activeId)}
              onSelect={() => {}} 
              onRemove={() => {}} 
              isSelected={false}
              isDragOverlay={true}
            />
          ) : activeStepTypeForOverlay ? (
            <div className="step-type dragging-overlay" style={{ pointerEvents: 'none', boxShadow: 'var(--shadow-xl)', transform: 'rotate(2deg)' }}>
              <activeStepTypeForOverlay.icon size={20} />
              <div className="step-type-info">
                <span className="step-type-name">{activeStepTypeForOverlay.name}</span>
                <span className="step-type-desc">{activeStepTypeForOverlay.description}</span>
              </div>
              <Plus size={16} className="add-icon" />
            </div>
          ) : null
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default TestEditor; 