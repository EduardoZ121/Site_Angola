import { useNavigate } from 'react-router-dom'
import { homeQuickSearches } from '../../data/homeContent'

export function QuickSearchSection({ compact = false }) {
  const navigate = useNavigate()

  function openSearch(item) {
    const params = new URLSearchParams()
    Object.entries(item.params).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    const query = params.toString()
    navigate(`${item.path}${query ? `?${query}` : ''}`)
  }

  return (
    <section className={`hp-section hp-quick-search${compact ? ' hp-quick-search-compact' : ''}`}>
      <div className="hp-container">
        {compact ? null : (
          <div className="hp-section-head">
            <p className="hp-eyebrow dark">Popular</p>
            <h2>Pesquisas frequentes</h2>
            <p className="hp-section-lead">Toque num cartão para abrir resultados já filtrados.</p>
          </div>
        )}
        <div className="hp-quick-grid">
          {homeQuickSearches.map((item) => (
            <button
              key={item.label}
              type="button"
              className="hp-quick-chip"
              onClick={() => openSearch(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
