import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import { CatalogActiveFilters } from '../components/catalog/CatalogActiveFilters'
import { CatalogBreadcrumbs } from '../components/catalog/CatalogBreadcrumbs'
import { CatalogCrossNav } from '../components/catalog/CatalogCrossNav'
import { CatalogFeaturedStrip } from '../components/catalog/CatalogFeaturedStrip'
import { CatalogInsightsBar } from '../components/catalog/CatalogInsightsBar'
import { CatalogPagination } from '../components/catalog/CatalogPagination'
import { CatalogToolbar } from '../components/catalog/CatalogToolbar'
import { PropertyTypeGrid } from '../components/catalog/PropertyTypeGrid'
import { FiltersSidebar } from '../components/FiltersSidebar'
import { ListingCard } from '../components/ListingCard'
import { ListingRow } from '../components/ListingRow'
import { ListingSearchBar } from '../components/ListingSearchBar'
import { HomeIcon } from '../components/icons/HomeIcon'
import { EmptyState } from '../components/ui/EmptyState'
import { HelpTip } from '../components/ui/HelpTip'
import { PageIntro } from '../components/SectionBlock'
import { filterListings } from '../utils/format'
import { paginateListings, sortListings } from '../utils/catalog'
import { getCatalogSection, isCatalogSection } from '../utils/catalogConfig'
import { computeCatalogPriceInsight, countCatalogByPropertyType } from '../utils/catalogStats'
import { countVehicleBySegment } from '../utils/vehicleCatalog'
import {
  activeFilterCount,
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
  propertyTypes = null,
  showFeatured = false,
  featuredTitle = 'Destaques',
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

  const featuredListings = useMemo(() => {
    if (!showFeatured) return []
    return listings
      .filter(
        (item) =>
          item.status === 'Ativo' &&
          item.featured &&
          (defaultOperation === 'Todos' || item.operation === defaultOperation) &&
          (defaultCategory === 'Todos' || item.category === defaultCategory),
      )
      .slice(0, 8)
  }, [listings, showFeatured, defaultOperation, defaultCategory])

  const filtersForTypeCounts = useMemo(
    () => ({ ...filters, propertyType: 'Todos' }),
    [filters],
  )

  const listingsForTypeCounts = useMemo(
    () => filterListings(listings, filtersForTypeCounts, isAdmin),
    [listings, filtersForTypeCounts, isAdmin],
  )

  const propertyTypeCounts = useMemo(() => {
    if (defaultCategory === 'Veículo') {
      return countVehicleBySegment(listingsForTypeCounts)
    }
    return countCatalogByPropertyType(listingsForTypeCounts, {
      operation: defaultOperation,
      category: defaultCategory,
    })
  }, [listingsForTypeCounts, defaultOperation, defaultCategory])

  const priceInsight = useMemo(
    () => (isCatalogSection(basePath) ? computeCatalogPriceInsight(filtered) : null),
    [filtered, basePath],
  )

  const sectionConfig = getCatalogSection(basePath)
  const showVehicleFilters = defaultCategory === 'Veículo'
  const filterCount = activeFilterCount(filters, filterDefaults)
  const gridSize = filters.gridSize || 'md'
  const mapPath = `/${basePath}/filtros?${filtersToSearchParams(filters).toString()}`

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

  function selectPropertyType(propertyType) {
    updateFilters({ ...filters, propertyType, page: '1' })
    window.setTimeout(() => {
      document.getElementById('catalog-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  function closeFilters() {
    setFiltersOpen(false)
  }

  function applyFilters() {
    closeFilters()
    document.getElementById('catalog-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

        <CatalogCrossNav basePath={basePath} />

        {showFeatured ? (
          <CatalogFeaturedStrip listings={featuredListings} title={featuredTitle} />
        ) : null}

        {propertyTypes ? (
          <div className="catalog-type-section">
            <h2 className="catalog-type-heading">
              {sectionConfig?.typeHeading || 'Escolha o tipo'}
              <HelpTip
                label={`Ajuda: ${sectionConfig?.typeGridLabel || 'tipos'}`}
                text={
                  sectionConfig?.typeHelp ||
                  'Números actualizados com base nos filtros de localização e preço activos.'
                }
              />
            </h2>
            <PropertyTypeGrid
              types={propertyTypes}
              activeType={filters.propertyType}
              onSelect={selectPropertyType}
              counts={propertyTypeCounts}
              ariaLabel={sectionConfig?.typeGridLabel || 'Tipo de imóvel'}
            />
          </div>
        ) : null}

        <div className="catalog-toolbar-mobile">
          <button
            type="button"
            className="catalog-filters-toggle"
            onClick={() => setFiltersOpen(true)}
          >
            <HomeIcon name="filter" />
            <span>Filtros</span>
            {filterCount > 0 ? <span className="catalog-filters-badge">{filterCount}</span> : null}
          </button>
        </div>

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

            <button type="button" className="button primary catalog-filters-apply" onClick={applyFilters}>
              Confirmar — ver {pagination.total} {pagination.total === 1 ? 'resultado' : 'resultados'}
            </button>
          </div>

          <section className="catalog-main" id="catalog-results">
            <ListingSearchBar
              filters={filters}
              filtersPath={`/${basePath}/filtros`}
              onSearch={handleSearch}
              placeholder={sectionConfig?.searchPlaceholder}
            />

            <CatalogActiveFilters
              filters={filters}
              defaults={filterDefaults}
              basePath={basePath}
              onUpdate={updateFilters}
            />

            {sectionConfig ? (
              <CatalogInsightsBar insight={priceInsight} basePath={basePath} total={pagination.total} />
            ) : null}

            <CatalogToolbar
              total={pagination.total}
              sort={filters.sort}
              view={filters.view}
              gridSize={gridSize}
              mapPath={mapPath}
              onSortChange={(sort) => updateFilters({ ...filters, sort })}
              onViewChange={(view) => updateFilters({ ...filters, view }, false)}
              onGridSizeChange={(nextSize) => updateFilters({ ...filters, gridSize: nextSize }, false)}
            />

            {pagination.items.length === 0 ? (
              <div className="catalog-empty-wrap">
                <EmptyState
                  title="Nenhum resultado encontrado"
                  description={
                    sectionConfig?.emptyDescription ||
                    (showVehicleFilters
                      ? 'Tente alterar marca, preço ou localização.'
                      : 'Tente alterar os filtros ou escolher outro tipo de imóvel.')
                  }
                  actionLabel="Limpar filtros"
                  actionTo={`/${basePath}`}
                />
                {sectionConfig?.emptyLinks?.length ? (
                  <div className="catalog-empty-links">
                    {sectionConfig.emptyLinks.map((link) => (
                      <Link key={link.to} className="text-button" to={link.to}>
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : filters.view === 'list' ? (
              <div className="listing-list">
                {pagination.items.map((listing) => (
                  <ListingRow key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className={`listing-grid listing-grid-${gridSize}`}>
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

            <CatalogPagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={goToPage}
            />
          </section>
        </div>
      </div>
    </main>
  )
}
