import { sanitizeBetaPageContext } from './beta-feedback-status';

const CONTEXT_LABELS: Record<string, string> = {
  locale: 'Idioma',
  viewport: 'Ecrã',
  path: 'Caminho',
  route: 'Rota',
};

export type BetaPageContextLine = {
  key: string;
  label: string;
  value: string;
};

/** Ops-facing lines for page_context. Screenshot keys never survive sanitize. */
export function formatBetaPageContextLines(
  raw: Record<string, unknown> | null | undefined,
): BetaPageContextLine[] {
  const clean = sanitizeBetaPageContext(raw);
  if (!clean) return [];
  return Object.entries(clean).map(([key, value]) => ({
    key,
    label: CONTEXT_LABELS[key] ?? key,
    value: String(value),
  }));
}
