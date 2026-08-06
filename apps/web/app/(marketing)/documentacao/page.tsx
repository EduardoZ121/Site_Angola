import type { Metadata } from 'next';
import Link from 'next/link';
import { HelpCenterClient } from '@/modules/shell/components/HelpCenterClient';
import { loadHelpDocs } from '@/modules/institutional/lib/help-docs';
import { LanguageSwitcher } from '@/modules/shell/components/LanguageSwitcher';

export const metadata: Metadata = {
  title: 'Centro de Documentação Kuteka',
  description:
    'Manual do utilizador, FAQ, glossário, novidades e estado dos serviços da Kuteka — acesso público, sem necessidade de sessão iniciada.',
  robots: { index: true, follow: true },
};

export default function DocumentacaoPage() {
  const docs = loadHelpDocs();
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-10 sm:px-6 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-sm font-medium text-brand-700 hover:underline">
          ← Kuteka
        </Link>
        <LanguageSwitcher variant="compact" />
      </div>
      <HelpCenterClient docs={docs} basePath="/documentacao" publicMode />
    </main>
  );
}
