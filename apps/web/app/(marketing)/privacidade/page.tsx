import type { Metadata } from 'next';
import Link from 'next/link';
import { Heading, Text } from '@kuteka/ui';

export const metadata: Metadata = {
  title: 'Política de privacidade',
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Heading level={1}>Política de privacidade</Heading>
      <Text className="mt-4">
        Documento institucional em preparação. A política oficial será publicada antes do tratamento
        de dados de contas de utilizador.
      </Text>
      <Link href="/" className="mt-8 inline-block text-sm text-brand-600 hover:underline">
        Voltar à Landing
      </Link>
    </main>
  );
}
