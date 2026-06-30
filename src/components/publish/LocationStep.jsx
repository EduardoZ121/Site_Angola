export function LocationStep({ draft, provinces, bairros, onChange }) {
  function handleProvinceChange(province) {
    const municipality = provinces[province]?.[0] || ''
    const neighborhood = bairros[municipality]?.[0] || ''
    onChange({ province, municipality, neighborhood })
  }

  function handleMunicipalityChange(municipality) {
    const neighborhood = bairros[municipality]?.[0] || ''
    onChange({ municipality, neighborhood })
  }

  return (
    <section className="publish-step panel-card publish-step-animate">
      <header className="publish-step-header">
        <h2>Localização</h2>
        <p>Indique onde está o imóvel ou veículo — compradores filtram por zona.</p>
      </header>
      <div className="form-row">
        <label>
          Província
          <select value={draft.province} onChange={(event) => handleProvinceChange(event.target.value)}>
            {Object.keys(provinces).map((province) => (
              <option key={province}>{province}</option>
            ))}
          </select>
        </label>
        <label>
          Município
          <select
            value={draft.municipality}
            onChange={(event) => handleMunicipalityChange(event.target.value)}
          >
            {(provinces[draft.province] || []).map((municipality) => (
              <option key={municipality}>{municipality}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Bairro
        <select value={draft.neighborhood} onChange={(event) => onChange({ neighborhood: event.target.value })}>
          {(bairros[draft.municipality] || []).map((neighborhood) => (
            <option key={neighborhood}>{neighborhood}</option>
          ))}
        </select>
      </label>
      <div className="form-row">
        <label>
          Latitude (opcional)
          <input
            type="number"
            step="any"
            value={draft.lat}
            onChange={(event) => onChange({ lat: event.target.value })}
            placeholder="Preparado para GPS"
          />
        </label>
        <label>
          Longitude (opcional)
          <input
            type="number"
            step="any"
            value={draft.lng}
            onChange={(event) => onChange({ lng: event.target.value })}
            placeholder="Preparado para GPS"
          />
        </label>
      </div>
    </section>
  )
}
