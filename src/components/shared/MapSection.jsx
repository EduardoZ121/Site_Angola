export function MapSection({ location }) {
  return (
    <section className="listing-map-section panel-card" aria-label="Localização">
      <h3>Localização</h3>
      <p>
        {location.province} / {location.municipality} / {location.neighborhood}
      </p>
      <div className="listing-map-placeholder">
        <span>Mapa interactivo — em breve</span>
        <small>Integração com mapa e rotas na próxima fase</small>
      </div>
    </section>
  )
}
