import type { Metadata } from 'next';
import { InstitutionalDocument } from '@/modules/institutional/components/InstitutionalDocument';
import { readPublicDoc } from '@/modules/institutional/lib/read-public-doc';

export const metadata: Metadata = {
  title: 'Pacote do jurista · Kuteka',
  description: 'Minuta para o advogado da Kuteka ler e aprovar. Não é parecer jurídico.',
  robots: { index: true, follow: true },
};

export default function LawyerPackPage() {
  return (
    <InstitutionalDocument
      title="Pacote do jurista"
      subtitle="Minuta para leitura e aprovação. Não cria lei e não liga dinheiro real."
      versionNote="Estado: aguarda aprovação do advogado"
      markdown={readPublicDoc('PACOTE_JURISTA_APROVACAO.md')}
      downloads={[{ label: 'Markdown', href: '/docs/PACOTE_JURISTA_APROVACAO.md' }]}
      backHref="/documentacao"
      backLabel="Voltar à documentação"
    />
  );
}
