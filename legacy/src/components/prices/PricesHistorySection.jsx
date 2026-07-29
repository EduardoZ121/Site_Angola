import { Link } from 'react-router-dom'
import { defaultPhoto } from '../../data/constants'
import { formatKz } from '../../utils/format'
import { getCatalogPathForListing } from '../../utils/listingDetail'

function formatHistoryPrice(item) {
  const price = formatKz(item.price)
  return item.operation === 'Arrendamento' ? `${price}/mês` : price
}

export function PricesHistorySection({ items }) {
  return (
    <section className="prices-history panel-card" id="historico" aria-labelledby="prices-history-title">
      <h2 id="prices-history-title" className="prices-section-title">
        Histórico de visualizações
      </h2>
      <p className="prices-history-lead">Anúncios que visitou recentemente neste dispositivo.</p>
      {items.length === 0 ? (
        <div className="prices-history-empty">
          <p>Ainda sem histórico.</p>
          <Link className="button primary" to="/explorar">
            Explorar anúncios
          </Link>
        </div>
      ) : (
        <ul className="prices-history-list">
          {items.map((item) => (
            <li key={item.id}>
              <Link className="prices-history-item" to={`/anuncio/${item.id}`}>
                <img src={item.photos?.[0] || defaultPhoto} alt="" loading="lazy" />
                <div>
                  <strong>{item.title}</strong>
                  <span>
                    {item.neighborhood}, {item.province}
                  </span>
                  <span className="prices-history-price">{formatHistoryPrice(item)}</span>
                </div>
              </Link>
              <Link className="text-button" to={getCatalogPathForListing(item)}>
                Ver catálogo
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
