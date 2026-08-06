import type { AppLocale } from '@/modules/i18n/types';
import { getMonetizationCopy } from '../content';

export type SmartMoveUrgency = 'planned_90' | 'priority_60' | 'urgent_30' | 'emergency_14';

export const URGENCY_OPTIONS: { value: SmartMoveUrgency; label: string; days: number }[] = [
  { value: 'planned_90', label: 'Planeada (61–90 dias)', days: 75 },
  { value: 'priority_60', label: 'Prioritária (31–60 dias)', days: 45 },
  { value: 'urgent_30', label: 'Urgente (15–30 dias)', days: 22 },
  { value: 'emergency_14', label: 'Emergência (1–14 dias)', days: 10 },
];

export function urgencyOptionLabel(value: SmartMoveUrgency, locale: AppLocale = 'pt'): string {
  return getMonetizationCopy(locale).catalog.urgency[value];
}

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

export type ProviderCategoryValue = (typeof PROVIDER_CATEGORIES)[number]['value'];

export function providerCategoryLabel(value: string, locale: AppLocale = 'pt'): string {
  const catalog = getMonetizationCopy(locale).catalog.providerCategories as Record<string, string>;
  return catalog[value] ?? value;
}

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

export function orderStatusLabel(status: string, locale: AppLocale = 'pt'): string {
  const catalog = getMonetizationCopy(locale).catalog.orderStatus as Record<string, string>;
  return catalog[status] ?? status;
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

export function smartMoveStatusLabel(status: string, locale: AppLocale = 'pt'): string {
  const catalog = getMonetizationCopy(locale).catalog.smartMoveStatus as Record<string, string>;
  return catalog[status] ?? status;
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

export function urgencyLabel(band: string, locale: AppLocale = 'pt'): string {
  const catalog = getMonetizationCopy(locale).catalog.urgency as Record<string, string>;
  return catalog[band] ?? band;
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

export function findHomeTypologyOptionLabel(
  value: FindHomeTypologyValue,
  locale: AppLocale = 'pt',
): string {
  return getMonetizationCopy(locale).catalog.findHomeTypology[value];
}

export function findHomeTypologyLabel(
  value: string | null | undefined,
  locale: AppLocale = 'pt',
): string {
  const copy = getMonetizationCopy(locale).catalog;
  if (!value) return copy.findHomeTypologyNone;
  return (copy.findHomeTypology as Record<string, string>)[value] ?? value;
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

export function findHomeStatusLabel(status: string, locale: AppLocale = 'pt'): string {
  const catalog = getMonetizationCopy(locale).catalog.findHomeStatus as Record<string, string>;
  return catalog[status] ?? status;
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

export type ConciergeCategoryValue =
  | 'housing_guidance'
  | 'contract_support'
  | 'document_support'
  | 'move_coordination'
  | 'property_support'
  | 'other';

export const CONCIERGE_CATEGORY_OPTIONS: { value: ConciergeCategoryValue; label: string }[] = [
  { value: 'housing_guidance', label: 'Orientação habitacional' },
  { value: 'contract_support', label: 'Apoio com contrato' },
  { value: 'document_support', label: 'Apoio documental' },
  { value: 'move_coordination', label: 'Coordenação de mudança' },
  { value: 'property_support', label: 'Apoio com imóvel' },
  { value: 'other', label: 'Outro pedido' },
];

export function conciergeCategoryOptionLabel(
  value: ConciergeCategoryValue,
  locale: AppLocale = 'pt',
): string {
  return getMonetizationCopy(locale).catalog.conciergeCategory[value];
}

export function conciergeCategoryLabel(value: string, locale: AppLocale = 'pt'): string {
  const catalog = getMonetizationCopy(locale).catalog.conciergeCategory as Record<string, string>;
  return catalog[value] ?? value;
}

export type ConciergeStatus =
  'draft' | 'awaiting_payment' | 'active' | 'in_progress' | 'completed' | 'cancelled' | 'failed';

export const CONCIERGE_STATUS_LABELS: Record<ConciergeStatus, string> = {
  draft: 'Rascunho',
  awaiting_payment: 'A aguardar pagamento',
  active: 'A aguardar operador',
  in_progress: 'Em atendimento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  failed: 'Falhado',
};

export function conciergeStatusLabel(status: string, locale: AppLocale = 'pt'): string {
  const catalog = getMonetizationCopy(locale).catalog.conciergeStatus as Record<string, string>;
  return catalog[status] ?? status;
}

export function conciergeStatusTone(status: string): 'default' | 'warning' | 'success' | 'danger' {
  switch (status) {
    case 'active':
    case 'completed':
      return 'success';
    case 'draft':
    case 'awaiting_payment':
    case 'in_progress':
      return 'warning';
    case 'cancelled':
    case 'failed':
      return 'danger';
    default:
      return 'default';
  }
}

export type GarantiaStatus =
  'draft' | 'awaiting_payment' | 'active' | 'cancelled' | 'past_due' | 'failed';

export const GARANTIA_STATUS_LABELS: Record<GarantiaStatus, string> = {
  draft: 'Rascunho',
  awaiting_payment: 'A aguardar pagamento',
  active: 'Cobertura activa',
  cancelled: 'Cancelada',
  past_due: 'Pagamento em atraso',
  failed: 'Falhada',
};

export function garantiaStatusLabel(status: string, locale: AppLocale = 'pt'): string {
  const catalog = getMonetizationCopy(locale).catalog.garantiaStatus as Record<string, string>;
  return catalog[status] ?? status;
}

export function garantiaStatusTone(status: string): 'default' | 'warning' | 'success' | 'danger' {
  switch (status) {
    case 'active':
      return 'success';
    case 'draft':
    case 'awaiting_payment':
    case 'past_due':
      return 'warning';
    case 'cancelled':
    case 'failed':
      return 'danger';
    default:
      return 'default';
  }
}

export type AssistenciaCategoryValue =
  'plumbing' | 'electricity' | 'locksmith' | 'security' | 'water_damage' | 'gas' | 'other';

export const ASSISTENCIA_CATEGORY_OPTIONS: {
  value: AssistenciaCategoryValue;
  label: string;
}[] = [
  { value: 'plumbing', label: 'Canalização' },
  { value: 'electricity', label: 'Electricidade' },
  { value: 'locksmith', label: 'Fechaduras e chaves' },
  { value: 'security', label: 'Segurança' },
  { value: 'water_damage', label: 'Infiltração ou inundação' },
  { value: 'gas', label: 'Gás' },
  { value: 'other', label: 'Outra emergência' },
];

export function assistenciaCategoryOptionLabel(
  value: AssistenciaCategoryValue,
  locale: AppLocale = 'pt',
): string {
  return getMonetizationCopy(locale).catalog.assistenciaCategory[value];
}

export function assistenciaCategoryLabel(value: string, locale: AppLocale = 'pt'): string {
  const catalog = getMonetizationCopy(locale).catalog.assistenciaCategory as Record<string, string>;
  return catalog[value] ?? value;
}

export type AssistenciaUrgencyValue = 'urgent' | 'emergency';

export const ASSISTENCIA_URGENCY_OPTIONS: {
  value: AssistenciaUrgencyValue;
  label: string;
}[] = [
  { value: 'urgent', label: 'Urgente — nas próximas 24 horas' },
  { value: 'emergency', label: 'Emergência — risco imediato' },
];

export function assistenciaUrgencyOptionLabel(
  value: AssistenciaUrgencyValue,
  locale: AppLocale = 'pt',
): string {
  return getMonetizationCopy(locale).catalog.assistenciaUrgency[value];
}

export function assistenciaUrgencyLabel(value: string, locale: AppLocale = 'pt'): string {
  const catalog = getMonetizationCopy(locale).catalog.assistenciaUrgency as Record<string, string>;
  return catalog[value] ?? value;
}

export type AssistenciaStatus =
  'draft' | 'awaiting_payment' | 'active' | 'in_progress' | 'completed' | 'cancelled' | 'failed';

export const ASSISTENCIA_STATUS_LABELS: Record<AssistenciaStatus, string> = {
  draft: 'Rascunho',
  awaiting_payment: 'A aguardar pagamento',
  active: 'A aguardar operador',
  in_progress: 'Assistência em curso',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  failed: 'Falhada',
};

export function assistenciaStatusLabel(status: string, locale: AppLocale = 'pt'): string {
  const catalog = getMonetizationCopy(locale).catalog.assistenciaStatus as Record<string, string>;
  return catalog[status] ?? status;
}

export function assistenciaStatusTone(
  status: string,
): 'default' | 'warning' | 'success' | 'danger' {
  switch (status) {
    case 'active':
    case 'completed':
      return 'success';
    case 'draft':
    case 'awaiting_payment':
    case 'in_progress':
      return 'warning';
    case 'cancelled':
    case 'failed':
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

export type PartnerPlanCode = (typeof PARTNER_PLAN_OPTIONS)[number]['code'];

export function partnerPlanName(code: string, locale: AppLocale = 'pt'): string {
  const catalog = getMonetizationCopy(locale).catalog.partnerPlanNames as Record<string, string>;
  return catalog[code] ?? code;
}

export function partnerPlanBlurb(code: string, locale: AppLocale = 'pt'): string {
  const catalog = getMonetizationCopy(locale).catalog.partnerPlanBlurbs as Record<string, string>;
  return catalog[code] ?? '';
}
