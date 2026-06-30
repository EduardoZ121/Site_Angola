import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useMarketplace } from '../../context/MarketplaceContext'
import { computeHomeMarketStats } from '../../utils/homeStats'
import { HomeIcon } from '../icons/HomeIcon'

const CATALOG_ITEMS = [
  {
    to: '/comprar',
    filtersTo: '/comprar/filtros',
    icon: 'home',
    title: 'Comprar imóveis',
    description: 'Casas, apartamentos, terrenos e lojas à venda.',
    statKey: 'forSale',
  },
  {
    to: '/arrendar',
    filtersTo: '/arrendar/filtros',
    icon: 'building',
    title: 'Arrendar imóveis',
    description: 'Arrendamentos mensais em Kz com contacto directo.',
    statKey: 'forRent',
  },
  {
    to: '/veiculos',
    filtersTo: '/veiculos/filtros',
    icon: 'car',
    title: 'Veículos',
    description: 'Carros e pickups — filtros por marca e preço.',
    statKey: 'vehicles',
  },
]

export function ExploreCatalogSection() {
  const { listings } = useMarketplace()
  const stats = useMemo(() => computeHomeMarketStats(listings), [listings])

  return (
    <section className="hp-section">
      <div className="hp-container">
        <div className="hp-section-head">
          <p className="hp-eyebrow dark">Catálogo</p>
          <h2>Escolha o tipo de pesquisa</h2>
          <p className="hp-section-lead">Cada secção abre resultados filtrados — ou use filtros avançados com mapa.</p>
        </div>
        <div className="hp-explore-catalog-grid">
          {CATALOG_ITEMS.map((item) => (
            <article className="hp-explore-catalog-card panel-card" key={item.to}>
              <span className="hp-explore-catalog-icon" aria-hidden="true">
                <HomeIcon name={item.icon} />
              </span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <strong>{stats[item.statKey] || 0} activos</strong>
              </div>
              <div className="hp-explore-catalog-actions">
                <Link className="hp-btn hp-btn-primary" to={item.to}>
                  Ver anúncios
                </Link>
                <Link className="hp-btn hp-btn-secondary hp-btn-on-light" to={item.filtersTo}>
                  Filtros e mapa
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
