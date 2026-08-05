import type { Metadata } from 'next';
import { InstitutionalDocument } from '@/modules/institutional/components/InstitutionalDocument';
import { readPublicDoc } from '@/modules/institutional/lib/read-public-doc';

export const metadata: Metadata = {
  title: 'Política de Privacidade · Kuteka',
  description:
    'Política de Privacidade da Kuteka — tratamento de dados pessoais, KYC/KIS, cookies, retenção e direitos dos titulares.',
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  const markdown = readPublicDoc('POLITICA_PRIVACIDADE_v1.md');
  return (
    <InstitutionalDocument
      title="Política de Privacidade"
      subtitle="Como a Kuteka recolhe, utiliza, partilha e protege os seus dados pessoais, incluindo KYC, documentos e pagamentos."
      versionNote="Versão 1.0 Beta · Vigência 5 de Agosto de 2026 · privacidade@kutekalink.com"
      markdown={markdown}
      downloads={[
        { label: 'Descarregar PDF', href: '/docs/POLITICA_PRIVACIDADE_v1.pdf' },
        { label: 'Descarregar Word', href: '/docs/POLITICA_PRIVACIDADE_v1.docx' },
        { label: 'Markdown', href: '/docs/POLITICA_PRIVACIDADE_v1.md' },
      ]}
    />
  );
}
