import { isValidAngolaPhone } from './profile'
import { getNotificationTarget } from './ownerDashboard'

export const ACCOUNT_CROSS_LINKS = [
  { to: '/painel', label: 'Painel', icon: 'grid' },
  { to: '/publicar', label: 'Publicar', icon: 'edit' },
  { to: '/favoritos', label: 'Favoritos', icon: 'heart' },
  { to: '/sobre#privacidade', label: 'Privacidade', icon: 'shield' },
]

export const ACCOUNT_SECTION_LINKS = [
  { id: 'mensagens', label: 'Mensagens', icon: 'message' },
  { id: 'meus-anuncios', label: 'Anúncios', icon: 'home' },
  { id: 'dados', label: 'Dados', icon: 'user' },
  { id: 'verificacao', label: 'Verificação', icon: 'shield' },
  { id: 'planos', label: 'Planos', icon: 'tag' },
]

export function computeAccountSummary(profile, notifications = [], listings = []) {
  const unread = notifications.filter((item) => !item.read).length
  const completeness = computeProfileCompleteness(profile)

  return {
    unread,
    listings: listings.length,
    activeListings: listings.filter((item) => item.status === 'Ativo').length,
    completeness,
    trustChecks: [
      profile.verifiedProfile,
      profile.verifiedPhone,
      profile.verifiedDocument,
    ].filter(Boolean).length,
  }
}

export function computeProfileCompleteness(profile) {
  const checks = [
    { id: 'name', label: 'Nome completo', ok: Boolean(profile?.name?.trim()) },
    { id: 'email', label: 'Email', ok: Boolean(profile?.email?.trim()) },
    { id: 'phone', label: 'Telefone angolano', ok: isValidAngolaPhone(profile?.phone) },
    {
      id: 'verify',
      label: 'Verificação activa',
      ok: Boolean(profile?.verifiedProfile || profile?.verifiedPhone),
    },
  ]

  const done = checks.filter((item) => item.ok).length

  return {
    percent: Math.round((done / checks.length) * 100),
    checks,
    missing: checks.filter((item) => !item.ok),
  }
}

export function getAccountNotificationTarget(notification) {
  const type = notification?.type || ''

  if (type === 'visit_scheduled' || type === 'visit_cancelled') {
    return '/conta#visitas'
  }

  if (
    type === 'agent_application_received' ||
    type === 'agent_test_invite' ||
    type === 'agent_approved' ||
    type === 'agent_rejected'
  ) {
    return '/seja-agente'
  }

  return getNotificationTarget(notification)
}

export function getListingAccountLink(listing) {
  if (!listing) return '/painel'
  if (listing.status === 'Ativo') return `/anuncio/${listing.id}`
  if (listing.status === 'Rejeitado') return `/painel/editar/${listing.id}`
  return `/publicar/enviado/${listing.id}`
}
