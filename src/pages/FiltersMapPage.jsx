import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { defaultFilters } from '../data/constants'
import { useMarketplace } from '../context/MarketplaceContext'
import { FiltersSidebar } from '../components/FiltersSidebar'
import { PageIntro, SectionBlock } from '../components/SectionBlock'
import { filterListings } from '../utils/format'
import { filtersToSearchParams, searchParamsToFilters } from '../utils/filters'

export default function FiltersMapPage({
  title,
  subtitle,
  basePath,
  defaultCategory = 'Todos',
  defaultOperation = 'Todos',
  showVehicleFilters = false,
}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { listings, isAdmin } = useMarketplace()
  const [filters, setFilters] = useState(() =>
    searchParamsToFilters(searchParams, {
      category: defaultCategory,
      operation: defaultOperation,
    }),
  )

  const preview = useMemo(
    () => filterListings(listings, filters, isAdmin),
    [filters, listings, isAdmin],
  )

  function applyLocationFromListing(listing) {
    setFilters((current) => ({
      ...current,
      province: listing.province,
      municipality: listing.municipality,
      neighborhood: listing.neighborhood,
    }))
  }

  function handleConfirm() {
    const params = filtersToSearchParams({
      ...filters,
      category: defaultCategory !== 'Todos' ? defaultCategory : filters.category,
      operation: defaultOperation !== 'Todos' ? defaultOperation : filters.operation,
    })
    navigate(`/${basePath}?${params.toString()}`)
  }

  function handleReset() {
    setFilters({
      ...defaultFilters,
      category: defaultCategory,
      operation: defaultOperation,
    })
  }

  return (
    <main className="page-main">
      <PageIntro
        eyebrow="Pesquisa avançada"
        title={title}
        subtitle={subtitle || 'Escolha zona no mapa, ajuste filtros e confirme para ver resultados.'}
      />

      <SectionBlock
        id="filtros-mapa"
        eyebrow="Localização"
        title="Filtros e mapa"
        subtitle="Clique num ponto do mapa para seleccionar a zona. Depois confirme."
        tone="muted"
      >
        <div className="marketplace-layout filters-map-layout">
          <FiltersSidebar
            filters={filters}
            setFilters={setFilters}
            showVehicleFilters={showVehicleFilters}
            hideQuery
          />
          <div className="map-panel">
            <h3>Mapa da zona</h3>
            <p>Clique num ponto para definir província, município e bairro.</p>
            <div className="map-canvas map-canvas-large">
              {preview.map((listing) => (
                <button
                  key={`map-${listing.id}`}
                  type="button"
                  title={`${listing.title} — ${listing.neighborhood}`}
                  className={`map-point ${filters.neighborhood === listing.neighborhood ? 'selected' : ''}`}
                  style={{
                    left: `${(listing.lng || 0.5) * 100}%`,
                    top: `${(listing.lat || 0.5) * 100}%`,
                  }}
                  onClick={() => applyLocationFromListing(listing)}
                />
              ))}
            </div>
            <p className="map-selection">
              Selecção: {filters.province} / {filters.municipality} / {filters.neighborhood}
            </p>
            <p className="map-preview-count">{preview.length} anúncios com estes filtros</p>
          </div>
        </div>

        <div className="filters-map-actions">
          <Link className="text-button" to={`/${basePath}`}>
            Cancelar
          </Link>
          <button className="text-button" type="button" onClick={handleReset}>
            Limpar filtros
          </button>
          <button className="button primary" type="button" onClick={handleConfirm}>
            Confirmar filtros
          </button>
        </div>
      </SectionBlock>
    </main>
  )
}
