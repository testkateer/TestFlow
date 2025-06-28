import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Save, 
  Play, 
  Download, 
  Upload, 
  Settings, 
  Plus,
  Trash2,
  Edit,
  AlertCircle,
  X,
  Undo,
  Redo,
  Copy,
  Clipboard,
  RefreshCw
} from 'lucide-react';
import useHistory from '../hooks/useHistory';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import { exportTestFlow, importTestFlow } from '../utils/testUtils';
import { runTestWithHandling } from '../utils/testRunner';
import { getFromStorage, setTempData } from '../utils/dataUtils';
import { validateTestFlow } from '../utils/validationUtils';
import { toast} from '../utils/notifications';
import '../styles/main.css';
import { useModal } from '../contexts/ModalContext';
import { useTestFlow } from '../contexts/TestFlowContext';
import { STEP_TYPES } from '../constants/stepTypes';

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
  const { addTestFlow, addTestReport } = useTestFlow();
  
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
  const [selectedSteps, setSelectedSteps] = useState(new Set()); // For multi-selection
  const [copiedSteps, setCopiedSteps] = useState([]); // For copy/paste functionality
  const [isRunning, setIsRunning] = useState(false);
  // const [testResults, setTestResults] = useState(null); // Kept for future use
  const { showTripleConfirm } = useModal();
  const saveTestFlowRef = useRef();

  // Dnd-kit states
  const [activeId, setActiveId] = useState(null);
  const [isOverTrash, setIsOverTrash] = useState(false);

  const hasUnsavedChanges = canUndo && (steps.length > 0 || testName.trim() !== 'Yeni Test Senaryosu');

  const stepTypes = useMemo(() => STEP_TYPES, []);

  const activeStepForOverlay = steps.find(step => step.id === activeId);
  const activeStepTypeForOverlay = stepTypes.find(st => `draggable-${st.id}` === activeId);

  // Keyboard shortcuts setup
  const keyboardHandlers = {
    onUndo: () => canUndo && undo(),
    onRedo: () => canRedo && redo(),
    onSave: () => hasUnsavedChanges && saveTestFlow(),
    onSelectAll: () => {
      if (steps.length > 0) {
        const allStepIds = new Set(steps.map(s => s.id));
        setSelectedSteps(allStepIds);
        toast.info(`${steps.length} adım seçildi`);
      }
    },
    onCopy: () => {
      if (selectedSteps.size > 0) {
        const stepsToCopy = steps.filter(step => selectedSteps.has(step.id));
        setCopiedSteps(stepsToCopy);
        toast.success(`${stepsToCopy.length} adım kopyalandı`);
      } else if (selectedStep) {
        setCopiedSteps([selectedStep]);
        toast.success('Adım kopyalandı');
      }
    },
    onPaste: () => {
      if (copiedSteps.length > 0) {
        pasteSteps();
      }
    },
    onDelete: () => {
      if (selectedSteps.size > 0) {
        deleteSelectedSteps();
      } else if (selectedStep) {
        removeStep(selectedStep.id);
      }
    },
    onDuplicate: () => {
      if (selectedStep) {
        duplicateStep(selectedStep.id);
      }
    },
    onRun: () => !isRunning && steps.length > 0 && runTest(),
    onImport: () => handleImportTestFlow(),
    onExport: () => handleExportTestFlow(),
    onEscape: () => {
      setSelectedSteps(new Set());
      setSelectedStep(null);
    }
  };

  const { shortcuts, formatShortcut } = useKeyboardShortcuts(keyboardHandlers);

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
        toast.error('Test tekrar yüklenirken bir hata oluştu.');
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
        toast.error('Test düzenlenirken bir hata oluştu.');
      }
    }
  }, [location.search, navigate, resetEditorState, stepTypes]);

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
      case 'click': return { description: '' , selector: '#button' };
      case 'input': return { description: '', selector: '#input', text: '' };
      case 'wait': return { description: '', duration: 2000 };
      case 'verify': return { description: '', selector: '#element', text: '' };
      case 'refresh': return { description: '' };
      default: return {};
    }
  };

  const removeStep = (stepId) => {
    setEditorState(s => ({ ...s, steps: s.steps.filter(step => step.id !== stepId) }));
    if (selectedStep?.id === stepId) {
      setSelectedStep(null);
    }
    // Remove from multi-selection if it exists
    setSelectedSteps(prev => {
      const newSet = new Set(prev);
      newSet.delete(stepId);
      return newSet;
    });
  };

  const deleteSelectedSteps = () => {
    if (selectedSteps.size === 0) return;
    
    setEditorState(s => ({
      ...s,
      steps: s.steps.filter(step => !selectedSteps.has(step.id))
    }));
    
    // Clear selections
    setSelectedSteps(new Set());
    if (selectedStep && selectedSteps.has(selectedStep.id)) {
      setSelectedStep(null);
    }
    
    toast.success(`${selectedSteps.size} adım silindi`);
  };

  const duplicateStep = (stepId) => {
    const stepToDuplicate = steps.find(s => s.id === stepId);
    if (!stepToDuplicate) return;

    const duplicatedStep = {
      ...stepToDuplicate,
      id: Date.now() + Math.random(), // Ensure unique ID
      name: `${stepToDuplicate.name} (Kopya)`
    };

    const originalIndex = steps.findIndex(s => s.id === stepId);
    setEditorState(s => {
      const newSteps = [...s.steps];
      newSteps.splice(originalIndex + 1, 0, duplicatedStep);
      return { ...s, steps: newSteps };
    });

    toast.success('Adım çoğaltıldı');
  };

  const pasteSteps = () => {
    if (copiedSteps.length === 0) return;

    const pastedSteps = copiedSteps.map(step => ({
      ...step,
      id: Date.now() + Math.random(), // Ensure unique IDs
      name: step.name.includes('(Kopya)') ? step.name : `${step.name} (Kopya)`
    }));

    setEditorState(s => ({
      ...s,
      steps: [...s.steps, ...pastedSteps]
    }));

    toast.success(`${pastedSteps.length} adım yapıştırıldı`);
  };

  const handleStepSelection = (stepId, isCtrlPressed = false) => {
    if (isCtrlPressed) {
      // Multi-selection with Ctrl
      setSelectedSteps(prev => {
        const newSet = new Set(prev);
        if (newSet.has(stepId)) {
          newSet.delete(stepId);
        } else {
          newSet.add(stepId);
        }
        return newSet;
      });
    } else {
      // Single selection
      setSelectedSteps(new Set());
      setSelectedStep(steps.find(s => s.id === stepId));
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

  // Test raporu kaydetme artık context üzerinden yapılıyor

  const runTest = async () => {
    const testData = { testName, steps };
    await runTestWithHandling(testData, {
      onStart: () => {
        setIsRunning(true);
        setTempData('testRerun', { testName, steps });
      },
      onSuccess: async (result) => {
        await addTestReport(result);
      },
      onError: async (result) => {
        await addTestReport(result);
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
      const newTest = {
        name: testName,
        description: `${steps.length} adımlı test akışı`,
        steps,
        status: 'pending'
      };
      
      await addTestFlow(newTest);
      resetEditorState({ testName, steps });
      
    } catch (error) {
      toast.error('Test akışı kaydedilirken hata oluştu.');
      console.error("Save error:", error);
    }
  }, [testName, steps, resetEditorState, addTestFlow]);

  saveTestFlowRef.current = saveTestFlow;

  const renderSelectedStepConfig = () => {
    if (!selectedStep) {
      return (
        <div className="step-config-empty">
          <div className="empty-state">
            <Settings size={48} className="empty-icon" />
            <h4>Adım Seçin</h4>
            <p>Bir test adımını seçerek detaylarını düzenleyin</p>
          </div>
        </div>
      );
    }

    const { id, config, icon: Icon, name } = selectedStep;

    const handleConfigChange = (key, value) => {
      updateStepConfig(id, { ...config, [key]: value });
    };

    const getFieldType = (key, value) => {
      if (key === 'duration') return 'number';
      if (key === 'url') return 'url';
      return 'text';
    };

    const getFieldLabel = (key) => {
      const labels = {
        url: 'Web Adresi (URL)',
        selector: 'CSS Seçici',
        text: 'Metin İçeriği',
        duration: 'Bekleme Süresi (ms)',
        description: 'Açıklama'
      };
      return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
    };

    const getFieldPlaceholder = (key, value) => {
      const placeholders = {
        url: 'https://example.com',
        selector: '#element-id, .class-name, [data-testid="test"]',
        text: 'Girilecek metin...',
        duration: '2000',
        description: 'Bu adımın açıklaması...'
      };
      return placeholders[key] || `${key} değeri girin...`;
    };



    return (
      <div className="step-config-content">
        <div className="config-header-enhanced">
          <div className="step-icon-wrapper">
            {Icon && <Icon size={24} />}
          </div>
          <div className="step-info">
            <h4 className="step-title">{name}</h4>
            <span className="step-type-label">#{steps.findIndex(s => s.id === id) + 1}</span>
          </div>
          <div className="config-actions">
            <button 
              className="btn-icon btn-icon-sm" 
              onClick={() => duplicateStep(id)}
              title="Adımı Çoğalt"
            >
              <Copy size={16} />
            </button>
            <button 
              className="btn-icon btn-icon-sm btn-danger" 
              onClick={() => removeStep(id)}
              title="Adımı Sil"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="config-form-enhanced">
          {Object.entries(config).map(([key, value]) => (
            <div className="form-field-enhanced" key={key}>
              <label className="field-label">
                {getFieldLabel(key)}
                {key === 'url' || key === 'selector' ? <span className="required-indicator">*</span> : null}
              </label>
              <div className="field-input-wrapper">
                <input
                  type={getFieldType(key, value)}
                  value={value}
                  onChange={(e) => handleConfigChange(key, getFieldType(key, value) === 'number' ? parseInt(e.target.value, 10) || 0 : e.target.value)}
                  placeholder={getFieldPlaceholder(key, value)}
                  className={`field-input ${key === 'url' || key === 'selector' ? 'required' : ''}`}
                  required={key === 'url' || key === 'selector'}
                />
                {key === 'duration' && (
                  <span className="field-suffix">ms</span>
                )}
              </div>
              
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
            <button className="btn btn-secondary" onClick={undo} disabled={!canUndo} title={`Geri Al (${formatShortcut(shortcuts.undo)})`}><Undo size={16} /> Geri Al</button>
            <button className="btn btn-secondary" onClick={redo} disabled={!canRedo} title={`İleri Al (${formatShortcut(shortcuts.redo)})`}><Redo size={16} /> İleri Al</button>
            {selectedSteps.size > 0 && (
              <>
                <button className="btn btn-secondary" onClick={() => keyboardHandlers.onCopy()} title={`Kopyala (${formatShortcut(shortcuts.copy)})`}><Copy size={16} /> Kopyala ({selectedSteps.size})</button>
                <button className="btn btn-danger" onClick={() => keyboardHandlers.onDelete()} title={`Sil (${formatShortcut(shortcuts.delete)})`}><Trash2 size={16} /> Sil ({selectedSteps.size})</button>
              </>
            )}
            {copiedSteps.length > 0 && (
              <button className="btn btn-secondary" onClick={() => keyboardHandlers.onPaste()} title={`Yapıştır (${formatShortcut(shortcuts.paste)})`}><Clipboard size={16} /> Yapıştır ({copiedSteps.length})</button>
            )}
            <button className="btn btn-secondary" onClick={handleImportTestFlow} title={`İçe Aktar (${formatShortcut(shortcuts.import)})`}><Upload size={16} /> İçe Aktar</button>
            <button className="btn btn-secondary" onClick={handleExportTestFlow} title={`Dışa Aktar (${formatShortcut(shortcuts.export)})`}><Download size={16} /> Dışa Aktar</button>
            <button className="btn btn-primary" onClick={saveTestFlow} disabled={!hasUnsavedChanges} title={`Kaydet (${formatShortcut(shortcuts.save)})`}><Save size={16} /> Kaydet</button>
            <button className={`btn btn-success ${isRunning ? 'disabled' : ''}`} onClick={runTest} disabled={isRunning || steps.length === 0} title={`Çalıştır (${formatShortcut(shortcuts.run)})`}><Play size={16} /> {isRunning ? 'Çalışıyor...' : 'Çalıştır'}</button>
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
              onSelect={(stepId, isCtrlPressed) => handleStepSelection(stepId, isCtrlPressed)}
              onRemove={removeStep}
              selectedStep={selectedStep}
              selectedSteps={selectedSteps}
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