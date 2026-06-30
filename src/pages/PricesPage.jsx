import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import { CatalogBreadcrumbs } from '../components/catalog/CatalogBreadcrumbs'
import { PricesCrossNav } from '../components/prices/PricesCrossNav'
import { PricesFilterTabs } from '../components/prices/PricesFilterTabs'
import { PricesHistorySection } from '../components/prices/PricesHistorySection'
import { PricesInsightsBar } from '../components/prices/PricesInsightsBar'
import { PricesZoneTable } from '../components/prices/PricesZoneTable'
import { EmptyState } from '../components/ui/EmptyState'
import { HelpTip } from '../components/ui/HelpTip'
import { PageIntro } from '../components/SectionBlock'
import {
  buildZonePriceRows,
  computePriceInsight,
  countPriceFilters,
  filterListingsForPriceReport,
  getPriceCatalogBase,
} from '../utils/prices'
import '../styles/prices.css'

export default function PricesPage() {
  const { listings, history } = useMarketplace()
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    document.title = 'Preços por zona | Kuteka'
  }, [])

  const filterCounts = useMemo(() => countPriceFilters(listings), [listings])

  const filteredListings = useMemo(
    () => filterListingsForPriceReport(listings, activeFilter),
    [listings, activeFilter],
  )

  const zoneRows = useMemo(() => buildZonePriceRows(filteredListings), [filteredListings])
  const insight = useMemo(
    () => computePriceInsight(zoneRows, filteredListings),
    [zoneRows, filteredListings],
  )
  const maxAvg = useMemo(
    () => (zoneRows.length ? Math.max(...zoneRows.map((row) => row.avg)) : 0),
    [zoneRows],
  )

  const historyItems = useMemo(
    () =>
      history
        .map((id) => listings.find((listing) => listing.id === id))
        .filter(Boolean)
        .slice(0, 8),
    [history, listings],
  )

  const catalogLink = getPriceCatalogBase(activeFilter)

  return (
    <main className="page-main prices-page">
      <PageIntro
        eyebrow="Relatório"
        title="Preços médios por zona"
        subtitle="Relatório de mercado em Kz — médias, intervalos e ligações directas ao catálogo."
      />

      <div className="prices-page-body section-block-inner">
        <CatalogBreadcrumbs
          items={[
            { label: 'Início', to: '/inicio' },
            { label: 'Preços por zona', to: '/precos' },
          ]}
        />

        <p className="prices-help-line">
          Médias calculadas a partir de anúncios activos — clique numa zona para ver resultados.
          <HelpTip
            label="Ajuda: preços por zona"
            text="Valores indicativos publicados pelos anunciantes. Arrendamentos mostram renda mensal. Confirme condições directamente."
          />
        </p>

        <PricesCrossNav />
        <PricesFilterTabs activeFilter={activeFilter} counts={filterCounts} onChange={setActiveFilter} />

        {filteredListings.length > 0 ? (
          <>
            <PricesInsightsBar insight={insight} filterId={activeFilter} />
            <PricesZoneTable rows={zoneRows} filterId={activeFilter} maxAvg={maxAvg} />
          </>
        ) : (
          <EmptyState
            title="Sem dados para este filtro"
            description="Não há anúncios activos suficientes. Explore o catálogo ou mude de categoria."
            actionLabel="Ver catálogo"
            actionTo={catalogLink}
          />
        )}

        {zoneRows.length === 0 && filteredListings.length > 0 ? (
          <EmptyState
            title="Dados de zona insuficientes"
            description="Os anúncios activos não têm localização completa para calcular médias por bairro."
            actionLabel="Explorar anúncios"
            actionTo="/explorar"
          />
        ) : null}

        <PricesHistorySection items={historyItems} />
      </div>
    </main>
  )
}
