'use client';

import { cn } from '@kuteka/shared';
import type { ListingMedia } from '../types';

type PropertyGalleryProps = {
  title: string;
  activeUrl: string | null;
  gallery: ListingMedia[];
  onSelect: (url: string) => void;
};

export function PropertyGallery({ title, activeUrl, gallery, onSelect }: PropertyGalleryProps) {
  return (
    <section className="kuteka-detail-panel overflow-hidden" aria-label={`Galeria de ${title}`}>
      {activeUrl ? (
        <div className="bg-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeUrl}
            alt=""
            className="aspect-[16/9] w-full object-cover"
            decoding="async"
          />
        </div>
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center bg-slate-200">
          <p className="kuteka-detail-meta">Sem fotografia</p>
        </div>
      )}

      {gallery.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto border-t border-[var(--kuteka-detail-line)] p-3">
          {gallery.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onSelect(m.public_url)}
                aria-label={`Fotografia ${m.sort_order + 1} de ${title}`}
                aria-pressed={activeUrl === m.public_url}
                className={cn(
                  'block overflow-hidden rounded-md border-2',
                  activeUrl === m.public_url
                    ? 'border-[var(--kuteka-detail-accent)]'
                    : 'border-transparent',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.public_url}
                  alt=""
                  className="h-16 w-24 object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
