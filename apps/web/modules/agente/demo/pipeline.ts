/** Demonstração estática do pipeline Agente (sem agent.operate). */
export const AGENT_DEMO_PIPELINE = {
  assignments: [
    {
      id: 'demo-a1',
      title: 'Moradia T4 Talatona',
      code: 'KTK-DEMO-0001',
      status: 'Em acompanhamento',
      href: '/app/habitacao/detalhe?id=a1111111-1111-4111-8111-111111111001',
    },
    {
      id: 'demo-a2',
      title: 'Apartamento T3 Kilamba',
      code: 'KTK-DEMO-0002',
      status: 'Visita agendada',
      href: '/app/habitacao/detalhe?id=a1111111-1111-4111-8111-111111111002',
    },
    {
      id: 'demo-a3',
      title: 'Penthouse Luanda Sul',
      code: 'KTK-DEMO-0004',
      status: 'Interesse do Cliente',
      href: '/app/habitacao/detalhe?id=a1111111-1111-4111-8111-111111111004',
    },
  ],
  visits: [
    { id: 'v1', when: 'Hoje · 10:00', where: 'Talatona', title: 'Visita Moradia T4' },
    { id: 'v2', when: 'Amanhã · 15:30', where: 'Kilamba', title: 'Revisita T3' },
  ],
  agenda: [
    { id: 'g1', when: 'Quarta · 09:00', title: 'Briefing cobertura Luanda Sul' },
    { id: 'g2', when: 'Quinta · 11:00', title: 'Mediação Vivenda Benguela' },
  ],
  pipeline: [
    { id: 'p1', stage: 'Novos interesses', count: 3 },
    { id: 'p2', stage: 'Em visita', count: 2 },
    { id: 'p3', stage: 'Proposta', count: 1 },
    { id: 'p4', stage: 'Fecho', count: 0 },
  ],
} as const;
