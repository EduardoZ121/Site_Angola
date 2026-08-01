/** Format AOA amounts for listing cards (pt-AO / fallback). */
export function formatAoa(value: number | null | undefined, purpose?: string | null): string {
  if (value == null || Number.isNaN(value)) return 'Preço sob consulta';
  const formatted = new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(value);
  if (purpose === 'rent') return `${formatted} / mês`;
  return formatted;
}
