import type { Metadata } from 'next';
import { HelpCenterClient } from '@/modules/shell/components/HelpCenterClient';
import { loadHelpDocs } from '@/modules/institutional/lib/help-docs';

export const metadata: Metadata = {
  title: 'Centro de Documentação Kuteka · Manual, FAQ, Glossário',
  robots: { index: false, follow: false },
};

export default function AjudaPage() {
  const docs = loadHelpDocs();
  return <HelpCenterClient docs={docs} basePath="/app/ajuda" />;
}
