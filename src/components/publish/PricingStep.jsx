export function PricingStep({ draft, onChange }) {
  return (
    <section className="publish-step panel-card">
      <h2>Preço</h2>
      <label>
        Valor em Kwanzas (Kz)
        <input
          type="number"
          min="0"
          value={draft.price}
          onChange={(event) => onChange({ price: event.target.value })}
          placeholder="Ex: 850000"
        />
      </label>
      <p className="publish-hint">
        {draft.operation === 'Arrendamento'
          ? 'Indique o valor mensal de arrendamento.'
          : 'Indique o preço de venda pretendido.'}
      </p>
    </section>
  )
}
