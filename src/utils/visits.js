import { DEFAULT_VISIT_DURATION_MINUTES } from '../constants/visits'

export function createVisitId() {
  return `visit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function formatVisitLocation(listing) {
  if (!listing) return ''
  return [listing.neighborhood, listing.municipality, listing.province].filter(Boolean).join(', ')
}

function toCalendarUtc(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export function getVisitEndDate(startIso, durationMinutes = DEFAULT_VISIT_DURATION_MINUTES) {
  const start = new Date(startIso)
  return new Date(start.getTime() + durationMinutes * 60 * 1000)
}

export function buildVisitCalendarTitle(visit, listing) {
  return `Visita Kuteka — ${listing?.title || visit.listingTitle || 'Anúncio'}`
}

export function buildVisitCalendarDetails(visit, listing) {
  const lines = [
    'Visita agendada pela equipa Kuteka.',
    '',
    `Anúncio: ${listing?.title || visit.listingTitle}`,
    `Senhorio: ${visit.ownerName} (${visit.ownerPhone || '—'})`,
    visit.buyerName ? `Interessado: ${visit.buyerName}${visit.buyerPhone ? ` (${visit.buyerPhone})` : ''}` : null,
    visit.notes ? `Notas: ${visit.notes}` : null,
    '',
    `Agente: ${visit.agentName}`,
  ].filter(Boolean)
  return lines.join('\n')
}

/** Abre Google Calendar no telemóvel Android / browser — utilizador confirma com «Guardar». */
export function buildGoogleCalendarUrl(visit, listing) {
  const start = new Date(visit.scheduledAt)
  const end = getVisitEndDate(visit.scheduledAt, visit.durationMinutes)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: buildVisitCalendarTitle(visit, listing),
    dates: `${toCalendarUtc(start)}/${toCalendarUtc(end)}`,
    details: buildVisitCalendarDetails(visit, listing),
    location: visit.location || formatVisitLocation(listing),
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function buildVisitIcsContent(visit, listing) {
  const start = new Date(visit.scheduledAt)
  const end = getVisitEndDate(visit.scheduledAt, visit.durationMinutes)
  const uid = `${visit.id}@kuteka.ao`
  const title = buildVisitCalendarTitle(visit, listing).replace(/[,;\\]/g, '')
  const details = buildVisitCalendarDetails(visit, listing).replace(/\n/g, '\\n')
  const location = (visit.location || formatVisitLocation(listing)).replace(/[,;\\]/g, '')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kuteka//Visitas//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toCalendarUtc(new Date())}`,
    `DTSTART:${toCalendarUtc(start)}`,
    `DTEND:${toCalendarUtc(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${details}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadVisitIcs(visit, listing) {
  const content = buildVisitIcsContent(visit, listing)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `kuteka-visita-${visit.id}.ics`
  link.click()
  URL.revokeObjectURL(url)
}

export function openGoogleCalendar(visit, listing) {
  const url = buildGoogleCalendarUrl(visit, listing)
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function buildOwnerVisitMailto(visit, listing) {
  const when = new Date(visit.scheduledAt).toLocaleString('pt-PT')
  const subject = encodeURIComponent(`Visita agendada — ${listing?.title || visit.listingTitle}`)
  const body = encodeURIComponent(
    `Olá ${visit.ownerName},\n\n` +
      `Foi agendada uma visita ao seu anúncio na Kuteka.\n\n` +
      `Data e hora: ${when}\n` +
      `Local: ${visit.location || formatVisitLocation(listing)}\n` +
      `Anúncio: ${listing?.title || visit.listingTitle}\n` +
      (visit.buyerName ? `Interessado: ${visit.buyerName}\n` : '') +
      (visit.notes ? `\nNotas: ${visit.notes}\n` : '') +
      `\nAgente Kuteka: ${visit.agentName}\n` +
      `Telefone agente: ${visit.agentPhone || '—'}\n\n` +
      `Equipa Kuteka`,
  )
  const email = visit.ownerEmail || ''
  return email ? `mailto:${email}?subject=${subject}&body=${body}` : ''
}

export function isVisitUpcoming(visit) {
  if (visit.status !== 'scheduled') return false
  return new Date(visit.scheduledAt).getTime() >= Date.now() - 30 * 60 * 1000
}

export function toDatetimeLocalValue(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
