/** KIS — Kuteka Identity System helpers (UI + gates). */

export type KycLevel = 0 | 1 | 2 | 3 | 4;

export type TrustPillarStatus = 'missing' | 'pending' | 'verified' | 'rejected';

export type TrustPillar = {
  id: 'identity' | 'email' | 'phone' | 'document' | 'address' | 'banking' | 'photo';
  label: string;
  status: TrustPillarStatus;
};

export type KisStepId =
  'overview' | 'contacts' | 'personal' | 'document' | 'photo' | 'address' | 'banking' | 'privacy';

export const KIS_STEPS: { id: KisStepId; label: string }[] = [
  { id: 'overview', label: 'Resumo' },
  { id: 'contacts', label: 'Contactos' },
  { id: 'personal', label: 'Identidade' },
  { id: 'document', label: 'Documento' },
  { id: 'photo', label: 'Fotografia' },
  { id: 'address', label: 'Morada' },
  { id: 'banking', label: 'Banco' },
  { id: 'privacy', label: 'Privacidade' },
];

export const KYC_LEVEL_LABELS: Record<KycLevel, string> = {
  0: 'Nível 0 — Conta criada',
  1: 'Nível 1 — Contactos confirmados',
  2: 'Nível 2 — Documento validado',
  3: 'Nível 3 — Identidade Kuteka',
  4: 'Nível 4 — Conta Premium Verificada',
};

/** Minimum KYC for commercial / contractual actions. */
export const KIS_ACTION_MIN_LEVEL: Record<string, number> = {
  browse: 0,
  explore: 0,
  contract: 2,
  payment: 2,
  reservation: 2,
  visit: 2,
  purchase: 2,
  sale: 2,
  rent: 2,
  service: 2,
  marketplace: 2,
  smart_move: 2,
  find_home: 2,
  concierge: 2,
  garantia: 2,
  assistencia: 2,
  partner_publish: 2,
  agent_operate: 2,
};

export function statusTone(
  status: TrustPillarStatus,
): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'verified') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'rejected') return 'danger';
  return 'default';
}

export function statusGlyph(status: TrustPillarStatus): string {
  if (status === 'verified') return '🟢';
  if (status === 'pending') return '🟡';
  if (status === 'rejected') return '🔴';
  return '⚪';
}

export function statusLabel(status: TrustPillarStatus): string {
  if (status === 'verified') return 'Verificado';
  if (status === 'pending') return 'Em análise';
  if (status === 'rejected') return 'Rejeitado';
  return 'Não adicionado';
}

export function actionRequiresKyc(level: number, minLevel: number): boolean {
  return level >= minLevel;
}

export function minLevelForAction(action: string): number {
  return KIS_ACTION_MIN_LEVEL[action] ?? 2;
}

export function meetsActionKyc(level: number, action: string): boolean {
  return actionRequiresKyc(level, minLevelForAction(action));
}

/** Suggest next incomplete step for the assistant UX. */
export function suggestNextKisStep(input: {
  emailConfirmed: boolean;
  phoneVerified: boolean;
  hasPersonal: boolean;
  hasDocument: boolean;
  hasPhoto: boolean;
  hasAddress: boolean;
  hasBanking: boolean;
}): KisStepId {
  if (!input.emailConfirmed || !input.phoneVerified) return 'contacts';
  if (!input.hasPersonal) return 'personal';
  if (!input.hasDocument) return 'document';
  if (!input.hasPhoto) return 'photo';
  if (!input.hasAddress) return 'address';
  if (!input.hasBanking) return 'banking';
  return 'overview';
}

export function formatCompleteness(value: number): string {
  const n = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return `${Math.round(n)}%`;
}
