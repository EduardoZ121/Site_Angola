import { useMemo } from 'react'
import { useMarketplace } from '../context/MarketplaceContext'
import { formatKz, zoneAverages } from '../utils/format'

export default function PricesPage() {
  const { listings, history } = useMarketplace()
  const zones = useMemo(() => zoneAverages(listings), [listings])
  const historyItems = history
    .map((id) => listings.find((listing) => listing.id === id))
    .filter(Boolean)

  return (
    <main className="page-main">
      <section className="page-hero compact">
        <div className="page-hero-inner">
          <p className="eyebrow">Relatório</p>
          <h1>Preços médios por zona</h1>
          <p className="page-subtitle">Equivalente ao relatório de mercado do Daft, adaptado para Angola.</p>
        </div>
      </section>

      <section className="section page-section compare-history-grid">
        <div className="zone-list panel-card">
          <h2>Médias em Kz</h2>
          {zones.map((row) => (
            <div key={row.zone} className="zone-row">
              <span>{row.zone}</span>
              <strong>
                {formatKz(row.avg)} ({row.count} anúncios)
              </strong>
            </div>
          ))}
        </div>

        <div className="history-panel panel-card">
          <h2>Histórico de visualizações</h2>
          {historyItems.length === 0 ? (
            <p>Ainda sem histórico.</p>
          ) : (
            <ul className="history-list">
              {historyItems.map((item) => (
                <li key={item.id}>
                  {item.title} — {item.neighborhood}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}
