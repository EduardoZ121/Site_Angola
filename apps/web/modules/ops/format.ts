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

export function formatDays(days: number | null | undefined): string {
  if (days == null) return '—';
  if (days < 0) return `${Math.abs(days)}d atraso`;
  if (days === 0) return 'Hoje';
  return `${days} dias`;
}

export const EXIT_REASONS: { value: string; label: string }[] = [
  { value: 'mudanca_cidade', label: 'Mudança de cidade' },
  { value: 'compra_casa', label: 'Compra de casa' },
  { value: 'renda_elevada', label: 'Renda elevada' },
  { value: 'mudanca_emprego', label: 'Mudança de emprego' },
  { value: 'outro', label: 'Outro' },
];

export const MAINTENANCE_CATEGORIES: { value: string; label: string }[] = [
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'cleaning', label: 'Limpeza' },
  { value: 'renovation', label: 'Remodelação' },
  { value: 'painting', label: 'Pintura' },
  { value: 'electricity', label: 'Eletricidade' },
  { value: 'plumbing', label: 'Canalização' },
  { value: 'gardening', label: 'Jardinagem' },
  { value: 'security', label: 'Segurança' },
  { value: 'other', label: 'Outro' },
];
