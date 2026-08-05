/** Pure finance helpers — safe for unit tests without Supabase. */

export function formatAoaAmount(value: number, currency = 'AOA'): string {
  try {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${Math.round(value)} ${currency}`;
  }
}
