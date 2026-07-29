import { Heading, Text } from '@kuteka/ui';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center gap-4 px-6">
      <Heading level={1}>Página não encontrada</Heading>
      <Text>O recurso pedido não existe.</Text>
      <Link href="/" className="text-brand-600 hover:underline">
        Ir para a fundação
      </Link>
    </main>
  );
}
