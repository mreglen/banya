import { useEffect } from 'react';

export function useReveal() {
  useEffect(() => {
    const reveal = () => {
      const reveals = document.querySelectorAll('.reveal');
      reveals.forEach((element) => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 100;
        if (elementTop < windowHeight - elementVisible) {
          element.classList.add('reveal-active');
        }
      });
    };

    window.addEventListener('scroll', reveal);
    // Initial check
    reveal();

    return () => window.removeEventListener('scroll', reveal);
  }, []);
}
