import type { Metadata } from 'next';
import { StakeholderStubPage } from '@/modules/ops/components/StakeholderStubPage';

export const metadata: Metadata = {
  title: 'Jurídico',
  robots: { index: false, follow: false },
};

export default function JuridicoPage() {
  return (
    <StakeholderStubPage
      eyebrow="Jurídico"
      title="Controlo jurídico"
      subtitle="Contratos, assinaturas, procurações, títulos, certificados e seguros."
      bullets={[
        'Contratos e assinaturas',
        'Procurações e títulos',
        'Certificados e validade documental',
        'Acções judiciais e seguros',
        'Alertas de validade no cockpit operacional',
      ]}
    />
  );
}
