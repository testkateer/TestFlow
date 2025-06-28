import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Edit } from 'lucide-react';

const SortableStep = ({ step, onSelect, onRemove, isSelected, index, isDragOverlay = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ 
    id: step.id, 
    data: { type: 'flowStep', step },
    disabled: isDragOverlay, // Disable sorting for overlay
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition, // Disable transition while dragging for smoother experience
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  // Enhanced visual feedback classes
  let stepClasses = `flow-step ${isSelected ? 'selected' : ''}`;
  
  // Add visual feedback when being dragged over (for insertion)
  if (isOver && !isDragging) {
    stepClasses += ' drag-over';
  }

  return (
    <div className="flow-step-container">
      {/* Insertion indicator - shows above the step when dragging over */}
      {isOver && !isDragging && (
        <div className="insertion-indicator">
          <div className="insertion-line"></div>
          <div className="insertion-text">Buraya ekle</div>
        </div>
      )}
      
      <div
        ref={setNodeRef}
        style={style}
        onClick={() => !isDragOverlay && onSelect(step.id)}
        className={stepClasses}
        {...attributes}
        {...listeners}
      >
        <div className="step-number">
          {index + 1}
        </div>
        <div className="step-content">
          <div className="step-header">
            {step.icon && <step.icon size={16} />}
            <span className="step-name">{step.name}</span>
          </div>
          <div className="step-description">
            {step.config.description || step.config.url || step.config.text || 'Yapılandırılmamış'}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SortableStep; 