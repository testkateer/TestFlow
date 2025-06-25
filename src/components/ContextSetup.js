import { useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useModal } from '../contexts/ModalContext';
import { setNotificationContext } from '../utils/notificationUtils';
import { setModalContext } from '../utils/modalUtils';
import { setGlobalNotification } from '../utils/globalNotification';

const ContextSetup = () => {
  const notification = useNotification();
  const modal = useModal();

  useEffect(() => {
    if (notification) {
      setNotificationContext(notification);
      setGlobalNotification(notification);
    }
    if (modal) {
      setModalContext(modal);
    }
  }, [notification, modal]);

  return null; // This component doesn't render anything
};

export default ContextSetup; 