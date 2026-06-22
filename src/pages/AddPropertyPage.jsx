import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADD_PROPERTY_STORAGE_KEY, defaultAddPropertyDraft, propertyTypes } from '../data/addProperty'
import { provinces } from '../data/constants'
import { PageIntro, SectionBlock } from '../components/SectionBlock'

export default function AddPropertyPage() {
  const navigate = useNavigate()
  const [draft, setDraft] = useState({ ...defaultAddPropertyDraft })

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function handleConfirm(event) {
    event.preventDefault()
    if (!draft.address.trim()) return
    sessionStorage.setItem(ADD_PROPERTY_STORAGE_KEY, JSON.stringify(draft))
    navigate('/adicionar-propriedade/detalhes')
  }

  return (
    <main className="page-main">
      <PageIntro
        eyebrow="Proprietários"
        title="Adicionar propriedade"
        subtitle="Registe casa, apartamento, terreno ou veículo e receba apoio para publicar ou estimar valor."
      />

      <SectionBlock id="endereco" eyebrow="Passo 1 de 2" title="Onde fica a propriedade?" tone="muted">
        <div className="add-property-intro panel-card">
          <div className="add-property-intro-head">
            <span className="add-property-icon" aria-hidden="true">
              📍
            </span>
            <div>
              <strong>Acompanhe e publique o seu património</strong>
              <p>
                Indique o endereço da propriedade. Depois preenche os detalhes e a nossa equipa
                ajuda-o a publicar ou estimar valor em Kz.
              </p>
            </div>
          </div>

          <form className="add-property-address-form" onSubmit={handleConfirm}>
            <p className="field-label">Tipo de propriedade</p>
            <div className="property-type-grid">
              {propertyTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={draft.propertyType === type.value ? 'property-type-chip active' : 'property-type-chip'}
                  onClick={() => updateField('propertyType', type.value)}
                >
                  <span>{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>

            <label className="add-property-search-label">
              Endereço ou referência da propriedade
              <div className="add-property-search-row">
                <span className="search-lupa" aria-hidden="true">
                  🔍
                </span>
                <input
                  required
                  placeholder="Ex.: Rua das Acácias, Talatona, Luanda"
                  value={draft.address}
                  onChange={(event) => updateField('address', event.target.value)}
                />
              </div>
            </label>

            <div className="form-row">
              <label>
                Província
                <select
                  value={draft.province}
                  onChange={(event) => updateField('province', event.target.value)}
                >
                  {Object.keys(provinces).map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                Município (opcional)
                <input
                  placeholder="Ex.: Talatona"
                  value={draft.municipality}
                  onChange={(event) => updateField('municipality', event.target.value)}
                />
              </label>
              <label>
                Bairro (opcional)
                <input
                  placeholder="Ex.: Camama"
                  value={draft.neighborhood}
                  onChange={(event) => updateField('neighborhood', event.target.value)}
                />
              </label>
            </div>

            <button className="button primary add-property-confirm" type="submit">
              Confirmar endereço
            </button>
          </form>
        </div>
      </SectionBlock>
    </main>
  )
}
