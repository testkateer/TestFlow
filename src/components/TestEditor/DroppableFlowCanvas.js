import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableStep from './SortableStep';
import { Plus } from 'lucide-react';

const DroppableFlowCanvas = ({ steps, onSelect, onRemove, selectedStep }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'flow-canvas',
  });

  const { setNodeRef: setEndDropRef, isOver: isOverEnd } = useDroppable({
    id: 'flow-end',
  });

  const droppableStyle = {
    backgroundColor: isOver ? 'var(--bg-hover)' : 'transparent',
    transition: 'background-color 0.2s ease',
  };

  return (
    <div ref={setNodeRef} className="flow-container" style={droppableStyle}>
      {steps.length === 0 ? (
        <div className="empty-flow">
          <div className="empty-content">
            <Plus size={48} className="empty-icon" />
            <h4>Test adımı ekleyin</h4>
            <p>Sol panelden bir adım türü seçerek veya sürükleyerek başlayın</p>
          </div>
        </div>
      ) : (
        <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="flow-steps">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <SortableStep
                  step={step}
                  onSelect={onSelect}
                  onRemove={onRemove}
                  isSelected={selectedStep?.id === step.id}
                  index={index}
                />
                {index < steps.length - 1 && (
                  <div className="flow-connector">
                    <div className="connector-arrow">↓</div>
                  </div>
                )}
              </React.Fragment>
            ))}
            <div 
              ref={setEndDropRef} 
              className={`flow-end-zone ${isOverEnd ? 'drag-over' : ''}`}
            >
              {isOverEnd ? (
                <>
                  <Plus size={20} style={{ marginRight: '8px' }} />
                  "Sona ekle"
                </>
              ) : (
                "Buraya sürükleyerek sona ekleyin"
              )}
            </div>
          </div>
        </SortableContext>
      )}
    </div>
  );
};

export default DroppableFlowCanvas; 