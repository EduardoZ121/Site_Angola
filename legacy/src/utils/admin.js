import { isListingPending } from '../constants/staff'
import { AGENT_APPLICATION_STATUS } from '../constants/agentApplication'

export const ADMIN_SECTION_LINKS = [
  { id: 'controlo-site', label: 'Site', icon: 'chart' },
  { id: 'stats', label: 'Resumo', icon: 'chart' },
  { id: 'fila-aprovacao', label: 'Fila', icon: 'clock' },
  { id: 'agentes', label: 'Agentes', icon: 'user' },
  { id: 'utilizadores', label: 'Contas', icon: 'user' },
  { id: 'actividade', label: 'Actividade', icon: 'message' },
  { id: 'moderacao', label: 'Anúncios', icon: 'home' },
]

export const ADMIN_CROSS_LINKS = [
  { to: '/agente', label: 'Painel agente', icon: 'handshake' },
  { to: '/explorar', label: 'Ver catálogo', icon: 'search' },
  { to: '/inicio', label: 'Início', icon: 'home' },
  { to: '/sobre', label: 'Sobre', icon: 'shield' },
]

export function formatStaffDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('pt-PT')
  } catch {
    return String(value)
  }
}

export function computeExtendedAdminStats(listings = [], siteUsers = [], agentApplications = [], approvedAgents = []) {
  const pending = listings.filter((listing) => isListingPending(listing))

  return {
    total: listings.length,
    active: listings.filter((listing) => listing.status === 'Ativo').length,
    pending: pending.length,
    paused: listings.filter((listing) => listing.status === 'Pausado').length,
    rejected: listings.filter((listing) => listing.status === 'Rejeitado').length,
    featured: listings.filter((listing) => listing.featured).length,
    users: siteUsers.length,
    agents: approvedAgents.length,
    agentQueue: agentApplications.filter((item) => item.status !== AGENT_APPLICATION_STATUS.APPROVED).length,
  }
}

export function computeAdminInsights(stats) {
  const items = []

  if (stats.pending > 0) {
    items.push({
      id: 'pending',
      tone: 'warning',
      label: `${stats.pending} anúncio${stats.pending > 1 ? 's' : ''} na fila`,
      detail: 'Rever fotos e aprovar ou rejeitar',
      sectionId: 'fila-aprovacao',
    })
  }

  if (stats.agentQueue > 0) {
    items.push({
      id: 'agents',
      tone: 'info',
      label: `${stats.agentQueue} candidatura${stats.agentQueue > 1 ? 's' : ''} agente`,
      detail: 'Enviar teste ou aprovar intermediários',
      sectionId: 'agentes',
    })
  }

  if (stats.rejected > 0) {
    items.push({
      id: 'rejected',
      tone: 'danger',
      label: `${stats.rejected} rejeitado${stats.rejected > 1 ? 's' : ''}`,
      detail: 'Anúncios recusados na moderação',
      sectionId: 'moderacao',
    })
  }

  return items
}

export function getAdminActivityLink(notification) {
  if (!notification?.listingId) return null
  if (notification.type === 'listing_approved') return `/anuncio/${notification.listingId}`
  if (notification.type === 'listing_pending' || notification.type === 'staff_listing_pending') {
    return `/publicar/enviado/${notification.listingId}`
  }
  if (notification.type === 'listing_rejected') return `/painel/editar/${notification.listingId}`
  return `/anuncio/${notification.listingId}`
}
