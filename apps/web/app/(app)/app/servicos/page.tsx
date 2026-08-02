import type { Metadata } from 'next';
import { StakeholderStubPage } from '@/modules/ops/components/StakeholderStubPage';

export const metadata: Metadata = {
  title: 'Prestadores de Serviços',
  robots: { index: false, follow: false },
};

export default function ServicosPage() {
  return (
    <StakeholderStubPage
      eyebrow="Prestadores"
      title="Rede de prestadores Kuteka"
      subtitle="Pintura, canalização, eletricidade, jardinagem, limpeza, remodelação, segurança e mais."
      bullets={[
        'Agenda e pedidos por categoria',
        'Histórico e avaliações',
        'Faturação e tempo médio de resposta',
        'Papel service_provider (seed) + permissão services.operate',
        'Pedidos originados no cockpit do Cliente residente',
      ]}
    />
  );
}
