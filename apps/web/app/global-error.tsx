'use client';

import { Button, Heading, Text } from '@kuteka/ui';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Unhandled UI error', { digest: error.digest, name: error.name });
  }, [error]);

  return (
    <html lang="pt">
      <body className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-6">
        <Heading level={1}>Algo correu mal</Heading>
        <Text>Ocorreu um erro inesperado. Pode tentar novamente.</Text>
        <Button onClick={reset}>Tentar novamente</Button>
      </body>
    </html>
  );
}
