import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import { CatalogBreadcrumbs } from '../components/catalog/CatalogBreadcrumbs'
import { FavoritesCrossNav } from '../components/favorites/FavoritesCrossNav'
import { FavoritesFilterTabs } from '../components/favorites/FavoritesFilterTabs'
import { FavoritesInsightsBar } from '../components/favorites/FavoritesInsightsBar'
import { FavoritesToolbar } from '../components/favorites/FavoritesToolbar'
import { ListingCard } from '../components/ListingCard'
import { EmptyState } from '../components/ui/EmptyState'
import { HelpTip } from '../components/ui/HelpTip'
import { PageIntro } from '../components/SectionBlock'
import {
  computeFavoritesInsight,
  countFavoritesByFilter,
  filterFavoriteListings,
  getStaleFavoriteIds,
  resolveFavoriteListings,
  sortFavoriteListings,
} from '../utils/favorites'
import '../styles/favorites.css'

export default function FavoritesPage() {
  const {
    listings,
    favorites,
    compare,
    toggleFavorite,
    toggleCompare,
    clearFavorites,
    pruneStaleFavorites,
  } = useMarketplace()
  const [activeFilter, setActiveFilter] = useState('all')
  const [sort, setSort] = useState('recent')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    document.title = 'Favoritos | Kuteka'
  }, [])

  const allItems = useMemo(
    () => resolveFavoriteListings(listings, favorites),
    [listings, favorites],
  )

  const staleCount = useMemo(
    () => getStaleFavoriteIds(favorites, listings).length,
    [favorites, listings],
  )

  const filterCounts = useMemo(() => countFavoritesByFilter(allItems), [allItems])
  const insight = useMemo(() => computeFavoritesInsight(allItems), [allItems])

  const visibleItems = useMemo(() => {
    const filtered = filterFavoriteListings(allItems, activeFilter)
    return sortFavoriteListings(filtered, sort)
  }, [allItems, activeFilter, sort])

  const compareFull = compare.length >= 3

  function handleClearAll() {
    if (!allItems.length) return
    if (!window.confirm('Remover todos os favoritos guardados?')) return
    clearFavorites()
    setNotice('')
  }

  function handlePruneStale() {
    pruneStaleFavorites()
    setNotice('Favoritos indisponíveis removidos.')
    window.setTimeout(() => setNotice(''), 2500)
  }

  function handleAddToCompare() {
    const slotsLeft = 3 - compare.length
    if (slotsLeft <= 0) {
      setNotice('A comparação já tem 3 anúncios.')
      return
    }
    const candidates = visibleItems.filter((item) => !compare.includes(item.id)).slice(0, slotsLeft)
    if (!candidates.length) {
      setNotice('Todos os favoritos visíveis já estão na comparação.')
      return
    }
    candidates.forEach((item) => toggleCompare(item.id))
    const added = candidates.length
    setNotice(`${added} anúncio${added === 1 ? '' : 's'} adicionado${added === 1 ? '' : 's'} à comparação.`)
    window.setTimeout(() => setNotice(''), 2500)
  }

  return (
    <main className="page-main favorites-page">
      <PageIntro
        eyebrow="Conta"
        title="Os meus favoritos"
        subtitle="Anúncios guardados para rever, comparar ou contactar mais tarde."
      />

      <div className="favorites-page-body section-block-inner">
        <CatalogBreadcrumbs
          items={[
            { label: 'Início', to: '/inicio' },
            { label: 'Favoritos', to: '/favoritos' },
          ]}
        />

        <p className="favorites-help-line">
          Os favoritos ficam guardados neste dispositivo.
          <HelpTip
            label="Ajuda: favoritos"
            text="Lista guardada localmente (demo). Entre na conta para sincronizar contactos e mensagens."
          />
        </p>

        <FavoritesCrossNav />

        {staleCount > 0 ? (
          <div className="favorites-stale-banner panel-card">
            <p>
              {staleCount} {staleCount === 1 ? 'anúncio guardado já não está' : 'anúncios guardados já não estão'}{' '}
              disponível{staleCount === 1 ? '' : 'is'}.
            </p>
            <button type="button" className="text-button" onClick={handlePruneStale}>
              Limpar indisponíveis
            </button>
          </div>
        ) : null}

        {allItems.length > 0 ? (
          <>
            <FavoritesInsightsBar insight={insight} compareCount={compare.length} />
            <FavoritesFilterTabs
              activeFilter={activeFilter}
              counts={filterCounts}
              onChange={setActiveFilter}
            />
            <FavoritesToolbar
              total={visibleItems.length}
              sort={sort}
              onSortChange={setSort}
              onClearAll={handleClearAll}
              onAddToCompare={handleAddToCompare}
              compareFull={compareFull}
            />
            {notice ? <p className="favorites-notice">{notice}</p> : null}
          </>
        ) : null}

        {allItems.length === 0 ? (
          <div className="favorites-empty-wrap">
            <EmptyState
              title="Ainda sem favoritos"
              description="Toque no coração nos anúncios de comprar, arrendar ou veículos para guardar aqui."
              actionLabel="Explorar marketplace"
              actionTo="/explorar"
            />
            <div className="favorites-empty-links">
              <Link className="text-button" to="/comprar">
                Comprar imóveis
              </Link>
              <Link className="text-button" to="/arrendar">
                Arrendar
              </Link>
              <Link className="text-button" to="/veiculos">
                Veículos
              </Link>
            </div>
          </div>
        ) : visibleItems.length === 0 ? (
          <EmptyState
            title="Nenhum favorito nesta categoria"
            description="Escolha outro filtro ou explore novos anúncios."
            actionLabel="Ver todos os favoritos"
            onAction={() => setActiveFilter('all')}
          />
        ) : (
          <div className="listing-grid listing-grid-md favorites-grid">
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
