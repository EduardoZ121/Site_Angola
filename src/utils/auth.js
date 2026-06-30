export const AUTH_FEATURES = [
  {
    icon: 'search',
    title: 'Explorar anúncios',
    text: 'Casas, terrenos e veículos com preços em Kwanza.',
  },
  {
    icon: 'heart',
    title: 'Favoritos e comparar',
    text: 'Guarde anúncios e compare antes de contactar.',
  },
  {
    icon: 'home',
    title: 'Publicar e gerir',
    text: 'Proprietários recebem contactos no painel Kuteka.',
  },
]

export const AUTH_CROSS_LINKS = [
  { to: '/como-funciona', label: 'Como funciona', icon: 'handshake' },
  { to: '/sobre', label: 'Sobre o Kuteka', icon: 'user' },
  { to: '/explorar', label: 'Explorar sem conta', icon: 'search' },
]

const REDIRECT_LABELS = {
  '/inicio': 'Início',
  '/explorar': 'Explorar',
  '/favoritos': 'Favoritos',
  '/comparar': 'Comparar',
  '/destaques': 'Destaques',
  '/painel': 'Painel',
  '/conta': 'Conta',
  '/publicar': 'Publicar anúncio',
  '/procurar': 'Procurar',
  '/comprar': 'Comprar',
  '/arrendar': 'Arrendar',
  '/veiculos': 'Veículos',
  '/precos': 'Preços',
  '/como-funciona': 'Como funciona',
  '/sobre': 'Sobre',
  '/agente': 'Área do agente',
  '/agente/candidatura': 'Candidatura agente',
}

export function safeRedirectPath(value) {
  if (!value) return null
  try {
    const decoded = decodeURIComponent(value)
    if (decoded.startsWith('/') && !decoded.startsWith('//')) return decoded
  } catch {
    return null
  }
  return null
}

export function getRedirectLabel(path) {
  if (!path) return null

  const base = path.split('?')[0].split('#')[0]
  if (REDIRECT_LABELS[base]) return REDIRECT_LABELS[base]
  if (base.startsWith('/anuncio/')) return 'Detalhe do anúncio'
  if (base.startsWith('/comprar')) return 'Comprar'
  if (base.startsWith('/arrendar')) return 'Arrendar'
  if (base.startsWith('/veiculos')) return 'Veículos'
  if (base.startsWith('/painel/')) return 'Painel'
  if (base.startsWith('/conta')) return 'Conta'
  if (base.startsWith('/publicar')) return 'Publicar'
  return 'página anterior'
}
