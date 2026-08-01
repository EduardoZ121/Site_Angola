'use client';

import { useEffect, useState } from 'react';
import { HERO_MEDIA, type HeroMediaPreset } from '../media/hero-media';

type AtmosphereBackgroundProps = {
  preset: HeroMediaPreset;
};

/**
 * Full-bleed workspace atmosphere — second plane of the authenticated app.
 * Image always loads; video loops lazily when motion is allowed.
 * Narrow viewports prefer imageMobile / skip video for bandwidth.
 */
export function AtmosphereBackground({ preset }: AtmosphereBackgroundProps) {
  const source = HERO_MEDIA[preset];
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setNarrow(mq.matches);
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const imageSrc = narrow && source.imageMobile ? source.imageMobile : source.image;
  const allowVideo = Boolean(source.video) && !reduceMotion && !narrow;

  useEffect(() => {
    setVideoReady(false);
    setVideoFailed(false);
    if (!allowVideo) return;
    const timer = window.setTimeout(() => setVideoReady(true), 400);
    return () => window.clearTimeout(timer);
  }, [preset, allowVideo]);

  return (
    <div className="kuteka-atmosphere" aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={imageSrc}
        src={imageSrc}
        alt=""
        className="kuteka-atmosphere-media kuteka-atmosphere-kenburns"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/images/hero.jpg';
        }}
      />

      {allowVideo && videoReady && !videoFailed ? (
        <video
          key={source.video}
          className="kuteka-atmosphere-media"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={source.image}
          onError={() => setVideoFailed(true)}
        >
          <source src={source.video} type="video/mp4" />
        </video>
      ) : null}

      <div className="kuteka-atmosphere-veil" />
    </div>
  );
}
