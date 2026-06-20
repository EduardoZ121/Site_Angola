import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { defaultFilters } from '../data/constants'
import { useMarketplace } from '../context/MarketplaceContext'
import { FiltersSidebar } from '../components/FiltersSidebar'
import { ListingCard } from '../components/ListingCard'
import { filterListings } from '../utils/format'

export default function ListingsPage({
  title,
  subtitle,
  defaultCategory = 'Todos',
  defaultOperation = 'Todos',
  showVehicleFilters = false,
}) {
  const [searchParams] = useSearchParams()
  const { listings, favorites, compare, isAdmin, toggleFavorite, toggleCompare } = useMarketplace()
  const [filters, setFilters] = useState({
    ...defaultFilters,
    category: defaultCategory,
    operation: defaultOperation,
    query: searchParams.get('q') || '',
    province: searchParams.get('province') || 'Todos',
  })

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      query: searchParams.get('q') || '',
      province: searchParams.get('province') || 'Todos',
    }))
  }, [searchParams])

  const filtered = useMemo(
    () => filterListings(listings, filters, isAdmin),
    [filters, listings, isAdmin],
  )

  return (
    <main className="page-main">
      <section className="page-hero compact">
        <div className="page-hero-inner">
          <p className="eyebrow">Resultados</p>
          <h1>{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
      </section>

      <section className="section page-section marketplace-layout">
        <FiltersSidebar
          filters={filters}
          setFilters={setFilters}
          showVehicleFilters={showVehicleFilters}
        />

        <div>
          <div className="results-bar">
            <h2>{filtered.length} anúncios encontrados</h2>
            <Link className="text-button" to="/">
              Voltar ao início
            </Link>
          </div>

          <div className="map-panel">
            <h3>Mapa da zona</h3>
            <p>Clique num ponto para abrir o anúncio.</p>
            <div className="map-canvas">
              {filtered.map((listing) => (
                <Link
                  key={`map-${listing.id}`}
                  to={`/anuncio/${listing.id}`}
                  title={listing.title}
                  className="map-point"
                  style={{
                    left: `${(listing.lng || 0.5) * 100}%`,
                    top: `${(listing.lat || 0.5) * 100}%`,
                  }}
                />
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum anúncio encontrado com estes filtros.</p>
              <Link className="button secondary" to="/publicar">
                Publicar anúncio
              </Link>
            </div>
          ) : (
            <div className="listing-grid">
              {filtered.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  favorites={favorites}
                  compareIds={compare}
                  onFavorite={toggleFavorite}
                  onCompare={toggleCompare}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
