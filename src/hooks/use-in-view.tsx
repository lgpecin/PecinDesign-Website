import { useEffect, useRef, useState } from "react";

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useInView = (options: UseInViewOptions = {}) => {
  const { threshold = 0.1, rootMargin = "0px", triggerOnce = false } = options;
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Checagem de posição inicial no carregamento
    const initialRect = element.getBoundingClientRect();
    if (initialRect.top < window.innerHeight && initialRect.bottom > 0) {
      setIsInView(true);
    } else if (initialRect.bottom <= 0) {
      // Elemento já passou acima da tela no carregamento inicial
      setIsInView(true);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        } else {
          // Se o elemento estiver ACIMA da tela (top < 0), MANTÉM VISÍVEL
          // Se o elemento estiver ABAIXO da tela (top >= 0), OCULTA para re-animar ao rolar para baixo
          if (entry.boundingClientRect.top < 0) {
            setIsInView(true);
          } else {
            setIsInView(false);
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isInView };
};
