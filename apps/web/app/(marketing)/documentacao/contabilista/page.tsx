import type { Metadata } from 'next';
import { InstitutionalDocument } from '@/modules/institutional/components/InstitutionalDocument';
import { readPublicDoc } from '@/modules/institutional/lib/read-public-doc';

export const metadata: Metadata = {
  title: 'Pacote do contabilista · Kuteka',
  description: 'Minuta de trabalho para o contabilista da Kuteka ler e aprovar. Não é declaração fiscal.',
  robots: { index: true, follow: true },
};

export default function AccountantPackPage() {
  return (
    <InstitutionalDocument
      title="Pacote do contabilista"
      subtitle="Minuta para leitura e aprovação. Não calcula imposto e não substitui a AGT."
      versionNote="Estado: aguarda aprovação do contabilista · não é plano de contas oficial"
      markdown={readPublicDoc('PACOTE_CONTABILISTA_APROVACAO.md')}
      downloads={[{ label: 'Markdown', href: '/docs/PACOTE_CONTABILISTA_APROVACAO.md' }]}
      backHref="/documentacao"
      backLabel="Voltar à documentação"
    />
  );
}
