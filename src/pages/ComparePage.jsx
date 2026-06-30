import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import { CatalogBreadcrumbs } from '../components/catalog/CatalogBreadcrumbs'
import { CompareCrossNav } from '../components/compare/CompareCrossNav'
import { CompareFeatureTable } from '../components/compare/CompareFeatureTable'
import { CompareInsightsBar } from '../components/compare/CompareInsightsBar'
import { CompareItemCard } from '../components/compare/CompareItemCard'
import { CompareSlotsBar } from '../components/compare/CompareSlotsBar'
import { CompareToolbar } from '../components/compare/CompareToolbar'
import { EmptyState } from '../components/ui/EmptyState'
import { HelpTip } from '../components/ui/HelpTip'
import { PageIntro } from '../components/SectionBlock'
import {
  computeCompareInsight,
  getCompareAddLink,
  getLowestPriceItemId,
  getStaleCompareIds,
  resolveCompareItems,
} from '../utils/compare'
import '../styles/compare.css'

export default function ComparePage() {
  const { listings, compare, toggleCompare, clearCompare, pruneStaleCompare } = useMarketplace()

  useEffect(() => {
    document.title = 'Comparar | Kuteka'
  }, [])

  const items = useMemo(() => resolveCompareItems(listings, compare), [listings, compare])
  const staleCount = useMemo(() => getStaleCompareIds(compare, listings).length, [compare, listings])
  const insight = useMemo(() => computeCompareInsight(items), [items])
  const lowestId = useMemo(() => getLowestPriceItemId(items), [items])
  const addLink = useMemo(() => getCompareAddLink(items), [items])

  function handleClearAll() {
    if (!items.length) return
    if (!window.confirm('Limpar todos os anúncios da comparação?')) return
    clearCompare()
  }

  function handleRemove(id) {
    toggleCompare(id)
  }

  function handlePruneStale() {
    pruneStaleCompare()
  }

  return (
    <main className="page-main compare-page">
      <PageIntro
        eyebrow="Ferramentas"
        title="Compare até 3 anúncios"
        subtitle="Veja preço, características e localização lado a lado antes de contactar."
      />

      <div className="compare-page-body section-block-inner">
        <CatalogBreadcrumbs
          items={[
            { label: 'Início', to: '/inicio' },
            { label: 'Comparar', to: '/comparar' },
          ]}
        />

        <p className="compare-help-line">
          Seleccione anúncios no catálogo ou na página de detalhe — máximo 3.
          <HelpTip
            label="Ajuda: comparar"
            text="A lista fica guardada neste dispositivo. Remova itens com o botão × ou limpe tudo de uma vez."
          />
        </p>

        <CompareCrossNav />

        <CompareSlotsBar items={items} addLink={addLink} />

        {staleCount > 0 ? (
          <div className="compare-stale-banner panel-card">
            <p>
              {staleCount}{' '}
              {staleCount === 1 ? 'anúncio na comparação já não está' : 'anúncios na comparação já não estão'}{' '}
              disponível{staleCount === 1 ? '' : 'is'}.
            </p>
            <button type="button" className="text-button" onClick={handlePruneStale}>
              Limpar indisponíveis
            </button>
          </div>
        ) : null}

        {items.length > 0 ? (
          <>
            <CompareInsightsBar insight={insight} lowestId={lowestId} />
            <CompareToolbar total={items.length} onClearAll={handleClearAll} addLink={addLink} />
            <div className="compare-cards-grid">
              {items.map((item) => (
                <CompareItemCard
                  key={item.id}
                  item={item}
                  isLowest={item.id === lowestId && items.length > 1}
                  onRemove={handleRemove}
                />
              ))}
            </div>
            {items.length > 1 ? (
              <CompareFeatureTable items={items} lowestId={lowestId} />
            ) : null}
          </>
        ) : (
          <div className="compare-empty-wrap">
            <EmptyState
              title="Nenhum anúncio para comparar"
              description="Use «Comparar» nos cartões do catálogo, nos favoritos ou na página do anúncio."
              actionLabel="Explorar anúncios"
              actionTo="/explorar"
            />
            <div className="compare-empty-links">
              <Link className="text-button" to="/comprar">
                Comprar imóveis
              </Link>
              <Link className="text-button" to="/arrendar">
                Arrendar
              </Link>
              <Link className="text-button" to="/favoritos">
                Favoritos
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
