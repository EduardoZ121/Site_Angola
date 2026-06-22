import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ADD_PROPERTY_STORAGE_KEY,
  defaultAddPropertyDraft,
  propertyStatuses,
  propertyTypes,
  sellPlans,
} from '../data/addProperty'
import { PageIntro, SectionBlock } from '../components/SectionBlock'

export default function AddPropertyDetailsPage() {
  const navigate = useNavigate()
  const [draft, setDraft] = useState({ ...defaultAddPropertyDraft })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(ADD_PROPERTY_STORAGE_KEY)
      if (!saved) {
        navigate('/adicionar-propriedade', { replace: true })
        return
      }
      setDraft({ ...defaultAddPropertyDraft, ...JSON.parse(saved) })
    } catch {
      navigate('/adicionar-propriedade', { replace: true })
    }
  }, [navigate])

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    sessionStorage.setItem(ADD_PROPERTY_STORAGE_KEY, JSON.stringify(draft))
    setSubmitted(true)
  }

  const typeLabel = propertyTypes.find((item) => item.value === draft.propertyType)?.label || 'Propriedade'

  if (submitted) {
    return (
      <main className="page-main">
        <SectionBlock id="sucesso" title="Pedido recebido">
          <div className="empty-state panel-card add-property-success">
            <span className="add-property-icon" aria-hidden="true">
              ✅
            </span>
            <h2>Obrigado, {draft.firstName || 'proprietário'}!</h2>
            <p>
              Recebemos os dados de {typeLabel} em {draft.address}. Entraremos em contacto em breve.
            </p>
            <div className="add-property-success-actions">
              <Link className="button primary" to="/publicar">
                Criar anúncio agora
              </Link>
              <Link className="text-button" to="/">
                Voltar ao início
              </Link>
            </div>
          </div>
        </SectionBlock>
      </main>
    )
  }

  return (
    <main className="page-main">
      <PageIntro
        eyebrow="Passo 2 de 2"
        title="Detalhes da propriedade"
        subtitle="Complete o formulário para publicar, vender ou estimar valor."
      />

      <SectionBlock id="local" eyebrow="Localização" title="Endereço confirmado" tone="muted">
        <div className="panel-card add-property-summary">
          <p>
            <strong>{typeLabel}</strong>
          </p>
          <p>{draft.address}</p>
          <p className="muted-line">
            {[draft.neighborhood, draft.municipality, draft.province].filter(Boolean).join(' • ')}
          </p>
          <Link className="text-button" to="/adicionar-propriedade">
            Alterar endereço
          </Link>
        </div>
      </SectionBlock>

      <SectionBlock id="detalhes" eyebrow="Imóvel" title="Estado e planos">
        <form className="owner-form panel-card add-property-details-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Estado da propriedade *
              <select
                required
                value={draft.propertyStatus}
                onChange={(event) => updateField('propertyStatus', event.target.value)}
              >
                <option value="">Seleccionar...</option>
                {propertyStatuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quando pretende vender ou arrendar? *
              <select
                required
                value={draft.sellPlan}
                onChange={(event) => updateField('sellPlan', event.target.value)}
              >
                <option value="">Seleccionar...</option>
                {sellPlans.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {draft.propertyType !== 'carro' && (
            <div className="form-row">
              <label>
                Quartos (opcional)
                <input
                  type="number"
                  min="0"
                  value={draft.bedrooms}
                  onChange={(event) => updateField('bedrooms', event.target.value)}
                />
              </label>
              <label>
                Casas de banho (opcional)
                <input
                  type="number"
                  min="0"
                  value={draft.bathrooms}
                  onChange={(event) => updateField('bathrooms', event.target.value)}
                />
              </label>
              <label>
                Área m² (opcional)
                <input
                  type="number"
                  min="0"
                  value={draft.area}
                  onChange={(event) => updateField('area', event.target.value)}
                />
              </label>
            </div>
          )}

          <label>
            Preço esperado em Kz (opcional)
            <input
              type="number"
              min="0"
              placeholder="Ex.: 45000000"
              value={draft.priceExpectation}
              onChange={(event) => updateField('priceExpectation', event.target.value)}
            />
          </label>

          <p className="field-label">Os seus dados de contacto</p>
          <div className="form-row">
            <label>
              Nome *
              <input
                required
                value={draft.firstName}
                onChange={(event) => updateField('firstName', event.target.value)}
              />
            </label>
            <label>
              Sobrenome *
              <input
                required
                value={draft.lastName}
                onChange={(event) => updateField('lastName', event.target.value)}
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Email *
              <input
                required
                type="email"
                value={draft.email}
                onChange={(event) => updateField('email', event.target.value)}
              />
            </label>
            <label>
              Telefone (+244) *
              <input
                required
                placeholder="+244 9xx xxx xxx"
                value={draft.phone}
                onChange={(event) => updateField('phone', event.target.value)}
              />
            </label>
          </div>

          <label>
            Mensagem (opcional)
            <textarea
              rows="4"
              placeholder="Conte-nos mais sobre a propriedade, horários de visita, etc."
              value={draft.message}
              onChange={(event) => updateField('message', event.target.value)}
            />
          </label>

          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={draft.acceptContact}
              onChange={(event) => updateField('acceptContact', event.target.checked)}
            />
            Aceito ser contactado por email ou telefone sobre este pedido.
          </label>

          <label className="checkbox-line">
            <input
              type="checkbox"
              required
              checked={draft.acceptTerms}
              onChange={(event) => updateField('acceptTerms', event.target.checked)}
            />
            Confirmo que os dados são verdadeiros e aceito a política de privacidade Kuteka.
          </label>

          <div className="filters-map-actions">
            <Link className="text-button" to="/adicionar-propriedade">
              Voltar
            </Link>
            <button className="button primary" type="submit">
              Enviar pedido
            </button>
          </div>
        </form>
      </SectionBlock>
    </main>
  )
}
