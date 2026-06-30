import { isVisitUpcoming } from './visits'
import { formatStaffDate } from './admin'

export { formatStaffDate }

export const AGENT_SECTION_LINKS = [
  { id: 'resumo', label: 'Resumo', icon: 'chart' },
  { id: 'fila', label: 'Fila', icon: 'clock' },
  { id: 'mensagens', label: 'Mensagens', icon: 'message' },
  { id: 'visitas', label: 'Visitas', icon: 'pin' },
  { id: 'alertas', label: 'Alertas', icon: 'bolt' },
]

export const AGENT_CROSS_LINKS = [
  { to: '/explorar', label: 'Catálogo', icon: 'search' },
  { to: '/admin', label: 'Admin', icon: 'shield' },
  { to: '/conta', label: 'Conta', icon: 'user' },
  { to: '/seja-agente', label: 'Candidatura', icon: 'handshake' },
]

export const AGENT_APPLY_CROSS_LINKS = [
  { to: '/como-funciona', label: 'Como funciona', icon: 'handshake' },
  { to: '/conta', label: 'Minha conta', icon: 'user' },
  { to: '/explorar', label: 'Explorar', icon: 'search' },
  { to: '/sobre', label: 'Sobre', icon: 'shield' },
]

export function computeAgentStats(pendingListings = [], inquiryThreads = [], visits = [], staffAlerts = []) {
  const upcomingVisits = visits.filter(isVisitUpcoming)

  return {
    pending: pendingListings.length,
    messages: inquiryThreads.length,
    visitsUpcoming: upcomingVisits.length,
    visitsTotal: visits.length,
    alerts: staffAlerts.length,
    unreadAlerts: staffAlerts.filter((item) => !item.read).length,
  }
}

export function computeAgentInsights(stats) {
  const items = []

  if (stats.pending > 0) {
    items.push({
      id: 'pending',
      tone: 'warning',
      label: `${stats.pending} anúncio${stats.pending > 1 ? 's' : ''} na fila`,
      detail: 'Aprovar ou rejeitar antes de publicar',
      sectionId: 'fila',
    })
  }

  if (stats.messages > 0) {
    items.push({
      id: 'messages',
      tone: 'info',
      label: `${stats.messages} conversa${stats.messages > 1 ? 's' : ''} activa${stats.messages > 1 ? 's' : ''}`,
      detail: 'Responder compradores por telefone',
      sectionId: 'mensagens',
    })
  }

  if (stats.visitsUpcoming > 0) {
    items.push({
      id: 'visits',
      tone: 'muted',
      label: `${stats.visitsUpcoming} visita${stats.visitsUpcoming > 1 ? 's' : ''} agendada${stats.visitsUpcoming > 1 ? 's' : ''}`,
      detail: 'Confirmar no Google Calendar',
      sectionId: 'visitas',
    })
  }

  return items
}

export function getAgentAlertLink(notification) {
  if (!notification) return null

  const type = notification.type || ''

  if (type === 'staff_listing_pending' || type === 'listing_pending') {
    return '#fila'
  }

  if (type === 'staff_visit_scheduled' || type === 'visit_scheduled') {
    return '#visitas'
  }

  if (notification.listingId) {
    return `/anuncio/${notification.listingId}`
  }

  return '#alertas'
}
