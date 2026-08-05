'use client';

import { Button, Heading, Text } from '@kuteka/ui';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Route error', { digest: error.digest, name: error.name });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center gap-4 px-6">
      <Heading level={1}>Erro</Heading>
      <Text>Estamos a ter dificuldade em mostrar esta página. Tente novamente.</Text>
      <Button onClick={reset}>Tentar novamente</Button>
    </main>
  );
}
