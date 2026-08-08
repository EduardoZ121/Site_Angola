/**
 * KOCC — Kuteka Operating Control Center — status labels.
 *
 * `operational_status` on `platform_feature_flags` is an internal, technical
 * value used by Super Admin. It must NEVER be shown verbatim to end users —
 * always resolve it through `publicStatusLabel` (or `publicModuleBadge` in
 * `./public-label`) first. The end-user-facing copy set is intentionally
 * small and reassuring; it never contains the word "Demo", "disabled",
 * "admin" or any other internal jargon.
 */

import { normalizeLocale, type AppLocale } from '@/modules/i18n/types';

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
 * Public-facing labels shown on end-user badges (property cards, contract
 * detail, marketplace, etc). Every status resolves to one of a handful of
 * reassuring phrases — never the raw internal status, and never "Demo".
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

const PUBLIC_LABEL_EN: Record<KoccOperationalStatus, string> = {
  beta_public: 'Beta',
  beta_private: 'Early access',
  invite_only: 'Early access',
  commercial_active: 'Commercially active',
  preparing: 'In preparation',
  maintenance: 'Under maintenance',
  admin_only: 'In preparation',
  disabled: 'Coming soon',
};

const PUBLIC_LABEL_FR: Record<KoccOperationalStatus, string> = {
  beta_public: 'Bêta',
  beta_private: 'Accès anticipé',
  invite_only: 'Accès anticipé',
  commercial_active: 'Commercialement actif',
  preparing: 'En préparation',
  maintenance: 'En maintenance',
  admin_only: 'En préparation',
  disabled: 'Bientôt disponible',
};

const PUBLIC_LABEL_ES: Record<KoccOperationalStatus, string> = {
  beta_public: 'Beta',
  beta_private: 'Acceso anticipado',
  invite_only: 'Acceso anticipado',
  commercial_active: 'Comercialmente activo',
  preparing: 'En preparación',
  maintenance: 'En mantenimiento',
  admin_only: 'En preparación',
  disabled: 'Disponible pronto',
};

const PUBLIC_BY_LOCALE: Record<AppLocale, Record<KoccOperationalStatus, string>> = {
  pt: PUBLIC_LABEL_PT,
  en: PUBLIC_LABEL_EN,
  fr: PUBLIC_LABEL_FR,
  es: PUBLIC_LABEL_ES,
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

export function publicStatusLabel(
  status: string | null | undefined,
  locale: AppLocale | string = 'pt',
): string {
  const pack = PUBLIC_BY_LOCALE[normalizeLocale(locale)] ?? PUBLIC_LABEL_PT;
  if (status && isKoccOperationalStatus(status)) return pack[status];
  return pack[FALLBACK_STATUS];
}

export function adminStatusLabel(status: string | null | undefined): string {
  if (status && isKoccOperationalStatus(status)) return ADMIN_LABEL_PT[status];
  return status ?? ADMIN_LABEL_PT[FALLBACK_STATUS];
}

export const KOCC_STATUS_OPTIONS: { value: KoccOperationalStatus; label: string }[] =
  KOCC_OPERATIONAL_STATUSES.map((value) => ({ value, label: ADMIN_LABEL_PT[value] }));
