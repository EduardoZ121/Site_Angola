export type SmartMoveUrgency = 'planned_90' | 'priority_60' | 'urgent_30' | 'emergency_14';

export const URGENCY_OPTIONS: { value: SmartMoveUrgency; label: string; days: number }[] = [
  { value: 'planned_90', label: 'Planeada (61–90 dias)', days: 75 },
  { value: 'priority_60', label: 'Prioritária (31–60 dias)', days: 45 },
  { value: 'urgent_30', label: 'Urgente (15–30 dias)', days: 22 },
  { value: 'emergency_14', label: 'Emergência (1–14 dias)', days: 10 },
];

export const PROVIDER_CATEGORIES = [
  { value: 'all', label: 'Todas' },
  { value: 'cleaning', label: 'Limpeza' },
  { value: 'moving', label: 'Mudanças' },
  { value: 'painting', label: 'Pintura' },
  { value: 'plumbing', label: 'Canalização' },
  { value: 'electricity', label: 'Electricidade' },
  { value: 'gardening', label: 'Jardinagem' },
  { value: 'security', label: 'Segurança' },
  { value: 'renovation', label: 'Remodelação' },
  { value: 'internet', label: 'Internet' },
  { value: 'insurance', label: 'Seguros' },
  { value: 'other', label: 'Outros' },
] as const;

export type OrderStatus =
  'requested' | 'quoted' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  requested: 'Pedido',
  quoted: 'Orçamentado',
  accepted: 'Aceite',
  in_progress: 'Em execução',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  disputed: 'Em disputa',
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

export function orderStatusTone(status: string): 'default' | 'warning' | 'success' | 'danger' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'cancelled':
    case 'disputed':
      return 'danger';
    case 'requested':
    case 'quoted':
      return 'warning';
    default:
      return 'default';
  }
}

export const PARTNER_PLAN_OPTIONS = [
  {
    code: 'partner.bronze.monthly',
    name: 'Bronze',
    blurb: 'Visibilidade base + leads prioritários.',
  },
  {
    code: 'partner.silver.monthly',
    name: 'Silver',
    blurb: 'Destaque no explore + relatórios avançados.',
  },
  {
    code: 'partner.gold.monthly',
    name: 'Gold',
    blurb: 'Máxima exposição + KAI comercial + suporte prioritário.',
  },
] as const;
