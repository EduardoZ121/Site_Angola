import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'

export function MapSection({ location, filtersLink }) {
  return (
    <section className="listing-map-section panel-card" aria-label="Localização">
      <div className="listing-map-head">
        <h3>Localização</h3>
        {filtersLink ? (
          <Link className="text-button listing-map-link" to={filtersLink}>
            Ver anúncios na zona
          </Link>
        ) : null}
      </div>
      <p>
        {location.province} / {location.municipality} / {location.neighborhood}
      </p>
      <div className="listing-map-placeholder">
        <HomeIcon name="pin" />
        <span>Mapa interactivo — em breve</span>
        <small>Integração com mapa e rotas na próxima fase</small>
      </div>
    </section>
  )
}
