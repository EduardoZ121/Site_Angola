'use client';

import { Button, Heading, Text } from '@kuteka/ui';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getShellCopy } from '@/modules/shell/content';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { locale } = useLocale();
  const copy = getShellCopy(locale).errors;

  useEffect(() => {
    logger.error('Route error', { digest: error.digest, name: error.name });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center gap-4 px-6">
      <Heading level={1}>{copy.routeErrorTitle}</Heading>
      <Text>{copy.routeErrorBody}</Text>
      <Button onClick={reset}>{copy.retry}</Button>
    </main>
  );
}
