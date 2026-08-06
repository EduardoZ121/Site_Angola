'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Button, Text } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import {
  isAcceptedPropertyMediaFile,
  isVideoMediaFile,
  mediaKindFromFile,
  PROPERTY_MEDIA_ACCEPT,
  MAX_PROPERTY_VIDEO_BYTES,
} from '@/lib/media/property-media';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getPatrimoniosCopy } from '../content';
import type { LocalMediaDraft } from '../services/property-media-client';

type PropertyMediaEditorProps = {
  value: LocalMediaDraft[];
  onChange: (next: LocalMediaDraft[]) => void;
  disabled?: boolean;
};

function newKey() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `m-${Date.now()}-${Math.random()}`;
}

function MediaPreview({
  url,
  kind,
  className,
}: {
  url: string;
  kind: 'image' | 'video';
  className?: string;
}) {
  if (kind === 'video') {
    return (
      <video
        src={url}
        className={className}
        muted
        playsInline
        preload="metadata"
        controls={false}
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className={className} />;
}

export function PropertyMediaEditor({ value, onChange, disabled }: PropertyMediaEditorProps) {
  const { locale } = useLocale();
  const copy = getPatrimoniosCopy(locale);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      for (const item of value) {
        if (item.file && item.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup only on unmount
  }, []);

  function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files);
    const accepted: File[] = [];
    let rejected = false;
    let tooLarge = false;

    for (const file of incoming) {
      if (!isAcceptedPropertyMediaFile(file)) {
        rejected = true;
        continue;
      }
      if (isVideoMediaFile(file) && file.size > MAX_PROPERTY_VIDEO_BYTES) {
        tooLarge = true;
        continue;
      }
      accepted.push(file);
    }

    if (tooLarge) setNotice(copy.media.videoTooLarge);
    else if (rejected) setNotice(copy.media.unsupported);
    else setNotice(null);

    if (!accepted.length) return;

    const next = [...value];
    for (const file of accepted) {
      const kind = mediaKindFromFile(file);
      next.push({
        key: newKey(),
        file,
        previewUrl: URL.createObjectURL(file),
        isPrimary: next.length === 0,
        kind,
      });
    }
    if (!next.some((m) => m.isPrimary) && next[0]) next[0].isPrimary = true;
    onChange(next);
  }

  function setPrimary(key: string) {
    onChange(value.map((m) => ({ ...m, isPrimary: m.key === key })));
  }

  function removeAt(key: string) {
    const target = value.find((m) => m.key === key);
    if (target?.file && target.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(target.previewUrl);
    }
    const next = value.filter((m) => m.key !== key);
    if (next.length && !next.some((m) => m.isPrimary)) next[0]!.isPrimary = true;
    onChange(next);
  }

  function reorder(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= value.length || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    onChange(next);
  }

  const featured = value.find((m) => m.isPrimary) ?? value[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-slate-800">{copy.media.title}</p>
        <Text className="text-sm font-medium text-stone-700">{copy.media.hint}</Text>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) addFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-kuteka border border-dashed px-4 py-8 text-center transition-colors',
          dragOver ? 'border-brand-400 bg-brand-50' : 'border-slate-300 bg-slate-50/80',
          disabled && 'opacity-60',
        )}
      >
        <p className="text-sm text-slate-700">{copy.media.drop}</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {copy.media.pick}
        </Button>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={PROPERTY_MEDIA_ACCEPT}
          multiple
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {notice ? (
        <p className="rounded-kuteka border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {notice}
        </p>
      ) : null}

      {value.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {value.map((item, index) => {
            const kind = item.kind ?? (item.file ? mediaKindFromFile(item.file) : 'image');
            return (
              <li
                key={item.key}
                draggable={!disabled}
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex != null) reorder(dragIndex, index);
                  setDragIndex(null);
                }}
                className={cn(
                  'relative overflow-hidden rounded-kuteka border border-slate-200 bg-white',
                  item.isPrimary && 'ring-2 ring-brand-500',
                )}
              >
                <MediaPreview
                  url={item.previewUrl}
                  kind={kind}
                  className="aspect-[4/3] w-full object-cover bg-slate-100"
                />
                <div className="flex flex-wrap items-center gap-2 p-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={item.isPrimary ? 'primary' : 'secondary'}
                    disabled={disabled}
                    onClick={() => setPrimary(item.key)}
                  >
                    {item.isPrimary ? copy.media.primary : copy.media.setPrimary}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={disabled}
                    onClick={() => removeAt(item.key)}
                  >
                    {copy.media.remove}
                  </Button>
                </div>
                <span className="absolute left-2 top-2 rounded bg-slate-950/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  #{index + 1}
                </span>
                <span className="absolute right-2 top-2 rounded bg-slate-950/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {kind === 'video' ? copy.media.badgeVideo : copy.media.badgePhoto}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      {featured ? (
        <div className="rounded-kuteka border border-slate-200 bg-white p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {copy.media.preview}
          </p>
          {featured.kind === 'video' || (featured.file && isVideoMediaFile(featured.file)) ? (
            <video
              src={featured.previewUrl}
              controls
              playsInline
              className="aspect-[16/9] w-full max-w-xl rounded-kuteka bg-slate-950 object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={featured.previewUrl}
              alt=""
              className="aspect-[16/9] w-full max-w-xl rounded-kuteka object-cover"
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
