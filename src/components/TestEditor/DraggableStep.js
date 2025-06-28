import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';

const DraggableStep = ({ stepType }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `draggable-${stepType.id}`,
    data: {
      type: 'stepType',
      step: stepType,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000,
    cursor: 'grabbing',
  } : {
    cursor: 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="step-type"
      {...listeners}
      {...attributes}
    >
      <stepType.icon size={20} />
      <div className="step-type-info">
        <span className="step-type-name">{stepType.name}</span>
        <span className="step-type-desc">{stepType.description}</span>
      </div>
      <Plus size={16} className="add-icon" />
    </div>
  );
};

export default DraggableStep; 