/** Planos Kuteka — espelho do backend (preços em Kz). */
export const PAYMENT_PROVIDER = {
  id: 'pending_kz',
  label: 'Pagamento em Kwanza',
  status: 'coming_soon',
  note: 'Multicaixa Express, referência bancária ou gateway local — a definir.',
}

export const AGENT_BOUNTY_KZ = {
  perApprovedListing: 10000,
  label: 'Bounty por anúncio aprovado',
  description: 'Agente recebe quando o anúncio que trouxe é aprovado pela moderação.',
}

export const OWNER_PLANS = [
  {
    id: 'free',
    name: 'Grátis',
    priceKz: 0,
    durationDays: 0,
    maxListings: 1,
    featured: false,
    highlights: ['1 anúncio activo', 'Moderação incluída', 'Contacto directo comprador'],
  },
  {
    id: 'destaque-7',
    name: 'Destaque 7 dias',
    priceKz: 25000,
    durationDays: 7,
    maxListings: null,
    featured: true,
    highlights: ['Topo do catálogo', 'Página /destaques', '7 dias de visibilidade'],
  },
  {
    id: 'destaque-30',
    name: 'Destaque 30 dias',
    priceKz: 75000,
    durationDays: 30,
    maxListings: null,
    featured: true,
    highlights: ['Máxima visibilidade', 'Renovação manual', 'Ideal para venda rápida'],
    popular: true,
  },
  {
    id: 'pacote-pro',
    name: 'Pacote Proprietário',
    priceKz: 150000,
    durationDays: 30,
    maxListings: 5,
    featured: true,
    featuredSlots: 1,
    highlights: ['Até 5 anúncios', '1 destaque incluído', 'Estatísticas no painel'],
  },
]

export function formatPlanPriceKz(amount) {
  if (!amount) return 'Grátis'
  return `${amount.toLocaleString('pt-AO')} Kz`
}
