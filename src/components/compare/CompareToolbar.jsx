import { Link } from 'react-router-dom'

export function CompareToolbar({ total, onClearAll, addLink }) {
  if (!total) return null

  return (
    <div className="compare-toolbar panel-card">
      <p className="compare-toolbar-count">
        <strong>{total}</strong> {total === 1 ? 'anúncio' : 'anúncios'} na comparação
      </p>
      <div className="compare-toolbar-actions">
        {total < 3 ? (
          <Link className="text-button" to={addLink}>
            Adicionar mais
          </Link>
        ) : null}
        <button type="button" className="text-button compare-clear-btn" onClick={onClearAll}>
          Limpar comparação
        </button>
      </div>
    </div>
  )
}
