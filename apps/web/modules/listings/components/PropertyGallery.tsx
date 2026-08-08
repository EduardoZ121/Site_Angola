'use client';

import { cn } from '@kuteka/shared';
import { mediaKindFromUrl } from '@/lib/media/property-media';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getListingsCopy } from '../content';
import type { ListingMedia } from '../types';

type PropertyGalleryProps = {
  title: string;
  activeUrl: string | null;
  gallery: ListingMedia[];
  onSelect: (url: string) => void;
};

function GalleryThumb({ url, kind }: { url: string; kind: 'image' | 'video' }) {
  if (kind === 'video') {
    return (
      <video
        src={url}
        muted
        playsInline
        preload="metadata"
        className="h-16 w-24 bg-slate-900 object-cover"
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img src={url} alt="" className="h-16 w-24 object-cover" loading="lazy" decoding="async" />
  );
}

export function PropertyGallery({ title, activeUrl, gallery, onSelect }: PropertyGalleryProps) {
  const { locale } = useLocale();
  const copy = getListingsCopy(locale).gallery;
  const activeKind = mediaKindFromUrl(
    activeUrl,
    gallery.find((m) => m.public_url === activeUrl)?.media_kind,
  );

  return (
    <section
      className="kuteka-detail-panel overflow-hidden"
      aria-label={copy.ariaTemplate.replace('{title}', title)}
    >
      {activeUrl ? (
        <div className="bg-slate-200">
          {activeKind === 'video' ? (
            <video
              key={activeUrl}
              src={activeUrl}
              controls
              playsInline
              className="aspect-[16/9] w-full bg-slate-950 object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeUrl}
              alt=""
              className="aspect-[16/9] w-full object-cover"
              decoding="async"
            />
          )}
        </div>
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center bg-slate-200">
          <p className="kuteka-detail-meta">{copy.empty}</p>
        </div>
      )}

      {gallery.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto border-t border-[var(--kuteka-detail-line)] p-3">
          {gallery.map((m) => {
            const kind = mediaKindFromUrl(m.public_url, m.media_kind);
            const kindLabel = kind === 'video' ? copy.video : copy.photo;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onSelect(m.public_url)}
                  aria-label={copy.thumbAriaTemplate
                    .replace('{kind}', kindLabel)
                    .replace('{n}', String(m.sort_order + 1))
                    .replace('{title}', title)}
                  aria-pressed={activeUrl === m.public_url}
                  className={cn(
                    'relative block overflow-hidden rounded-md border-2',
                    activeUrl === m.public_url
                      ? 'border-[var(--kuteka-detail-accent)]'
                      : 'border-transparent',
                  )}
                >
                  <GalleryThumb url={m.public_url} kind={kind} />
                  {kind === 'video' ? (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/25 text-lg text-white">
                      ▶
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
