import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { defaultFilters } from '../data/constants'
import { useMarketplace } from '../context/MarketplaceContext'
import { FiltersSidebar } from '../components/FiltersSidebar'
import { ListingCard } from '../components/ListingCard'
import { PageIntro, SectionBlock } from '../components/SectionBlock'
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
      <PageIntro eyebrow="Resultados" title={title} subtitle={subtitle} />

      <SectionBlock
        id="filtros"
        eyebrow="Pesquisa"
        title="Filtros e mapa"
        subtitle="Ajuste a localização e o preço nesta secção."
        tone="muted"
      >
        <div className="marketplace-layout">
          <FiltersSidebar
            filters={filters}
            setFilters={setFilters}
            showVehicleFilters={showVehicleFilters}
          />
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
        </div>
      </SectionBlock>

      <SectionBlock
        id="resultados"
        eyebrow="Anúncios"
        title={`${filtered.length} resultados encontrados`}
        action={
          <Link className="text-button" to="/">
            Voltar ao início
          </Link>
        }
      >
        {filtered.length === 0 ? (
          <div className="empty-state panel-card">
            <p>Nenhum anúncio encontrado com estes filtros.</p>
            <Link className="button primary" to="/publicar">
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
      </SectionBlock>
    </main>
  )
}
