import { useState } from 'react'

export function AdminSiteControl({
  siteSettings,
  apiConnected,
  onUpdateSettings,
  onClearDemo,
  onRestoreDemo,
  onRefreshCatalog,
}) {
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')

  async function run(action, fn) {
    setBusy(action)
    setMessage('')
    try {
      const result = await fn()
      if (result?.deleted != null) {
        setMessage(`${result.deleted} anuncio(s) demo removido(s).`)
      } else if (result?.restored != null) {
        setMessage(result.restored ? `${result.restored} anuncios demo repostos.` : result.message || 'Demo ja existia.')
      } else {
        setMessage('Alteracoes guardadas.')
      }
      await onRefreshCatalog?.()
    } catch {
      setMessage('Nao foi possivel concluir. Confirme login Google com conta admin.')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="admin-site-control panel-card">
      <p className="admin-row-meta">
        {apiConnected
          ? 'Ligado a API de producao — alteracoes afectam o site real.'
          : 'Modo offline — alteracoes so neste browser ate a API estar disponivel.'}
      </p>

      <div className="admin-site-toggles">
        <label className="admin-toggle-row">
          <input
            type="checkbox"
            checked={Boolean(siteSettings?.useRealDataOnly)}
            onChange={(event) =>
              onUpdateSettings({ useRealDataOnly: event.target.checked, showDemoListings: !event.target.checked })
            }
          />
          <span>So dados reais (esconder demo no site publico)</span>
        </label>

        <label className="admin-toggle-row">
          <input
            type="checkbox"
            checked={Boolean(siteSettings?.showTestimonials)}
            onChange={(event) => onUpdateSettings({ showTestimonials: event.target.checked })}
          />
          <span>Mostrar testemunhos de exemplo</span>
        </label>
      </div>

      <div className="admin-actions">
        <button
          type="button"
          className="button ghost danger-text"
          disabled={Boolean(busy)}
          onClick={() => run('clear', onClearDemo)}
        >
          {busy === 'clear' ? 'A remover...' : 'Apagar anuncios demo'}
        </button>
        <button
          type="button"
          className="button secondary"
          disabled={Boolean(busy)}
          onClick={() => run('restore', onRestoreDemo)}
        >
          {busy === 'restore' ? 'A repor...' : 'Repor 3 anuncios demo'}
        </button>
        <button type="button" className="button filter-button" disabled={Boolean(busy)} onClick={() => onRefreshCatalog?.()}>
          Actualizar catalogo
        </button>
      </div>

      {message ? <p className="admin-help-line">{message}</p> : null}

      <p className="admin-row-meta">
        Novos anuncios entram como <strong>Pendente</strong> ate aprovar na fila. Views incrementam quando alguem abre o
        anuncio. Selos Verificado so devem ser activados manualmente apos revisao.
      </p>
    </div>
  )
}