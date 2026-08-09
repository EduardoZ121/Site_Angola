/**
 * Official Kuteka operating matrix — source of truth for home CTAs, mission copy,
 * and what each experience should prioritize. Permissions remain in RBAC/RLS;
 * this file drives the operational UI (cockpit), not the database.
 */

import type { ExperienceMode } from './role-experience';

export type RoleHomeCta = {
  href: string;
  labelKey:
    | 'workCenter'
    | 'superCommand'
    | 'founderCenter'
    | 'activateProperty'
    | 'myProperties'
    | 'exploreHousing'
    | 'agentArea'
    | 'contracts'
    | 'trust'
    | 'services'
    | 'security'
    | 'kocc'
    | 'moderation'
    | 'escalations';
  primary?: boolean;
};

export type RoleOperatingProfile = {
  mission: string;
  reportsTo: string;
  mustDo: string[];
  mustNot: string[];
  homeCtas: RoleHomeCta[];
  cockpitHint: string;
};

/** PT-AO copy for the operating matrix (UI). Other locales can map later. */
export const ROLE_OPERATING_MATRIX: Record<ExperienceMode, RoleOperatingProfile> = {
  client: {
    mission: 'Encontrar, arrendar ou comprar habitação e contratar serviços Kuteka.',
    reportsTo: 'Agente / Administração (suporte)',
    mustDo: [
      'Procurar e favoritar imóveis',
      'Comentar, perguntar e partilhar',
      'Pedir visitas e celebrar contratos',
      'Avaliar imóvel, Parceiro, Agente e Prestador',
    ],
    mustNot: ['Aprovar publicações', 'Gerir comissões', 'Activar património de terceiros'],
    homeCtas: [
      { href: '/app/habitacao/explorar', labelKey: 'exploreHousing', primary: true },
      { href: '/app/centro-confianca', labelKey: 'trust' },
      { href: '/app/contratos', labelKey: 'contracts' },
      { href: '/app/servicos', labelKey: 'services' },
    ],
    cockpitHint: 'Feed → Favoritos → Visitas → Propostas → Contratos → Residência',
  },
  patrimonial_partner: {
    mission: 'Fornecer e gerir património através da Kuteka.',
    reportsTo: 'Supervisor / Admin (aprovação e operação)',
    mustDo: [
      'Registar e activar património',
      'Documentos, fotos, preço e localização',
      'Responder a pedidos e autorizar visitas',
      'Celebrar contratos e acompanhar receitas',
    ],
    mustNot: ['Aprovar a própria publicação', 'Gerir Admins', 'Alterar comissões da plataforma'],
    homeCtas: [
      { href: '/app/patrimonios/novo', labelKey: 'activateProperty', primary: true },
      { href: '/app/patrimonios', labelKey: 'myProperties' },
      { href: '/app/centro-confianca', labelKey: 'trust' },
      { href: '/app/parceiro/planos', labelKey: 'services' },
    ],
    cockpitHint: 'Patrimónios → Ocupação → Receitas → Contratos → PDK → Saúde',
  },
  client_partner: {
    mission: 'Usar a Kuteka como Cliente e como Parceiro na mesma conta.',
    reportsTo: 'Admin / Supervisor',
    mustDo: ['Explorar habitação', 'Activar património próprio', 'Gerir ambos os fluxos'],
    mustNot: ['Aprovar publicações institucionais', 'Alterar governação'],
    homeCtas: [
      { href: '/app/habitacao/explorar', labelKey: 'exploreHousing', primary: true },
      { href: '/app/patrimonios/novo', labelKey: 'activateProperty' },
      { href: '/app/contratos', labelKey: 'contracts' },
    ],
    cockpitHint: 'Modo integrado Cliente + Parceiro',
  },
  certified_agent: {
    mission: 'Executar operações no terreno — visitas, verificação e acompanhamento.',
    reportsTo: 'Supervisor / Admin',
    mustDo: [
      'Visitar e inspecionar imóveis',
      'Actualizar PDK e relatórios',
      'Acompanhar clientes e follow-up',
      'Reportar irregularidades',
    ],
    mustNot: ['Aprovar publicações', 'Alterar comissões', 'Nomear Admins'],
    homeCtas: [
      { href: '/app/agente', labelKey: 'agentArea', primary: true },
      { href: '/app/habitacao/explorar', labelKey: 'exploreHousing' },
      { href: '/app/contratos', labelKey: 'contracts' },
    ],
    cockpitHint: 'Agenda → Visitas → Imóveis → Clientes → Tarefas → Follow-up → Relatórios',
  },
  service_provider: {
    mission: 'Executar serviços contratados através da Kuteka.',
    reportsTo: 'Admin / Super Admin (operação)',
    mustDo: [
      'Receber pedidos e enviar orçamentos',
      'Aceitar, agendar e executar serviços',
      'Enviar evidências e concluir',
      'Acompanhar pagamento e avaliações',
    ],
    mustNot: ['Aprovar patrimónios', 'Gerir Admins', 'Alterar comissões da plataforma'],
    homeCtas: [
      { href: '/app/servicos', labelKey: 'services', primary: true },
      { href: '/app/financeiro', labelKey: 'contracts' },
      { href: '/app/centro-confianca', labelKey: 'trust' },
    ],
    cockpitHint:
      'Pedido → Orçamento → Aceite → Serviço → Agenda → Evidências → Conclusão → Pagamento → Avaliação',
  },
  supervisor: {
    mission: 'Executar e supervisionar o trabalho operacional diário.',
    reportsTo: 'Administrador',
    mustDo: [
      'Analisar patrimónios em fila',
      'Pendenciar e pedir documentos/visita',
      'Contactar Parceiro e atribuir tarefas',
      'Acompanhar SLA e escalar para Admin',
    ],
    mustNot: [
      'Aprovar ou rejeitar definitivamente',
      'Alterar comissões',
      'Criar Super Admins',
      'Alterar configurações críticas',
    ],
    homeCtas: [
      { href: '/app/admin', labelKey: 'workCenter', primary: true },
      { href: '/app/admin#escalacoes', labelKey: 'escalations' },
      { href: '/app/confianca/revisao', labelKey: 'trust' },
      { href: '/app/admin/utilizadores', labelKey: 'agentArea' },
      { href: '/app/mensagens', labelKey: 'moderation' },
    ],
    cockpitHint: 'Central de Trabalho → SLA → Contactar PP → Atribuir Agente → Escalações',
  },
  administrator: {
    mission: 'Gerir os processos operacionais da Kuteka.',
    reportsTo: 'Super Administrador',
    mustDo: [
      'Aprovar / rejeitar / pendenciar publicações',
      'Atribuir Agentes e acompanhar contratos',
      'Gerir moderação e KYC',
      'Contactar Parceiros',
    ],
    mustNot: [
      'Alterar propriedade institucional do Founder',
      'Alterar comissões sem Super/Founder',
      'Activar património como se fosse Parceiro',
    ],
    homeCtas: [
      { href: '/app/admin', labelKey: 'workCenter', primary: true },
      { href: '/app/admin/utilizadores', labelKey: 'moderation' },
      { href: '/app/confianca/revisao', labelKey: 'trust' },
      { href: '/app/contratos', labelKey: 'contracts' },
    ],
    cockpitHint: 'Central de Trabalho — fila, não dashboard de estatísticas',
  },
  super_administrator: {
    mission: 'Autoridade máxima da operação diária, abaixo do Founder.',
    reportsTo: 'Founder / Owner',
    mustDo: [
      'Supervisionar Admins, Supervisores e Agentes',
      'Gerir fila crítica e moderação',
      'KOCC operacional, fraude, Ledger e KAI',
      'Consultar toda a operação',
    ],
    mustNot: [
      'Activar património como Parceiro Patrimonial',
      'Usar a plataforma como Cliente no cockpit principal',
      'Alterar propriedade institucional do Founder sem Owner',
    ],
    homeCtas: [
      { href: '/app/super', labelKey: 'superCommand', primary: true },
      { href: '/app/admin', labelKey: 'workCenter' },
      { href: '/app/super?tab=kocc', labelKey: 'kocc' },
      { href: '/app/fundador', labelKey: 'founderCenter' },
      { href: '/app/centro-seguranca', labelKey: 'security' },
    ],
    cockpitHint: 'Super / KOCC → Central de Trabalho → Pessoas → Segurança → Auditoria',
  },
  founder: {
    mission: 'Proprietário e autoridade máxima da Kuteka — governação institucional.',
    reportsTo: '— (topo da hierarquia)',
    mustDo: [
      'Gerir Founders / Co-Founders / Super Admins',
      'Feature Flags, KOCC e configurações críticas',
      'Métricas executivas e auditoria global',
      'Supervisionar operação e segurança',
    ],
    mustNot: [
      'Operar como Parceiro Activando património no cockpit Founder',
      'Usar contas demo.* para governação de produção',
    ],
    homeCtas: [
      { href: '/app/fundador', labelKey: 'founderCenter', primary: true },
      { href: '/app/super', labelKey: 'superCommand' },
      { href: '/app/admin', labelKey: 'workCenter' },
      { href: '/app/super?tab=kocc', labelKey: 'kocc' },
      { href: '/app/centro-seguranca', labelKey: 'security' },
    ],
    cockpitHint: 'Empresa → Pessoas → Operação → Financeiro → Segurança → KOCC → Auditoria',
  },
};

export const ROLE_HOME_CTA_LABELS_PT: Record<RoleHomeCta['labelKey'], string> = {
  workCenter: 'Central de Trabalho',
  superCommand: 'Centro de Comando Super',
  founderCenter: 'Founder / Gestão Institucional',
  activateProperty: 'Activar património',
  myProperties: 'Os meus patrimónios',
  exploreHousing: 'Explorar habitação',
  agentArea: 'Área do Agente',
  contracts: 'Contratos',
  trust: 'Confiança / KYC',
  services: 'Serviços / Planos',
  security: 'Centro de Segurança',
  kocc: 'KOCC operacional',
  moderation: 'Utilizadores / Moderação',
  escalations: 'Escalações',
};

export function operatingProfileFor(mode: ExperienceMode): RoleOperatingProfile {
  return ROLE_OPERATING_MATRIX[mode];
}
