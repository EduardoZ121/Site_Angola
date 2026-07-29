import { isVehicleCategory } from '../../constants/publishCategories'
import { AiDescriptionButton } from './AiDescriptionButton'
import { PublishFieldHint } from './PublishFieldHint'

export function BasicInfoStep({ draft, onChange }) {
  const vehicle = isVehicleCategory(draft.listingCategory)
  return (
    <section className="publish-step panel-card publish-step-animate">
      <header className="publish-step-header">
        <h2>Informações principais</h2>
        <p>Um título claro e uma descrição completa aumentam contactos.</p>
      </header>

      <div className="form-row">
        <label className="publish-field">
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

      <label className="publish-field">
        Título do anúncio
        <input
          value={draft.title}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="Ex: T3 moderno no Talatona"
        />
        <PublishFieldHint>Use palavras que compradores pesquisam: bairro, quartos, tipo de imóvel.</PublishFieldHint>
      </label>

      <label className="publish-field">
        Descrição
        <textarea
          rows={5}
          value={draft.description}
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="Descreva o imóvel ou veículo com detalhe..."
        />
        <AiDescriptionButton draft={draft} onGenerated={(description) => onChange({ description })} />
        <PublishFieldHint>Mencione estado, acessos, segurança e o que torna o anúncio especial.</PublishFieldHint>
      </label>
    </section>
  )
}
