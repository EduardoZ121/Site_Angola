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

export type SmartMoveStatus =
  'draft' | 'awaiting_payment' | 'active' | 'matched' | 'completed' | 'cancelled' | 'failed';

export const SMART_MOVE_STATUS_LABELS: Record<SmartMoveStatus, string> = {
  draft: 'Rascunho',
  awaiting_payment: 'A aguardar pagamento',
  active: 'Activo',
  matched: 'Solução encontrada',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  failed: 'Falhado',
};

export function smartMoveStatusLabel(status: string): string {
  return SMART_MOVE_STATUS_LABELS[status as SmartMoveStatus] ?? status;
}

export function smartMoveStatusTone(status: string): 'default' | 'warning' | 'success' | 'danger' {
  switch (status) {
    case 'active':
    case 'completed':
      return 'success';
    case 'matched':
    case 'awaiting_payment':
    case 'draft':
      return 'warning';
    case 'failed':
    case 'cancelled':
      return 'danger';
    default:
      return 'default';
  }
}

export const URGENCY_LABELS: Record<SmartMoveUrgency, string> = {
  planned_90: 'Planeada (61–90 dias)',
  priority_60: 'Prioritária (31–60 dias)',
  urgent_30: 'Urgente (15–30 dias)',
  emergency_14: 'Emergência (1–14 dias)',
};

export function urgencyLabel(band: string): string {
  return URGENCY_LABELS[band as SmartMoveUrgency] ?? band;
}

export type FindHomeTypologyValue =
  't0' | 't1' | 't2' | 't3' | 't4' | 't5_plus' | 'moradia' | 'terreno' | 'comercial' | 'outro';

export const FIND_HOME_TYPOLOGY_OPTIONS: { value: FindHomeTypologyValue; label: string }[] = [
  { value: 't0', label: 'T0 / Estúdio' },
  { value: 't1', label: 'T1' },
  { value: 't2', label: 'T2' },
  { value: 't3', label: 'T3' },
  { value: 't4', label: 'T4' },
  { value: 't5_plus', label: 'T5 ou mais' },
  { value: 'moradia', label: 'Moradia' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'outro', label: 'Outro' },
];

export function findHomeTypologyLabel(value: string | null | undefined): string {
  if (!value) return 'Sem tipologia';
  return FIND_HOME_TYPOLOGY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export type FindHomeStatus =
  'draft' | 'awaiting_payment' | 'active' | 'matched' | 'completed' | 'cancelled' | 'failed';

export const FIND_HOME_STATUS_LABELS: Record<FindHomeStatus, string> = {
  draft: 'Rascunho',
  awaiting_payment: 'A aguardar pagamento',
  active: 'Procura activa',
  matched: 'Casa encontrada',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  failed: 'Sem solução',
};

export function findHomeStatusLabel(status: string): string {
  return FIND_HOME_STATUS_LABELS[status as FindHomeStatus] ?? status;
}

export function findHomeStatusTone(status: string): 'default' | 'warning' | 'success' | 'danger' {
  switch (status) {
    case 'active':
    case 'completed':
      return 'success';
    case 'matched':
    case 'awaiting_payment':
    case 'draft':
      return 'warning';
    case 'failed':
    case 'cancelled':
      return 'danger';
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
