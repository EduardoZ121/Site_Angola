'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@kuteka/shared';
import { HERO_MEDIA, type HeroMediaPreset } from '../media/hero-media';

type HeroMediaProps = {
  preset: HeroMediaPreset;
  className?: string;
  /** Compact strip for hubs (default) vs taller band */
  size?: 'md' | 'lg';
  overlay?: ReactNode;
};

/**
 * Reusable atmospheric media band for module hubs.
 * Lazy-loads video when allowed; always falls back to static image.
 */
export function HeroMedia({ preset, className, size = 'md', overlay }: HeroMediaProps) {
  const source = HERO_MEDIA[preset];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [inView, setInView] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const el = videoRef.current?.parentElement;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { rootMargin: '120px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const height =
    size === 'lg' ? 'min-h-[220px] sm:min-h-[280px]' : 'min-h-[160px] sm:min-h-[200px]';

  return (
    <section
      aria-label={source.title}
      className={cn(
        'relative overflow-hidden rounded-kuteka border border-slate-200',
        height,
        className,
      )}
    >
      {/* External CDN + local fallback; next/image remote patterns not used for static export */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={source.image}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/images/hero.jpg';
        }}
      />

      {source.video && inView && !reduceMotion && !videoFailed ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster={source.image}
          onError={() => setVideoFailed(true)}
        >
          <source src={source.video} type="video/mp4" />
        </video>
      ) : null}

      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-900/35"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent"
      />

      <div className="relative z-10 flex h-full flex-col justify-end gap-2 px-5 py-5 sm:px-7 sm:py-7">
        <p className="font-mono text-[11px] font-semibold tracking-[0.16em] text-brand-300 uppercase">
          {source.eyebrow}
        </p>
        <h2 className="max-w-xl text-xl font-semibold tracking-tight text-white sm:text-2xl">
          {source.title}
        </h2>
        <p className="max-w-lg text-sm leading-relaxed text-slate-200 sm:text-base">
          {source.subtitle}
        </p>
        {overlay}
      </div>
    </section>
  );
}
