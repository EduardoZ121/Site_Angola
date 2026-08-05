import type { Metadata } from 'next';
import { InstitutionalDocument } from '@/modules/institutional/components/InstitutionalDocument';
import { readPublicDoc } from '@/modules/institutional/lib/read-public-doc';

export const metadata: Metadata = {
  title: 'Termos de Utilização · Kuteka',
  description:
    'Termos e Condições de Utilização da plataforma Kuteka — direitos, deveres, Kuteka Pay, KIS, contratos e comissões.',
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  const markdown = readPublicDoc('TERMOS_UTILIZACAO_v1.md');
  return (
    <InstitutionalDocument
      title="Termos de Utilização"
      subtitle="Regras de utilização da plataforma Kuteka, papéis, serviços, pagamentos, cancelamentos e responsabilidades."
      versionNote="Versão 1.0 Beta · Vigência 5 de Agosto de 2026 · kutekalink.com"
      markdown={markdown}
      downloads={[
        { label: 'Descarregar PDF', href: '/docs/TERMOS_UTILIZACAO_v1.pdf' },
        { label: 'Descarregar Word', href: '/docs/TERMOS_UTILIZACAO_v1.docx' },
        { label: 'Markdown', href: '/docs/TERMOS_UTILIZACAO_v1.md' },
      ]}
    />
  );
}
