export const homeQuickSearches = [
  { label: 'Casas em Talatona', path: '/arrendar', params: { municipality: 'Talatona', query: 'casa' } },
  { label: 'Apartamentos no Kilamba', path: '/arrendar', params: { municipality: 'Kilamba Kiaxi', query: 'apartamento' } },
  { label: 'Casas em Benguela', path: '/comprar', params: { province: 'Benguela' } },
  { label: 'Terrenos', path: '/comprar', params: { query: 'terreno' } },
  { label: 'Toyota Prado', path: '/veiculos', params: { query: 'Prado' } },
  { label: 'Hilux', path: '/veiculos', params: { query: 'Hilux' } },
  { label: 'Kia Sportage', path: '/veiculos', params: { query: 'Sportage' } },
]

export const homeCategories = [
  {
    to: '/comprar',
    image:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    title: 'Comprar imóveis',
    description: 'Casas, apartamentos, terrenos e lojas para venda em Angola.',
    countLabel: '120+ anúncios',
  },
  {
    to: '/arrendar',
    image:
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
    title: 'Arrendar imóveis',
    description: 'Arrendamentos mensais em Kz com contacto directo ao senhorio.',
    countLabel: '85+ anúncios',
  },
  {
    to: '/veiculos',
    image:
      'https://images.unsplash.com/photo-1494976388531-d105849445c3?auto=format&fit=crop&w=800&q=80',
    title: 'Veículos',
    description: 'Carros e pickups com filtros por marca, modelo e preço.',
    countLabel: '60+ anúncios',
  },
  {
    to: '/comprar?query=terreno',
    image:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
    title: 'Terrenos',
    description: 'Lotes urbanos e rurais para construir ou investir.',
    countLabel: '40+ anúncios',
  },
  {
    to: '/comprar?query=loja',
    image:
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
    title: 'Lojas',
    description: 'Espaços comerciais em zonas de grande movimento.',
    countLabel: '25+ anúncios',
  },
  {
    to: '/comprar?query=escritório',
    image:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    title: 'Escritórios',
    description: 'Salas e escritórios para empresas e profissionais.',
    countLabel: '18+ anúncios',
  },
]

export const homeBenefits = [
  {
    icon: 'check',
    title: 'Anúncios verificados',
    description: 'Equipa Kuteka revê fotos e dados antes de publicar.',
  },
  {
    icon: 'bolt',
    title: 'Pesquisa rápida',
    description: 'Filtros por província, município e preço em segundos.',
  },
  {
    icon: 'phone',
    title: 'Contacto directo',
    description: 'Telefone, WhatsApp e mensagens com o anunciante.',
  },
  {
    icon: 'shield',
    title: 'Segurança',
    description: 'Selos de confiança para proprietários e imóveis.',
  },
  {
    icon: 'refresh',
    title: 'Atualizações constantes',
    description: 'Novos anúncios adicionados todos os dias.',
  },
  {
    icon: 'mobile',
    title: 'Experiência móvel',
    description: 'Optimizado para telemóvel — o principal em Angola.',
  },
]

export const homeSteps = [
  { icon: 'search', title: 'Pesquise', description: 'Use filtros por zona, tipo e preço em Kz.' },
  { icon: 'message', title: 'Contacte', description: 'Fale com o proprietário por chat ou WhatsApp.' },
  { icon: 'handshake', title: 'Feche negócio', description: 'Combine visita e finalize com confiança.' },
]

export const homeOwnerSteps = [
  { icon: 'edit', title: 'Publique', description: 'Crie o anúncio com fotos, preço e localização.' },
  { icon: 'phone', title: 'Receba contactos', description: 'Interessados ligam, enviam mensagem ou WhatsApp.' },
  { icon: 'check', title: 'Arrende ou venda', description: 'Feche o negócio directamente com o comprador.' },
]

export const homeStats = [
  { value: 1800, suffix: '+', label: 'Imóveis publicados' },
  { value: 420, suffix: '+', label: 'Veículos' },
  { value: 800, suffix: '+', label: 'Utilizadores' },
  { value: 18, suffix: '', label: 'Províncias' },
  { value: 45, suffix: '+', label: 'Agentes certificados' },
]

export const homeTestimonials = [
  {
    name: 'Maria Santos',
    role: 'Compradora em Luanda',
    rating: 5,
    text: 'Encontrei apartamento no Talatona em poucos dias. Processo simples e directo.',
  },
  {
    name: 'João Manuel',
    role: 'Proprietário',
    rating: 5,
    text: 'Publiquei a minha vivenda e recebi contactos no mesmo dia. Recomendo.',
  },
  {
    name: 'Ana Ferreira',
    role: 'Agente imobiliário',
    rating: 4,
    text: 'Plataforma clara para Angola. Os meus clientes encontram imóveis rapidamente.',
  },
]
