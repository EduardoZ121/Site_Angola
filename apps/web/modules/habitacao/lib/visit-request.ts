export type VisitRequestState = 'none' | 'requested' | 'accepted' | 'cancelled';

export function visitRequestState(notes: string | null | undefined): VisitRequestState {
  const text = notes ?? '';
  if (text.includes('cancelado pelo cliente')) return 'cancelled';
  if (text.includes('Visita aceite pelo agente')) return 'accepted';
  if (text.includes('Pedido de visita')) return 'requested';
  return 'none';
}

export function availabilityLabel(input: {
  lifecycle_status?: string | null;
  expected_available_on?: string | null;
}): string | null {
  const later =
    input.lifecycle_status === 'libertacao_prevista' ||
    input.lifecycle_status === 'temporariamente_indisponivel' ||
    input.lifecycle_status === 'em_manutencao';
  const date = input.expected_available_on?.slice(0, 10) ?? '';
  const futureDate = date && date >= new Date().toISOString().slice(0, 10);
  if (!later && !futureDate) return null;
  if (date) return `Disponível a partir de ${date}`;
  return 'Ainda não disponível';
}
