'use client';

import { useEffect, useState } from 'react';
import { HERO_MEDIA, type HeroMediaPreset } from '../media/hero-media';

type AtmosphereBackgroundProps = {
  preset: HeroMediaPreset;
};

/**
 * Full-bleed cinematic atmosphere.
 * Image always visible at opacity 1. Video mounts with poster — no delayed swap flash.
 */
export function AtmosphereBackground({ preset }: AtmosphereBackgroundProps) {
  const source = HERO_MEDIA[preset];
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

  useEffect(() => {
    setVideoFailed(false);
  }, [preset]);

  const imageSrc = narrow && source.imageMobile ? source.imageMobile : source.image;
  const allowVideo = Boolean(source.video) && !reduceMotion && !narrow && !videoFailed;

  return (
    <div className="kuteka-atmosphere" aria-hidden>
      <div className="kuteka-atmosphere-base" />

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

      {allowVideo ? (
        <video
          key={source.video}
          className="kuteka-atmosphere-media kuteka-atmosphere-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={imageSrc}
          onError={() => setVideoFailed(true)}
        >
          <source src={source.video} type="video/mp4" />
        </video>
      ) : null}

      <div className="kuteka-atmosphere-veil" />
      <div className="kuteka-atmosphere-grain" />
    </div>
  );
}
