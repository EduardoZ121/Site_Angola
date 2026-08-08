/**
 * Lightweight, static Go Live Readiness checklist shown inside the KOCC
 * panel. Intentionally NOT wired to a database table for Sprint Beta 1 —
 * this is a summary for Super Admin, mirrored by hand from the operational
 * readiness docs. Update this list as milestones move.
 */

export type GoLiveReadinessStatus = 'done' | 'in_progress' | 'pending';

export type GoLiveReadinessItem = {
  key: string;
  label: string;
  status: GoLiveReadinessStatus;
  note?: string;
};

export const GO_LIVE_READINESS: GoLiveReadinessItem[] = [
  {
    key: 'payments_live_gateway',
    label: 'Gateway de pagamento em produção (Multicaixa / EMIS)',
    status: 'pending',
    note: 'Sandbox activo; falta activação comercial dos adaptadores.',
  },
  {
    key: 'kyc_level2',
    label: 'KYC nível 2 obrigatório para arrendamento',
    status: 'in_progress',
  },
  {
    key: 'contracts_esign',
    label: 'Assinatura digital de contratos',
    status: 'in_progress',
  },
  {
    key: 'sms_provider',
    label: 'Fornecedor de SMS activo (OTP e notificações)',
    status: 'pending',
    note: 'Provedor Angola por confirmar; a correr em sandbox.',
  },
  {
    key: 'support_channel',
    label: 'Canal de suporte 24h',
    status: 'pending',
  },
  {
    key: 'legal_docs',
    label: 'Termos, privacidade e manual do utilizador publicados',
    status: 'done',
  },
  {
    key: 'public_copy_review',
    label: 'Nenhuma etiqueta interna ("Demo", "disabled") visível ao utilizador final',
    status: 'done',
    note: 'KOCC + inventário Beta; badges públicos localizados (pt/en/fr/es).',
  },
  {
    key: 'observability',
    label: 'Auditoria e monitorização operacional (KOCC)',
    status: 'in_progress',
    note: 'Painel Beta no código (migration 0035); aplicar no remoto.',
  },
  {
    key: 'beta_panel',
    label: 'Painel Beta — métricas e feedback estruturado',
    status: 'in_progress',
    note: 'UI em /app/super → KOCC; formulário em /app/ajuda.',
  },
];

export function goLiveReadinessSummary(items: GoLiveReadinessItem[] = GO_LIVE_READINESS): {
  done: number;
  inProgress: number;
  pending: number;
  total: number;
} {
  return {
    done: items.filter((i) => i.status === 'done').length,
    inProgress: items.filter((i) => i.status === 'in_progress').length,
    pending: items.filter((i) => i.status === 'pending').length,
    total: items.length,
  };
}
