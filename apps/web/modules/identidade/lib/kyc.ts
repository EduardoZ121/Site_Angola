/** KYC helpers — mirror of server recompute rules for UI labels. */

export type KycLevel = 0 | 1 | 2 | 3 | 4;

export type TrustPillarStatus = 'missing' | 'pending' | 'verified' | 'rejected';

export type TrustPillar = {
  id: 'identity' | 'email' | 'phone' | 'document' | 'address' | 'banking';
  label: string;
  status: TrustPillarStatus;
};

export const KYC_LEVEL_LABELS: Record<KycLevel, string> = {
  0: 'Nível 0 — Conta criada',
  1: 'Nível 1 — Contactos confirmados',
  2: 'Nível 2 — Documento validado',
  3: 'Nível 3 — Identidade Kuteka',
  4: 'Nível 4 — Conta Premium Verificada',
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
  if (status === 'pending') return 'Pendente';
  if (status === 'rejected') return 'Rejeitado';
  return 'Não adicionado';
}

export function actionRequiresKyc(level: number, minLevel: number): boolean {
  return level >= minLevel;
}
