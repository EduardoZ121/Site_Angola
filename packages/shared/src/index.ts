import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format amounts in Angolan Kwanza (AOA) */
export function formatKz(amount: number, locale = 'pt-AO'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function ok<T>(value: T): { ok: true; value: T } {
  return { ok: true, value };
}

export function err<E>(error: E): { ok: false; error: E } {
  return { ok: false, error };
}
