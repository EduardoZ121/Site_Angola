export function ContactStep({ draft, profile, onChange }) {
  return (
    <section className="publish-step panel-card">
      <h2>Contacto</h2>
      <label className="publish-check">
        <input
          type="checkbox"
          checked={draft.useProfilePhone}
          onChange={(event) => onChange({ useProfilePhone: event.target.checked })}
        />
        Usar telefone do perfil ({profile.phone || 'não definido'})
      </label>
      {!draft.useProfilePhone ? (
        <label>
          Telefone para contacto
          <input
            value={draft.contactPhone}
            onChange={(event) => onChange({ contactPhone: event.target.value })}
            placeholder="+244 9XX XXX XXX"
          />
        </label>
      ) : null}
      <p className="publish-hint">Os interessados poderão ligar, enviar WhatsApp ou mensagem.</p>
    </section>
  )
}
