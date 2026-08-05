export function getFinanceCopy() {
  return {
    superTitle: 'Super Admin — Centro de Comando',
    superSubtitle:
      'Motor financeiro Kuteka: receita, preços, ledger, créditos, gateways e auditoria. Fase 1 sem custódia de fundos.',
    eyebrow: 'Revenue Command Center',
    forbidden: 'Apenas Super Administrador (finance.manage) acede a este painel.',
    loadError: 'Não foi possível carregar o centro financeiro.',
    sections: {
      revenue: 'Receita',
      products: 'Catálogo',
      prices: 'Preços',
      ledger: 'Ledger',
      commissions: 'Comissões',
      gateways: 'Kuteka Pay / Gateways',
      invoices: 'Faturação',
      sandbox: 'Sandbox Pay',
      credits: 'Kuteka Credits',
      health: 'Service Health',
    },
    metrics: {
      captured: 'Cobranças capturadas',
      pending: 'Pendentes',
      commissions: 'Comissões',
      credits: 'Créditos concedidos',
      intents: 'Payment intents',
      invoices: 'Faturas',
      products: 'Produtos activos',
      gateways: 'Gateways sandbox',
    },
    custodyNote: 'Modo de custódia: none (sem escrow). O dinheiro não fica na Kuteka.',
    sandboxHint: 'Ambiente de teste — sem dinheiro real até activar Multicaixa/EMIS/Stripe.',
    quote: 'Cotar',
    pay: 'Criar pagamento sandbox',
    capture: 'Simular captura',
    savePrice: 'Actualizar preço',
    grantCredits: 'Conceder créditos',
  } as const;
}
