import type { Metadata } from 'next';
import { StakeholderStubPage } from '@/modules/ops/components/StakeholderStubPage';

export const metadata: Metadata = {
  title: 'Financeiro',
  robots: { index: false, follow: false },
};

export default function FinanceiroPage() {
  return (
    <StakeholderStubPage
      eyebrow="Financeiro"
      title="Painel financeiro"
      subtitle="Pagamentos, rendas previstas, atrasos, comissões e previsões de caixa."
      bullets={[
        'Pagamentos recebidos e futuros',
        'Rendas previstas e em atraso',
        'Comissões Kuteka e agentes',
        'Impostos e previsões de caixa',
        'Ligação ao cockpit do Parceiro e Admin',
      ]}
    />
  );
}
