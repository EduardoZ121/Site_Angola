'use client';

import { Button, Heading, Text } from '@kuteka/ui';
import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { resolveUiLocale } from '@/modules/i18n/resolve-locale';
import { LOCALE_HTML_LANG } from '@/modules/i18n/types';
import { getShellCopy } from '@/modules/shell/content';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // global-error replaces the root layout entirely, so the LocaleProvider
  // context is unavailable here — read the persisted locale directly.
  const [locale, setLocale] = useState(resolveUiLocale());
  const copy = getShellCopy(locale).errors;

  useEffect(() => {
    setLocale(resolveUiLocale());
    logger.error('Unhandled UI error', { digest: error.digest, name: error.name });
  }, [error]);

  return (
    <html lang={LOCALE_HTML_LANG[locale]}>
      <body className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-6">
        <Heading level={1}>{copy.globalErrorTitle}</Heading>
        <Text>{copy.globalErrorBody}</Text>
        <Button onClick={reset}>{copy.retry}</Button>
      </body>
    </html>
  );
}
