import React from 'react';
import { useModal } from '../../contexts/ModalContext';
import Modal from './Modal';

const ModalContainer = () => {
  const { modals, removeModal } = useModal();

  if (modals.length === 0) {
    return null;
  }

  return (
    <>
      {modals.map(modal => (
        <Modal 
          key={modal.id} 
          modal={modal} 
          onClose={removeModal}
        />
      ))}
    </>
  );
};

export default ModalContainer; 