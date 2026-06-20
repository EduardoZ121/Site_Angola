import { Link } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import { formatKz } from '../utils/format'

export default function ComparePage() {
  const { listings, compare } = useMarketplace()
  const items = compare
    .map((id) => listings.find((listing) => listing.id === id))
    .filter(Boolean)

  return (
    <main className="page-main">
      <section className="page-hero compact">
        <div className="page-hero-inner">
          <p className="eyebrow">Comparar</p>
          <h1>Compare até 3 anúncios</h1>
        </div>
      </section>

      <section className="section page-section">
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
      </section>
    </main>
  )
}
