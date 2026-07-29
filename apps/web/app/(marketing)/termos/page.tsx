import type { Metadata } from 'next';
import Link from 'next/link';
import { Heading, Text } from '@kuteka/ui';

export const metadata: Metadata = {
  title: 'Termos de utilização',
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Heading level={1}>Termos de utilização</Heading>
      <Text className="mt-4">
        Documento institucional em preparação. O conteúdo legal oficial será publicado antes do
        lançamento autenticado.
      </Text>
      <Link href="/" className="mt-8 inline-block text-sm text-brand-600 hover:underline">
        Voltar à Landing
      </Link>
    </main>
  );
}
