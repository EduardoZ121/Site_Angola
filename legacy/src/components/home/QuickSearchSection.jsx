import { useNavigate } from 'react-router-dom'
import { homeQuickSearches } from '../../data/homeContent'
import { HelpTip } from '../ui/HelpTip'

export function QuickSearchSection({ compact = false, showHead = false }) {
  const navigate = useNavigate()
  const displayHead = showHead || !compact

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
        {displayHead ? (
          <div className="hp-section-head">
            <p className="hp-eyebrow dark">Popular</p>
            <div className="hp-section-title-row">
              <h2>Pesquisas frequentes</h2>
              <HelpTip
                label="Ajuda: pesquisas frequentes"
                text="Atalhos com filtros já aplicados — abre o catálogo directamente."
              />
            </div>
            <p className="hp-section-lead">Toque num cartão para abrir resultados já filtrados.</p>
          </div>
        ) : null}
        <div className="hp-quick-grid">
          {homeQuickSearches.map((item) => (
            <button
              key={item.label}
              type="button"
              className="hp-quick-chip"
              onClick={() => openSearch(item)}
            >
              <span className="hp-quick-chip-label">{item.label}</span>
              <span className="hp-quick-chip-path">
                {item.path.replace('/', '')}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
