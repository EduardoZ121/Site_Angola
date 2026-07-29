import { PublishFieldHint } from './PublishFieldHint'

export function PricingStep({ draft, onChange }) {
  return (
    <section className="publish-step panel-card publish-step-animate">
      <header className="publish-step-header">
        <h2>Preço</h2>
        <p>Indique um valor realista — pode alterar depois de publicar.</p>
      </header>

      <label className="publish-field">
        Valor em Kwanzas (Kz)
        <input
          type="number"
          min="0"
          value={draft.price}
          onChange={(event) => onChange({ price: event.target.value })}
          placeholder="Ex: 850000"
        />
        <PublishFieldHint>
          {draft.operation === 'Arrendamento'
            ? 'Valor mensal de arrendamento. Pode ajustar o preço a qualquer momento.'
            : 'Preço de venda pretendido. Pode alterar mais tarde sem republicar.'}
        </PublishFieldHint>
      </label>
    </section>
  )
}
