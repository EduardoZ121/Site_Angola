import { isPropertyWithRooms, isVehicleCategory } from '../../constants/publishCategories'

const AMENITY_OPTIONS = ['Estacionamento', 'Segurança 24h', 'Elevador', 'Piscina', 'Jardim', 'Garagem']

export function FeaturesStep({ draft, onChange }) {
  const vehicle = isVehicleCategory(draft.listingCategory)
  const withRooms = isPropertyWithRooms(draft.listingCategory)

  function toggleAmenity(item) {
    const next = draft.amenities.includes(item)
      ? draft.amenities.filter((value) => value !== item)
      : [...draft.amenities, item]
    onChange({ amenities: next })
  }

  return (
    <section className="publish-step panel-card">
      <h2>Características</h2>
      {vehicle ? (
        <div className="form-row">
          <label>
            Marca
            <input value={draft.brand} onChange={(event) => onChange({ brand: event.target.value })} />
          </label>
          <label>
            Modelo
            <input value={draft.model} onChange={(event) => onChange({ model: event.target.value })} />
          </label>
          <label>
            Ano
            <input type="number" value={draft.year} onChange={(event) => onChange({ year: event.target.value })} />
          </label>
        </div>
      ) : null}

      {withRooms ? (
        <div className="form-row">
          <label>
            Quartos
            <input
              type="number"
              value={draft.bedrooms}
              onChange={(event) => onChange({ bedrooms: event.target.value })}
            />
          </label>
          <label>
            Casas de banho
            <input
              type="number"
              value={draft.bathrooms}
              onChange={(event) => onChange({ bathrooms: event.target.value })}
            />
          </label>
          <label>
            Área (m²)
            <input type="number" value={draft.area} onChange={(event) => onChange({ area: event.target.value })} />
          </label>
        </div>
      ) : null}

      {draft.listingCategory === 'Terreno' ? (
        <label>
          Área (m²)
          <input type="number" value={draft.area} onChange={(event) => onChange({ area: event.target.value })} />
        </label>
      ) : null}

      {vehicle ? (
        <div className="form-row">
          <label>
            Quilometragem
            <input
              type="number"
              value={draft.mileage}
              onChange={(event) => onChange({ mileage: event.target.value })}
            />
          </label>
          <label>
            Combustível
            <select value={draft.fuel} onChange={(event) => onChange({ fuel: event.target.value })}>
              <option>Gasolina</option>
              <option>Diesel</option>
              <option>Eléctrico</option>
              <option>Híbrido</option>
            </select>
          </label>
          <label>
            Caixa
            <select value={draft.gearbox} onChange={(event) => onChange({ gearbox: event.target.value })}>
              <option>Automática</option>
              <option>Manual</option>
            </select>
          </label>
        </div>
      ) : (
        <>
          <p className="publish-hint">Comodidades (opcional)</p>
          <div className="publish-tag-picker">
            {AMENITY_OPTIONS.map((item) => (
              <button
                key={item}
                type="button"
                className={draft.amenities.includes(item) ? 'selected' : ''}
                onClick={() => toggleAmenity(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
