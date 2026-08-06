'use client';

import { Heading, Text } from '@kuteka/ui';
import Link from 'next/link';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getShellCopy } from '@/modules/shell/content';

export default function NotFound() {
  const { locale } = useLocale();
  const copy = getShellCopy(locale).errors;

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center gap-4 px-6">
      <Heading level={1}>{copy.notFoundTitle}</Heading>
      <Text>{copy.notFoundBody}</Text>
      <Link href="/" className="text-brand-600 hover:underline">
        {copy.goHome}
      </Link>
    </main>
  );
}
