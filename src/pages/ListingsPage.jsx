import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import { CatalogBreadcrumbs } from '../components/catalog/CatalogBreadcrumbs'
import { CatalogToolbar } from '../components/catalog/CatalogToolbar'
import { FiltersSidebar } from '../components/FiltersSidebar'
import { ListingCard } from '../components/ListingCard'
import { ListingRow } from '../components/ListingRow'
import { ListingSearchBar } from '../components/ListingSearchBar'
import { EmptyState } from '../components/ui/EmptyState'
import { PageIntro } from '../components/SectionBlock'
import { filterListings } from '../utils/format'
import { paginateListings, sortListings } from '../utils/catalog'
import {
  activeFilterCount,
  filterSummary,
  filtersToSearchParams,
  searchParamsToFilters,
} from '../utils/filters'
import '../styles/catalog.css'

export default function ListingsPage({
  title,
  subtitle,
  basePath,
  defaultCategory = 'Todos',
  defaultOperation = 'Todos',
}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { listings, favorites, compare, isAdmin, toggleFavorite, toggleCompare } = useMarketplace()

  const filterDefaults = useMemo(
    () => ({
      category: defaultCategory,
      operation: defaultOperation,
    }),
    [defaultCategory, defaultOperation],
  )

  const filters = useMemo(
    () =>
      searchParamsToFilters(searchParams, {
        category: defaultCategory,
        operation: defaultOperation,
      }),
    [searchParams, defaultCategory, defaultOperation],
  )

  const filtered = useMemo(
    () => sortListings(filterListings(listings, filters, isAdmin), filters.sort),
    [filters, listings, isAdmin],
  )

  const pagination = useMemo(
    () => paginateListings(filtered, filters.page),
    [filtered, filters.page],
  )

  const summary = filterSummary(filters)
  const showVehicleFilters = defaultCategory === 'Veículo'
  const filterCount = activeFilterCount(filters, filterDefaults)

  useEffect(() => {
    document.title = `${title} | Kuteka`
  }, [title])

  useEffect(() => {
    if (!filtersOpen) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [filtersOpen])

  function updateFilters(nextFilters, resetPage = true) {
    const params = filtersToSearchParams({
      ...nextFilters,
      page: resetPage ? '1' : nextFilters.page || '1',
      category: defaultCategory !== 'Todos' ? defaultCategory : nextFilters.category,
      operation: defaultOperation !== 'Todos' ? defaultOperation : nextFilters.operation,
    })
    navigate(`/${basePath}?${params.toString()}`)
  }

  function handleSearch(query) {
    updateFilters({ ...filters, query })
  }

  function goToPage(page) {
    updateFilters({ ...filters, page: String(page) }, false)
    document.getElementById('catalog-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function setFilters(updater) {
    const next = typeof updater === 'function' ? updater(filters) : updater
    updateFilters(next)
  }

  function closeFilters() {
    setFiltersOpen(false)
  }

  return (
    <main className="page-main catalog-page">
      <PageIntro eyebrow="Catálogo" title={title} subtitle={subtitle} />

      <div className="catalog-page-body section-block-inner">
        <CatalogBreadcrumbs
          items={[
            { label: 'Início', to: '/inicio' },
            { label: title, to: `/${basePath}` },
          ]}
        />

        <button
          type="button"
          className="button secondary catalog-filters-toggle"
          onClick={() => setFiltersOpen(true)}
        >
          Filtros
          {filterCount > 0 ? <span className="catalog-filters-badge">{filterCount}</span> : null}
        </button>

        <div
          className={`catalog-filters-backdrop ${filtersOpen ? 'open' : ''}`}
          onClick={closeFilters}
          aria-hidden={!filtersOpen}
        />

        <div className="catalog-layout">
          <div className={`catalog-sidebar-wrap ${filtersOpen ? 'is-open' : ''}`}>
            <div className="catalog-filters-drawer-head">
              <h3>Filtros</h3>
              <button
                type="button"
                className="catalog-filters-close"
                onClick={closeFilters}
                aria-label="Fechar filtros"
              >
                ×
              </button>
            </div>

            <FiltersSidebar
              filters={filters}
              setFilters={setFilters}
              showVehicleFilters={showVehicleFilters}
              showPropertyFilters={!showVehicleFilters}
            />

            <button type="button" className="button primary catalog-filters-apply" onClick={closeFilters}>
              Ver {pagination.total} {pagination.total === 1 ? 'resultado' : 'resultados'}
            </button>
          </div>

          <section className="catalog-main" id="catalog-results">
            <ListingSearchBar
              filters={filters}
              filtersPath={`/${basePath}/filtros`}
              onSearch={handleSearch}
            />
            {summary ? <p className="active-filters-line">Filtros activos: {summary}</p> : null}

            <CatalogToolbar
              total={pagination.total}
              sort={filters.sort}
              view={filters.view}
              mapPath={`/${basePath}/filtros`}
              onSortChange={(sort) => updateFilters({ ...filters, sort })}
              onViewChange={(view) => updateFilters({ ...filters, view }, false)}
            />

            {pagination.items.length === 0 ? (
              <EmptyState
                title="Nenhum resultado encontrado"
                description="Tente alterar os filtros ou pesquisar com outras palavras."
                actionLabel="Limpar filtros"
                actionTo={`/${basePath}`}
              />
            ) : filters.view === 'list' ? (
              <div className="listing-list">
                {pagination.items.map((listing) => (
                  <ListingRow key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="listing-grid">
                {pagination.items.map((listing) => (
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

            {pagination.totalPages > 1 ? (
              <nav className="catalog-pagination" aria-label="Paginação">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => goToPage(pagination.page - 1)}
                >
                  Anterior
                </button>
                <span>
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => goToPage(pagination.page + 1)}
                >
                  Seguinte
                </button>
              </nav>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  )
}
