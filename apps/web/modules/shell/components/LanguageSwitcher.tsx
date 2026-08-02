'use client';

import { cn } from '@kuteka/shared';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { APP_LOCALES, LOCALE_LABELS, type AppLocale } from '@/modules/i18n/types';
import { getShellCopy } from '../content';

type LanguageSwitcherProps = {
  variant?: 'compact' | 'list';
  className?: string;
  onSelected?: () => void;
};

export function LanguageSwitcher({
  variant = 'list',
  className,
  onSelected,
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();
  const shell = getShellCopy(locale);

  if (variant === 'compact') {
    return (
      <label className={cn('inline-flex items-center gap-1.5', className)}>
        <span className="sr-only">{shell.language}</span>
        <select
          value={locale}
          aria-label={shell.language}
          className="kuteka-lang-select"
          onChange={(event) => {
            setLocale(event.target.value as AppLocale);
            onSelected?.();
          }}
        >
          {APP_LOCALES.map((code) => (
            <option key={code} value={code}>
              {LOCALE_LABELS[code]}
            </option>
          ))}
        </select>
      </label>
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
