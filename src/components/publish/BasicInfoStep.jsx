import { isVehicleCategory } from '../../constants/publishCategories'

export function BasicInfoStep({ draft, onChange }) {
  const vehicle = isVehicleCategory(draft.listingCategory)
  return (
    <section className="publish-step panel-card">
      <h2>Informações principais</h2>
      <div className="form-row">
        <label>
          Operação
          <select value={draft.operation} onChange={(event) => onChange({ operation: event.target.value })}>
            {vehicle ? (
              <option value="Venda">Venda</option>
            ) : (
              <>
                <option value="Arrendamento">Arrendamento</option>
                <option value="Venda">Venda</option>
              </>
            )}
          </select>
        </label>
      </div>
      <label>
        Título do anúncio
        <input
          value={draft.title}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="Ex: T3 moderno no Talatona"
        />
      </label>
      <label>
        Descrição
        <textarea
          rows={5}
          value={draft.description}
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="Descreva o imóvel ou veículo com detalhe..."
        />
      </label>
    </section>
  )
}
