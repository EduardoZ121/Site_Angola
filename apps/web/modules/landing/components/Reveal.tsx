'use client';

import { cn } from '@kuteka/shared';
import { useEffect, useRef, useState, type ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}

/**
 * Scroll reveal with progressive enhancement.
 * Content remains visible if motion is reduced or observer cannot run —
 * avoids permanently hidden sections (a11y + reliability).
 */
export function Reveal({ children, className, delayMs = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setVisible(true);
      return;
    }

    const show = () => setVisible(true);

    // Already in / near viewport on mount
    const initial = node.getBoundingClientRect();
    if (initial.top < window.innerHeight * 0.92) {
      show();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          show();
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -24px 0px' },
    );

    observer.observe(node);

    // Safety: never leave content permanently hidden
    const fallback = window.setTimeout(show, 1200);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        'transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
        className,
      )}
      style={visible && delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
