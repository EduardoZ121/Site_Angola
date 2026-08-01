/** Labels for Manual Operacional fields — shared by activate form + detail panels. */

export const SERVICE_LABELS: Record<string, string> = {
  announce: 'Apenas anunciar o imóvel',
  find_buyer: 'Apenas encontrar comprador',
  find_tenant: 'Apenas encontrar arrendatário',
  rental_management: 'Entregar a gestão do arrendamento à Kuteka',
  full_management: 'Entregar a gestão completa do património à Kuteka',
  evaluation: 'Solicitar avaliação profissional',
  photography: 'Solicitar sessão fotográfica profissional',
  technical_visit: 'Solicitar visita técnica',
  renovation: 'Solicitar remodelação',
  renewal: 'Solicitar renovação',
  construction_finish: 'Solicitar conclusão da construção',
  home_staging: 'Solicitar decoração / Home Staging',
  cleaning: 'Solicitar limpeza profissional',
  maintenance: 'Solicitar manutenção',
  works_supervision: 'Solicitar fiscalização de obra',
  condo_admin: 'Solicitar administração do condomínio',
};

export const MANAGEMENT_LABELS: Record<string, string> = {
  announce_only: 'Apenas anunciar',
  find_buyer: 'Apenas vender (encontrar comprador)',
  find_tenant: 'Apenas arrendar (encontrar arrendatário)',
  rental_management: 'Gestão do arrendamento pela Kuteka',
  full_management: 'Gestão completa do património pela Kuteka',
};

export const RENOVATION_LABELS: Record<string, string> = {
  full_renovation: 'Remodelação completa',
  partial_renovation: 'Remodelação parcial',
  painting: 'Pintura',
  electricity: 'Electricidade',
  plumbing: 'Canalização',
  roof: 'Cobertura',
  kitchen: 'Cozinha',
  bathrooms: 'Casas de banho',
  facade: 'Fachada',
  gardening: 'Jardinagem',
  landscaping: 'Paisagismo',
  decoration: 'Decoração',
  home_staging: 'Home Staging',
};

export const UNFINISHED_LABELS: Record<string, string> = {
  none: 'Não aplicável',
  kuteka_finish: 'Pretendo que a Kuteka conclua a construção',
  budget_only: 'Pretendo orçamento para terminar a obra',
  technical_supervision: 'Pretendo apenas acompanhamento técnico',
  works_evaluation: 'Pretendo apenas avaliação da obra',
};

export const CONSTRUCTION_LABELS: Record<string, string> = {
  complete: 'Construção concluída',
  partial: 'Parcialmente construído',
  not_started: 'Obra não iniciada',
  needs_finish: 'Necessita conclusão',
};

export const CONSERVATION_LABELS: Record<string, string> = {
  excellent: 'Excelente',
  good: 'Bom',
  fair: 'Razoável',
  needs_work: 'Necessita intervenção',
  ruin: 'Em ruína',
  under_construction: 'Em construção',
};

export const LIFECYCLE_LABELS: Record<string, string> = {
  em_preparacao: 'Em preparação',
  em_analise_documental: 'Em análise documental',
  em_inspecao_tecnica: 'Em inspeção técnica',
  em_avaliacao: 'Em avaliação',
  aprovado: 'Aprovado',
  publicado: 'Publicado',
  em_negociacao: 'Em negociação',
  reservado: 'Reservado',
  vendido: 'Vendido',
  arrendado: 'Arrendado',
  em_manutencao: 'Em manutenção',
  temporariamente_indisponivel: 'Temporariamente indisponível',
  arquivado: 'Arquivado',
};

export const PARTNER_CATEGORY_LABELS: Record<string, string> = {
  A: 'A · Proprietário Particular',
  B: 'B · Proprietário Investidor',
  C: 'C · Empresas Proprietárias',
  D: 'D · Promotores Imobiliários',
  E: 'E · Residente no Estrangeiro',
  F: 'F · Gestão Total Kuteka',
  G: 'G · Imóveis em Valorização',
};

export const PARTNER_LIFECYCLE_STAGES = [
  { key: 'descoberta', label: 'Descoberta' },
  { key: 'registo', label: 'Registo' },
  { key: 'verificacao', label: 'Verificação' },
  { key: 'registo_patrimonio', label: 'Registo do património' },
  { key: 'verificacao_tecnica', label: 'Verificação técnica' },
  { key: 'avaliacao', label: 'Avaliação' },
  { key: 'contrato_servicos', label: 'Contrato de serviços' },
  { key: 'publicacao', label: 'Publicação' },
  { key: 'gestao_comercial', label: 'Gestão comercial' },
  { key: 'negociacao', label: 'Negociação' },
  { key: 'formalizacao', label: 'Formalização' },
  { key: 'pos_contrato', label: 'Pós-contrato' },
  { key: 'avaliacao_experiencia', label: 'Avaliação da experiência' },
  { key: 'fidelizacao', label: 'Fidelização' },
  { key: 'reativacao', label: 'Reativação' },
] as const;

export function mapDbLifecycleToStage(db: string | null | undefined): string {
  switch (db) {
    case 'registado':
      return 'registo';
    case 'em_verificacao':
      return 'verificacao';
    case 'verificado':
      return 'verificacao';
    case 'com_imovel_em_avaliacao':
      return 'avaliacao';
    case 'imovel_publicado':
      return 'publicacao';
    case 'em_negociacao':
      return 'negociacao';
    case 'contrato_ativo':
      return 'formalizacao';
    case 'gestao_ativa':
      return 'pos_contrato';
    default:
      return 'registo_patrimonio';
  }
}

export function asHistoryList(
  value: unknown,
): Array<{ at?: string; note?: string; score?: number }> {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is { at?: string; note?: string; score?: number } => {
    return item != null && typeof item === 'object';
  });
}
