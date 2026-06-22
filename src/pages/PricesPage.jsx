import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import { formatKz, zoneAverages } from '../utils/format'
import { PageIntro, SectionBlock } from '../components/SectionBlock'

export default function PricesPage() {
  const { listings, history } = useMarketplace()
  const zones = useMemo(() => zoneAverages(listings), [listings])
  const historyItems = history
    .map((id) => listings.find((listing) => listing.id === id))
    .filter(Boolean)

  return (
    <main className="page-main">
      <PageIntro
        eyebrow="Relatório"
        title="Preços médios por zona"
        subtitle="Equivalente ao relatório de mercado do Daft, adaptado para Angola em Kz."
      />

      <SectionBlock id="medias-zona" eyebrow="Mercado" title="Médias em Kz por bairro">
        <div className="zone-list panel-card">
          {zones.length === 0 ? (
            <p>Ainda não há dados suficientes.</p>
          ) : (
            zones.map((row) => (
              <div key={row.zone} className="zone-row">
                <span>{row.zone}</span>
                <strong>
                  {formatKz(row.avg)} ({row.count} anúncios)
                </strong>
              </div>
            ))
          )}
        </div>
      </SectionBlock>

      <SectionBlock
        id="historico"
        eyebrow="Actividade"
        title="Histórico de visualizações"
        subtitle="Anúncios que visitou recentemente."
        tone="muted"
      >
        <div className="history-panel panel-card">
          {historyItems.length === 0 ? (
            <div className="empty-state">
              <p>Ainda sem histórico.</p>
              <Link className="button primary" to="/comprar">
                Explorar anúncios
              </Link>
            </div>
          ) : (
            <ul className="history-list">
              {historyItems.map((item) => (
                <li key={item.id}>
                  <Link to={`/anuncio/${item.id}`}>
                    {item.title} — {item.neighborhood}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SectionBlock>
    </main>
  )
}
