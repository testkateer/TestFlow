import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Edit } from 'lucide-react';

const SortableStep = ({ step, onSelect, onRemove, isSelected, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id, data: { type: 'flowStep', step } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div className="flow-step-container">
      <div
        ref={setNodeRef}
        style={style}
        onClick={() => onSelect(step.id)}
        className={`flow-step ${isSelected ? 'selected' : ''}`}
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