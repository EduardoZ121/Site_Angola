'use client';

import { useEffect, useState } from 'react';
import { HERO_MEDIA, type HeroMediaPreset } from '../media/hero-media';

type AtmosphereBackgroundProps = {
  preset: HeroMediaPreset;
};

/**
 * Full-bleed workspace atmosphere — second plane of the authenticated app.
 * Image always loads; video loops lazily when motion is allowed.
 */
export function AtmosphereBackground({ preset }: AtmosphereBackgroundProps) {
  const source = HERO_MEDIA[preset];
  const [videoReady, setVideoReady] = useState(false);
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
    setVideoReady(false);
    setVideoFailed(false);
    if (reduceMotion || !source.video) return;
    const timer = window.setTimeout(() => setVideoReady(true), 400);
    return () => window.clearTimeout(timer);
  }, [preset, reduceMotion, source.video]);

  return (
    <div className="kuteka-atmosphere" aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={source.image}
        src={source.image}
        alt=""
        className="kuteka-atmosphere-media kuteka-atmosphere-kenburns"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/images/hero.jpg';
        }}
      />

      {source.video && videoReady && !reduceMotion && !videoFailed ? (
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
