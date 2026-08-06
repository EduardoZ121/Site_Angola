/**
 * KOCC — Kuteka Operating Control Center — status labels.
 *
 * `operational_status` on `platform_feature_flags` is an internal, technical
 * value used by Super Admin. It must NEVER be shown verbatim to end users —
 * always resolve it through `publicStatusLabel` (or `publicModuleBadge` in
 * `./public-label`) first. The end-user-facing copy set is intentionally
 * small and reassuring; it never contains the word "Demo", "disabled",
 * "admin" or any other internal jargon.
 *
 * This module intentionally hardcodes Portuguese copy (the platform's
 * primary language for operator-facing tooling) rather than wiring a full
 * i18n pack — matching the "minimal i18n" scope of Sprint Beta 1.
 */

export const KOCC_OPERATIONAL_STATUSES = [
  'beta_public',
  'beta_private',
  'commercial_active',
  'preparing',
  'maintenance',
  'admin_only',
  'disabled',
  'invite_only',
] as const;

export type KoccOperationalStatus = (typeof KOCC_OPERATIONAL_STATUSES)[number];

export function isKoccOperationalStatus(value: string): value is KoccOperationalStatus {
  return (KOCC_OPERATIONAL_STATUSES as readonly string[]).includes(value);
}

/**
 * Public-facing label (pt-PT/pt-AO), shown on end-user badges (property
 * cards, contract detail, marketplace, etc). Every status resolves to one of
 * a handful of reassuring phrases — never the raw internal status, and never
 * "Demo".
 */
const PUBLIC_LABEL_PT: Record<KoccOperationalStatus, string> = {
  beta_public: 'Beta',
  beta_private: 'Acesso antecipado',
  invite_only: 'Acesso antecipado',
  commercial_active: 'Comercial activo',
  preparing: 'Em preparação',
  maintenance: 'Em manutenção',
  // admin_only / disabled must never leak "admin" or "disabled" to end users.
  admin_only: 'Em preparação',
  disabled: 'Disponível em breve',
};

/**
 * Admin-facing label used only inside the Super Admin / KOCC panel (status
 * select, audit trail). These may be literal/technical — they are never
 * rendered outside the Super Admin surface.
 */
const ADMIN_LABEL_PT: Record<KoccOperationalStatus, string> = {
  beta_public: 'Beta pública',
  beta_private: 'Beta privada',
  commercial_active: 'Comercial activo',
  preparing: 'Em preparação',
  maintenance: 'Em manutenção',
  admin_only: 'Apenas administração',
  disabled: 'Desactivado',
  invite_only: 'Apenas convite',
};

const FALLBACK_STATUS: KoccOperationalStatus = 'beta_public';

export function publicStatusLabel(status: string | null | undefined): string {
  if (status && isKoccOperationalStatus(status)) return PUBLIC_LABEL_PT[status];
  return PUBLIC_LABEL_PT[FALLBACK_STATUS];
}

export function adminStatusLabel(status: string | null | undefined): string {
  if (status && isKoccOperationalStatus(status)) return ADMIN_LABEL_PT[status];
  return status ?? ADMIN_LABEL_PT[FALLBACK_STATUS];
}

export const KOCC_STATUS_OPTIONS: { value: KoccOperationalStatus; label: string }[] =
  KOCC_OPERATIONAL_STATUSES.map((value) => ({ value, label: ADMIN_LABEL_PT[value] }));
