import { Link } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import { formatKz } from '../utils/format'
import { PageIntro, SectionBlock } from '../components/SectionBlock'

export default function ComparePage() {
  const { listings, compare } = useMarketplace()
  const items = compare
    .map((id) => listings.find((listing) => listing.id === id))
    .filter(Boolean)

  return (
    <main className="page-main">
      <PageIntro
        eyebrow="Comparar"
        title="Compare até 3 anúncios"
        subtitle="Seleccione anúncios nas páginas de comprar, arrendar ou veículos."
      />

      <SectionBlock
        id="tabela-comparacao"
        eyebrow="Comparação"
        title={`${items.length} de 3 selecionados`}
        action={
          items.length > 0 ? (
            <Link className="text-button" to="/comprar">
              Adicionar mais
            </Link>
          ) : null
        }
        tone="muted"
      >
        {items.length === 0 ? (
          <div className="empty-state panel-card">
            <p>Seleccione anúncios na página de resultados para comparar.</p>
            <Link className="button primary" to="/comprar">
              Ver imóveis
            </Link>
          </div>
        ) : (
          <div className="compare-panel panel-card">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Preço</th>
                  <th>Tipo</th>
                  <th>Local</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{formatKz(item.price)}</td>
                    <td>
                      {item.category === 'Imóvel'
                        ? item.propertyType
                        : `${item.brand} ${item.model}`}
                    </td>
                    <td>{item.neighborhood}</td>
                    <td>
                      <Link to={`/anuncio/${item.id}`}>Abrir</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionBlock>
    </main>
  )
}
