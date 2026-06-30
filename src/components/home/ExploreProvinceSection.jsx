import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { provinces } from '../../data/constants'
import { useMarketplace } from '../../context/MarketplaceContext'
import { computeProvinceCounts } from '../../utils/homeStats'
import { HomeIcon } from '../icons/HomeIcon'
import { HelpTip } from '../ui/HelpTip'

export function ExploreProvinceSection() {
  const { listings } = useMarketplace()
  const counts = useMemo(() => computeProvinceCounts(listings), [listings])

  const items = Object.keys(provinces).map((name) => ({
    name,
    count: counts[name] || 0,
    buyLink: `/comprar?province=${encodeURIComponent(name)}`,
    rentLink: `/arrendar?province=${encodeURIComponent(name)}`,
  }))

  return (
    <section className="hp-section hp-section-muted">
      <div className="hp-container">
        <div className="hp-section-head">
          <p className="hp-eyebrow dark">Localização</p>
          <div className="hp-section-title-row">
            <h2>Por província</h2>
            <HelpTip
              label="Ajuda: províncias"
              text="Toque em Comprar ou Arrendar para ver anúncios activos nessa província."
            />
          </div>
          <p className="hp-section-lead">Números actualizados do catálogo Kuteka em Angola.</p>
        </div>
        <div className="hp-explore-province-grid">
          {items.map((item) => (
            <article className="hp-explore-province-card panel-card" key={item.name}>
              <div className="hp-explore-province-head">
                <HomeIcon name="pin" />
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.count} anúncio{item.count === 1 ? '' : 's'} activo{item.count === 1 ? '' : 's'}</span>
                </div>
              </div>
              <div className="hp-explore-province-actions">
                <Link className="button filter-button" to={item.buyLink}>
                  Comprar
                </Link>
                <Link className="button filter-button" to={item.rentLink}>
                  Arrendar
                </Link>
                <Link className="button ghost" to={`/veiculos?province=${encodeURIComponent(item.name)}`}>
                  Veículos
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
