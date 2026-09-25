'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@kuteka/shared';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { APP_LOCALES, LOCALE_LABELS, type AppLocale } from '@/modules/i18n/types';
import { getShellCopy } from '../content';
import { isInsidePopover, ViewportPopover } from './ViewportPopover';

type LanguageSwitcherProps = {
  variant?: 'compact' | 'list';
  className?: string;
  onSelected?: () => void;
};

const SHORT: Record<AppLocale, string> = {
  pt: 'PT',
  en: 'EN',
  fr: 'FR',
  es: 'ES',
};

export function LanguageSwitcher({
  variant = 'list',
  className,
  onSelected,
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();
  const shell = getShellCopy(locale);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target;
      if (rootRef.current?.contains(target as Node) || isInsidePopover(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (variant === 'compact') {
    return (
      <div ref={rootRef} className={cn('relative shrink-0', className)}>
        <button
          type="button"
          aria-label={shell.language}
          aria-expanded={open}
          aria-haspopup="dialog"
          title={shell.language}
          className="kuteka-lang-button"
          onClick={() => setOpen((value) => !value)}
        >
          {SHORT[locale]}
        </button>
        <ViewportPopover open={open} anchorRef={rootRef} label={shell.language}>
          <div className="kuteka-account-panel__head">
            <div>
              <p className="kuteka-account-panel__title">{shell.language}</p>
              <p className="kuteka-account-panel__meta">{shell.languageHint}</p>
            </div>
          </div>
          <ul className="kuteka-account-panel__scroll flex flex-col gap-1 p-2">
            {APP_LOCALES.map((code) => (
              <li key={code}>
                <button
                  type="button"
                  className={cn(
                    'kuteka-account-role',
                    code === locale && 'kuteka-account-role--active',
                  )}
                  aria-pressed={code === locale}
                  onClick={() => {
                    setLocale(code);
                    setOpen(false);
                    onSelected?.();
                  }}
                >
                  <span>{LOCALE_LABELS[code]}</span>
                  {code === locale ? <span aria-hidden>✓</span> : null}
                </button>
              </li>
            ))}
          </ul>
        </ViewportPopover>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1', className)} role="group" aria-label={shell.language}>
      <p className="kuteka-account-section__title">{shell.language}</p>
      <p className="kuteka-account-section__hint">{shell.languageHint}</p>
      <ul className="mt-1 flex flex-col gap-1">
        {APP_LOCALES.map((code) => (
          <li key={code}>
            <button
              type="button"
              className={cn(
                'kuteka-account-role',
                code === locale && 'kuteka-account-role--active',
              )}
              aria-pressed={code === locale}
              onClick={() => {
                setLocale(code);
                onSelected?.();
              }}
            >
              <span>{LOCALE_LABELS[code]}</span>
              {code === locale ? <span aria-hidden>✓</span> : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
