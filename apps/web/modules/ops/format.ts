import type { AppLocale } from '@/modules/i18n/types';
import { getOpsCopy } from './content';

export function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatAoa(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—';
  try {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${Math.round(amount).toLocaleString('pt-PT')} Kz`;
  }
}

export function formatDays(days: number | null | undefined, locale: AppLocale = 'pt'): string {
  if (days == null) return '—';
  const copy = getOpsCopy(locale).dates;
  if (days < 0) return `${Math.abs(days)}${copy.lateSuffix}`;
  if (days === 0) return copy.today;
  return `${days} ${copy.daysSuffix}`;
}

/** @deprecated Use getExitReasons(locale) for locale-aware labels. */
export const EXIT_REASONS: { value: string; label: string }[] = toOptionList(
  getOpsCopy('pt').exitReasons,
);

/** @deprecated Use getMaintenanceCategories(locale) for locale-aware labels. */
export const MAINTENANCE_CATEGORIES: { value: string; label: string }[] = toOptionList(
  getOpsCopy('pt').maintenanceCategories,
);

function toOptionList(labels: Record<string, string>): { value: string; label: string }[] {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}

export function getExitReasons(locale: AppLocale = 'pt'): { value: string; label: string }[] {
  return toOptionList(getOpsCopy(locale).exitReasons);
}

export function getMaintenanceCategories(
  locale: AppLocale = 'pt',
): { value: string; label: string }[] {
  return toOptionList(getOpsCopy(locale).maintenanceCategories);
}
