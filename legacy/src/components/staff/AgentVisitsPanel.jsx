import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { VISIT_STATUS, VISIT_STATUS_LABELS, DEFAULT_VISIT_DURATION_MINUTES } from '../../constants/visits'
import { formatKz } from '../../utils/format'
import {
  buildGoogleCalendarUrl,
  buildOwnerVisitMailto,
  downloadVisitIcs,
  formatVisitLocation,
  isVisitUpcoming,
  openGoogleCalendar,
  toDatetimeLocalValue,
} from '../../utils/visits'

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('pt-PT')
  } catch {
    return value
  }
}

function defaultDatetimeLocal() {
  const date = new Date()
  date.setHours(date.getHours() + 24, 0, 0, 0)
  return toDatetimeLocalValue(date.toISOString())
}

export function AgentVisitsPanel({ listings, profile, visits, onSchedule, onCancel, onComplete }) {
  const [listingId, setListingId] = useState('')
  const [scheduledAt, setScheduledAt] = useState(defaultDatetimeLocal)
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(DEFAULT_VISIT_DURATION_MINUTES)
  const [error, setError] = useState('')
  const [lastScheduled, setLastScheduled] = useState(null)

  const visitableListings = useMemo(
    () => listings.filter((item) => item.status === 'Ativo' || item.status === 'Pendente'),
    [listings],
  )

  const selectedListing = visitableListings.find((item) => item.id === listingId)
  const upcoming = visits.filter(isVisitUpcoming).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
  const past = visits.filter((v) => !isVisitUpcoming(v) && v.status !== VISIT_STATUS.CANCELLED)

  function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!listingId) {
      setError('Seleccione um anúncio.')
      return
    }
    if (!scheduledAt) {
      setError('Indique data e hora.')
      return
    }
    const start = new Date(scheduledAt)
    if (Number.isNaN(start.getTime()) || start.getTime() < Date.now() - 5 * 60 * 1000) {
      setError('Escolha uma data e hora futuras.')
      return
    }

    const result = onSchedule({
      listingId,
      scheduledAt: start.toISOString(),
      durationMinutes: Number(durationMinutes) || DEFAULT_VISIT_DURATION_MINUTES,
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim(),
      notes: notes.trim(),
    })

    if (result?.error) {
      setError(result.error)
      return
    }

    if (result?.visit) {
      setLastScheduled({ visit: result.visit, listing: result.listing })
      openGoogleCalendar(result.visit, result.listing)
      setBuyerName('')
      setBuyerPhone('')
      setNotes('')
    }
  }

  return (
    <div className="agent-visits">
      <form className="panel-card agent-visit-form" onSubmit={handleSubmit}>
        <h3>Agendar nova visita</h3>
        <p>O evento abre no Google Calendar do seu telemóvel — confirme com «Guardar». O senhorio recebe notificação.</p>

        <label className="publish-field">
          Anúncio
          <select value={listingId} onChange={(event) => setListingId(event.target.value)} required>
            <option value="">Seleccionar...</option>
            {visitableListings.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} — {item.neighborhood} ({formatKz(item.price)})
              </option>
            ))}
          </select>
        </label>

        {selectedListing ? (
          <p className="agent-visit-owner-preview">
            Senhorio: <strong>{selectedListing.ownerName}</strong> • {selectedListing.phone}
            {selectedListing.ownerEmail ? ` • ${selectedListing.ownerEmail}` : ''}
          </p>
        ) : null}

        <div className="form-row">
          <label className="publish-field">
            Data e hora
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              required
            />
          </label>
          <label className="publish-field">
            Duração (min)
            <input
              type="number"
              min="15"
              step="15"
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
            />
          </label>
        </div>

        <div className="form-row">
          <label className="publish-field">
            Nome do interessado (opcional)
            <input value={buyerName} onChange={(event) => setBuyerName(event.target.value)} placeholder="Comprador / arrendatário" />
          </label>
          <label className="publish-field">
            Telefone interessado
            <input value={buyerPhone} onChange={(event) => setBuyerPhone(event.target.value)} placeholder="+244 9XX XXX XXX" />
          </label>
        </div>

        <label className="publish-field">
          Notas para o agente e senhorio
          <textarea
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Ponto de encontro, documentos a levar..."
          />
        </label>

        {error ? <p className="agent-test-error">{error}</p> : null}

        <button className="button primary" type="submit">
          Agendar e abrir Google Calendar
        </button>
      </form>

      {lastScheduled ? (
        <div className="panel-card agent-visit-success">
          <strong>Visita agendada</strong>
          <p>Senhorio notificado. Google Calendar aberto — toque em «Guardar» no telemóvel.</p>
          <div className="agent-test-invite-actions">
            <button
              type="button"
              className="button primary"
              onClick={() => openGoogleCalendar(lastScheduled.visit, lastScheduled.listing)}
            >
              Abrir Google Calendar
            </button>
            <button
              type="button"
              className="button filter-button"
              onClick={() => downloadVisitIcs(lastScheduled.visit, lastScheduled.listing)}
            >
              Descarregar .ics
            </button>
            {buildOwnerVisitMailto(lastScheduled.visit, lastScheduled.listing) ? (
              <a
                className="button filter-button"
                href={buildOwnerVisitMailto(lastScheduled.visit, lastScheduled.listing)}
              >
                Email ao senhorio
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="agent-visits-list">
        <h3>Próximas visitas ({upcoming.length})</h3>
        {upcoming.length === 0 ? (
          <div className="empty-state panel-card">
            <p>Nenhuma visita agendada.</p>
          </div>
        ) : (
          upcoming.map((visit) => {
            const listing = listings.find((item) => item.id === visit.listingId)
            return (
              <article className="agent-visit-card panel-card" key={visit.id}>
                <div className="agent-visit-card-head">
                  <div>
                    <strong>{visit.listingTitle}</strong>
                    <p>{formatDate(visit.scheduledAt)}</p>
                    <p>{visit.location || formatVisitLocation(listing)}</p>
                    <small>
                      Senhorio: {visit.ownerName}
                      {visit.buyerName ? ` • Interessado: ${visit.buyerName}` : ''}
                    </small>
                  </div>
                  <span className="status-pill status-invited">{VISIT_STATUS_LABELS[visit.status]}</span>
                </div>
                {visit.notes ? <p className="staff-inquiry-msg">{visit.notes}</p> : null}
                <div className="admin-actions">
                  <button type="button" className="button filter-button" onClick={() => openGoogleCalendar(visit, listing)}>
                    Google Calendar
                  </button>
                  <button type="button" className="button filter-button" onClick={() => downloadVisitIcs(visit, listing)}>
                    .ics
                  </button>
                  {listing ? (
                    <Link className="button ghost" to={`/anuncio/${listing.id}`}>
                      Anúncio
                    </Link>
                  ) : null}
                  <button type="button" onClick={() => onComplete(visit.id)}>
                    Concluir
                  </button>
                  <button type="button" className="danger-text" onClick={() => onCancel(visit.id)}>
                    Cancelar
                  </button>
                </div>
              </article>
            )
          })
        )}
      </div>

      {past.length ? (
        <div className="agent-visits-list">
          <h3>Histórico</h3>
          {past.map((visit) => (
            <article className="agent-visit-card panel-card muted" key={visit.id}>
              <strong>{visit.listingTitle}</strong>
              <p>
                {formatDate(visit.scheduledAt)} — {VISIT_STATUS_LABELS[visit.status] || visit.status}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  )
}
