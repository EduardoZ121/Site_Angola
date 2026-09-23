/** Beta feedback status workflow — mirrors migration 0046. */

export const BETA_FEEDBACK_STATUSES = [
  'received',
  'em_analise',
  'classificado',
  'em_desenvolvimento',
  'resolvido',
  'duplicado',
  'nao_reproduzivel',
] as const;

export type BetaFeedbackStatus = (typeof BETA_FEEDBACK_STATUSES)[number];

export const BETA_FEEDBACK_KINDS = ['feedback', 'bug', 'avaliacao', 'reclamacao'] as const;

export type BetaFeedbackKind = (typeof BETA_FEEDBACK_KINDS)[number];

export function isBetaFeedbackStatus(value: string): value is BetaFeedbackStatus {
  return (BETA_FEEDBACK_STATUSES as readonly string[]).includes(value);
}

export function isValidBetaFeedbackKindExpanded(kind: string): kind is BetaFeedbackKind {
  return (BETA_FEEDBACK_KINDS as readonly string[]).includes(kind);
}

/** Allowed transitions (ops triage). Any → terminal ok; terminals are sticky unless reopened to em_analise. */
const TERMINAL: ReadonlySet<BetaFeedbackStatus> = new Set([
  'resolvido',
  'duplicado',
  'nao_reproduzivel',
]);

export function canTransitionBetaFeedbackStatus(
  from: BetaFeedbackStatus,
  to: BetaFeedbackStatus,
): boolean {
  if (from === to) return true;
  if (TERMINAL.has(from)) {
    return to === 'em_analise' || to === 'received';
  }
  return true;
}

export function betaFeedbackStatusLabel(status: string): string {
  switch (status) {
    case 'received':
      return 'Recebido';
    case 'em_analise':
      return 'Em análise';
    case 'classificado':
      return 'Classificado';
    case 'em_desenvolvimento':
      return 'Em desenvolvimento';
    case 'resolvido':
      return 'Resolvido';
    case 'duplicado':
      return 'Duplicado';
    case 'nao_reproduzivel':
      return 'Não reproduzível';
    default:
      return status;
  }
}

/** Sanitize optional page_context — strips screenshot keys; caps size. */
export function sanitizeBetaPageContext(
  raw: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const blocked = new Set(['screenshot', 'screenshot_url', 'image', 'imageBase64', 'blob']);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (blocked.has(key)) continue;
    if (value == null) continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = typeof value === 'string' && value.length > 500 ? value.slice(0, 500) : value;
    }
  }
  const encoded = JSON.stringify(out);
  if (encoded.length > 3500) return null;
  return Object.keys(out).length > 0 ? out : null;
}
