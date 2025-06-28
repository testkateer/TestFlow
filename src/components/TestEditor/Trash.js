import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';

const Trash = ({ isDraggingOver }) => {
  const { setNodeRef } = useDroppable({
    id: 'trash-can',
  });

  const style = {
    padding: 'var(--space-4)',
    marginTop: 'var(--space-4)',
    border: `2px dashed ${isDraggingOver ? 'var(--color-error)' : 'var(--border-primary)'}`,
    color: isDraggingOver ? 'var(--color-error)' : 'var(--text-muted)',
    textAlign: 'center',
    transition: 'all var(--transition-normal)',
    borderRadius: 'var(--radius-2xl)',
    transform: isDraggingOver ? 'scale(1.05)' : 'scale(1)',
    backgroundColor: isDraggingOver ? 'var(--color-error-light)' : 'transparent'
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Trash2 size={24} style={{ margin: '0 auto var(--space-2)' }} />
      <p style={{ margin: 0, fontWeight: '500' }}>
        {isDraggingOver ? "Adımı Silmek İçin Bırak" : "Silmek için buraya sürükle"}
      </p>
    </div>
  );
};

export default Trash; 