import type { Metadata } from 'next';
import { HelpCenterClient } from '@/modules/shell/components/HelpCenterClient';
import { readPublicDoc } from '@/modules/institutional/lib/read-public-doc';

export const metadata: Metadata = {
  title: 'Centro de Ajuda · Manual do Utilizador Kuteka',
  robots: { index: false, follow: false },
};

export default function AjudaPage() {
  const manualMarkdown = readPublicDoc('MANUAL_UTILIZADOR_v1.md');
  return <HelpCenterClient manualMarkdown={manualMarkdown} />;
}
