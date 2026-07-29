import type { Metadata } from 'next';
import Link from 'next/link';
import { Heading, Text } from '@kuteka/ui';

export const metadata: Metadata = {
  title: 'Contacto',
  robots: { index: false, follow: false },
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Heading level={1}>Contacto</Heading>
      <Text className="mt-4">
        Canal de contacto institucional em preparação. Para já, explore a visão da Kuteka na Landing
        Page.
      </Text>
      <Link href="/" className="mt-8 inline-block text-sm text-brand-600 hover:underline">
        Voltar à Landing
      </Link>
    </main>
  );
}
