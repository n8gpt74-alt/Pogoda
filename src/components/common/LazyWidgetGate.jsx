import { useEffect, useRef, useState } from 'react';

const LazyWidgetGate = ({
  children,
  fallback = null,
  className = '',
  rootMargin = '200px 0px',
  threshold = 0.01,
  triggerOnce = true,
}) => {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (triggerOnce && isVisible) {
      return undefined;
    }

    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return undefined;
    }

    const target = containerRef.current;
    if (!target) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return;
        }

        if (triggerOnce) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
          return;
        }

        setIsVisible(entry.isIntersecting);
      },
      { rootMargin, threshold }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [isVisible, rootMargin, threshold, triggerOnce]);

  return <div ref={containerRef} className={className}>{isVisible ? children : fallback}</div>;
};

export default LazyWidgetGate;
