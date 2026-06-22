import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import { ListingCard } from '../components/ListingCard'
import { ListingSearchBar } from '../components/ListingSearchBar'
import { PageIntro, SectionBlock } from '../components/SectionBlock'
import { filterListings } from '../utils/format'
import { filterSummary, filtersToSearchParams, searchParamsToFilters } from '../utils/filters'

export default function ListingsPage({
  title,
  subtitle,
  basePath,
  defaultCategory = 'Todos',
  defaultOperation = 'Todos',
}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { listings, favorites, compare, isAdmin, toggleFavorite, toggleCompare } = useMarketplace()

  const filters = useMemo(
    () =>
      searchParamsToFilters(searchParams, {
        category: defaultCategory,
        operation: defaultOperation,
      }),
    [searchParams, defaultCategory, defaultOperation],
  )

  const filtered = useMemo(
    () => filterListings(listings, filters, isAdmin),
    [filters, listings, isAdmin],
  )

  const summary = filterSummary(filters)

  function updateFilters(nextFilters) {
    const params = filtersToSearchParams({
      ...nextFilters,
      category: defaultCategory !== 'Todos' ? defaultCategory : nextFilters.category,
      operation: defaultOperation !== 'Todos' ? defaultOperation : nextFilters.operation,
    })
    navigate(`/${basePath}?${params.toString()}`)
  }

  function handleSearch(query) {
    updateFilters({ ...filters, query })
  }

  return (
    <main className="page-main">
      <PageIntro eyebrow="Resultados" title={title} subtitle={subtitle} />

      <SectionBlock
        id="pesquisa"
        eyebrow="Pesquisa"
        title="Encontrar anúncios"
        subtitle="Use a barra de pesquisa ou abra filtros e mapa numa página separada."
      >
        <ListingSearchBar
          filters={filters}
          filtersPath={`/${basePath}/filtros`}
          onSearch={handleSearch}
        />
        {summary ? <p className="active-filters-line">Filtros activos: {summary}</p> : null}
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
        tone="muted"
      >
        {filtered.length === 0 ? (
          <div className="empty-state panel-card">
            <p>Nenhum anúncio encontrado com estes filtros.</p>
            <Link className="button primary" to={`/${basePath}/filtros`}>
              Ajustar filtros e mapa
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
