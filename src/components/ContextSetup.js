import { useEffect } from 'react';
import { useModal } from '../contexts/ModalContext';
import { setModalContext } from '../utils/modalUtils';

const ContextSetup = () => {
  const modal = useModal();

  useEffect(() => {
    if (modal) {
      setModalContext(modal);
    }
  }, [modal]);

  return null; // This component doesn't render anything
};

export default ContextSetup; 