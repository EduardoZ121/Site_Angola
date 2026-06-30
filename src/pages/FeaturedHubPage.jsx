import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import { CatalogBreadcrumbs } from '../components/catalog/CatalogBreadcrumbs'
import { FeaturedCrossNav } from '../components/featured/FeaturedCrossNav'
import { FeaturedFilterTabs } from '../components/featured/FeaturedFilterTabs'
import { FeaturedInsightsBar } from '../components/featured/FeaturedInsightsBar'
import { FeaturedOwnerBanner } from '../components/featured/FeaturedOwnerBanner'
import { FeaturedToolbar } from '../components/featured/FeaturedToolbar'
import { ListingCard } from '../components/ListingCard'
import { EmptyState } from '../components/ui/EmptyState'
import { HelpTip } from '../components/ui/HelpTip'
import { PageIntro } from '../components/SectionBlock'
import {
  computeFeaturedInsight,
  countFeaturedByFilter,
  filterFeaturedListings,
  getFeaturedCatalogLink,
  getFeaturedListings,
  sortFeaturedListings,
} from '../utils/featured'
import '../styles/featured.css'

export default function FeaturedHubPage() {
  const { listings, favorites, toggleFavorite } = useMarketplace()
  const [activeFilter, setActiveFilter] = useState('all')
  const [sort, setSort] = useState('views')

  useEffect(() => {
    document.title = 'Destaques | Kuteka'
  }, [])

  const allFeatured = useMemo(() => getFeaturedListings(listings), [listings])
  const filterCounts = useMemo(() => countFeaturedByFilter(allFeatured), [allFeatured])
  const insight = useMemo(() => computeFeaturedInsight(allFeatured), [allFeatured])
  const catalogLink = useMemo(() => getFeaturedCatalogLink(activeFilter), [activeFilter])

  const visibleItems = useMemo(() => {
    const filtered = filterFeaturedListings(allFeatured, activeFilter)
    return sortFeaturedListings(filtered, sort)
  }, [allFeatured, activeFilter, sort])

  return (
    <main className="page-main featured-page">
      <PageIntro
        eyebrow="Destaques"
        title="Anúncios em destaque"
        subtitle="Seleccionados para maior visibilidade — verificados e actualizados pelo marketplace."
      />

      <div className="featured-page-body section-block-inner">
        <CatalogBreadcrumbs
          items={[
            { label: 'Início', to: '/inicio' },
            { label: 'Destaques', to: '/destaques' },
          ]}
        />

        <p className="featured-help-line">
          Anúncios com plano destaque activo aparecem primeiro no catálogo e aqui.
          <HelpTip
            label="Ajuda: destaques"
            text="Proprietários podem activar destaque no painel. A duração depende do plano (demo: renovação gratuita)."
          />
        </p>

        <FeaturedCrossNav />
        <FeaturedOwnerBanner />

        {allFeatured.length > 0 ? (
          <>
            <FeaturedInsightsBar insight={insight} />
            <FeaturedFilterTabs
              activeFilter={activeFilter}
              counts={filterCounts}
              onChange={setActiveFilter}
            />
            <FeaturedToolbar
              total={visibleItems.length}
              sort={sort}
              catalogLink={catalogLink}
              onSortChange={setSort}
            />
          </>
        ) : null}

        {allFeatured.length === 0 ? (
          <div className="featured-empty-wrap">
            <EmptyState
              title="Sem destaques activos"
              description="Quando houver anúncios em destaque, aparecem aqui. Explore o catálogo completo enquanto isso."
              actionLabel="Explorar marketplace"
              actionTo="/explorar"
            />
            <div className="featured-empty-links">
              <Link className="text-button" to="/comprar">
                Comprar imóveis
              </Link>
              <Link className="text-button" to="/arrendar">
                Arrendar
              </Link>
              <Link className="text-button" to="/painel">
                Destacar no painel
              </Link>
            </div>
          </div>
        ) : visibleItems.length === 0 ? (
          <EmptyState
            title="Nenhum destaque nesta categoria"
            description="Escolha outro filtro ou veja o catálogo completo."
            actionLabel="Ver todos os destaques"
            onAction={() => setActiveFilter('all')}
          />
        ) : (
          <div className="listing-grid listing-grid-md featured-grid">
            {visibleItems.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                favorites={favorites}
                onFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
