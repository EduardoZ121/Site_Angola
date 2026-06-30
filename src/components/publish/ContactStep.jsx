import { PublishFieldHint } from './PublishFieldHint'

export function ContactStep({ draft, profile, onChange }) {
  return (
    <section className="publish-step panel-card publish-step-animate">
      <header className="publish-step-header">
        <h2>Contacto</h2>
        <p>Compradores entram em contacto por telefone, WhatsApp ou mensagem na Kuteka.</p>
      </header>

      <label className="publish-check">
        <input
          type="checkbox"
          checked={draft.useProfilePhone}
          onChange={(event) => onChange({ useProfilePhone: event.target.checked })}
        />
        Usar telefone do perfil ({profile.phone || 'não definido'})
      </label>

      {!draft.useProfilePhone ? (
        <label className="publish-field">
          Telefone para contacto
          <input
            value={draft.contactPhone}
            onChange={(event) => onChange({ contactPhone: event.target.value })}
            placeholder="+244 9XX XXX XXX"
          />
        </label>
      ) : null}

      <PublishFieldHint>
        Precisamos deste número para que compradores possam entrar em contacto consigo directamente.
      </PublishFieldHint>
    </section>
  )
}
