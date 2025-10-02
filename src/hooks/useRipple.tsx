import { useCallback } from 'react';

export const useRipple = () => {
  const createRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const ripples = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left - radius;
    const y = event.clientY - rect.top - radius;

    ripples.style.width = ripples.style.height = `${diameter}px`;
    ripples.style.left = `${x}px`;
    ripples.style.top = `${y}px`;
    ripples.classList.add('ripple');

    const ripple = button.getElementsByClassName('ripple')[0];
    if (ripple) {
      ripple.remove();
    }

    button.appendChild(ripples);

    setTimeout(() => ripples.remove(), 600);
  }, []);

  return createRipple;
};
