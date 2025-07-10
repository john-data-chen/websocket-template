import { TOAST_CLASS } from '@/constants/toast';
import { useCallback } from 'react';

export const useToast = (toastId = TOAST_CLASS) => {
  // Show toast with message
  const showToast = useCallback(
    (message: string) => {
      const element = document.querySelector<HTMLElement>(`.${toastId}`);
      if (element) {
        element.textContent = message;
        element.style.display = 'block';
      } else {
        console.error('Toast element not found');
      }
    },
    [toastId]
  );

  // Hide toast
  const hideToast = useCallback(() => {
    const element = document.querySelector<HTMLElement>(`.${toastId}`);
    if (element) {
      element.style.display = 'none';
    }
  }, [toastId]);

  return {
    showToast,
    hideToast
  };
};

export default useToast;
