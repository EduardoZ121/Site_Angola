import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  buyerOperations,
  buyerPropertyTypes,
  defaultBuyerPrefs,
  provinces,
  userRoles,
} from '../data/constants'
import { useMarketplace } from '../context/MarketplaceContext'

const steps = [
  { id: 1, title: 'O que procura?' },
  { id: 2, title: 'Comprar ou arrendar?' },
  { id: 3, title: 'Onde?' },
  { id: 4, title: 'Detalhes' },
  { id: 5, title: 'Pronto!' },
]

export default function BuyerFlowPage() {
  const navigate = useNavigate()
  const { isLoggedIn, profile, completeBuyerOnboarding } = useMarketplace()
  const [step, setStep] = useState(1)
  const [prefs, setPrefs] = useState({ ...defaultBuyerPrefs })

  useEffect(() => {
    if (!isLoggedIn) navigate('/cadastro', { replace: true })
    else if (profile.userRole !== userRoles.buyer) navigate('/inicio', { replace: true })
  }, [isLoggedIn, profile.userRole, navigate])

  function updatePref(key, value) {
    setPrefs((current) => ({ ...current, [key]: value }))
  }

  function nextStep() {
    setStep((current) => Math.min(current + 1, steps.length))
  }

  function prevStep() {
    setStep((current) => Math.max(current - 1, 1))
  }

  function finishFlow() {
    completeBuyerOnboarding(prefs)
    const property = buyerPropertyTypes.find((item) => item.id === prefs.propertyTypeId)
    const operation = buyerOperations.find((item) => item.id === prefs.operationId)

    const params = new URLSearchParams()
    if (prefs.province && prefs.province !== 'Todos') params.set('province', prefs.province)
    if (prefs.maxPrice) params.set('maxPrice', prefs.maxPrice)
    if (property?.propertyType) params.set('propertyType', property.propertyType)
    if (prefs.bedrooms) params.set('bedrooms', prefs.bedrooms)

    let path = '/comprar'
    if (property?.category === 'Veículo') path = '/veiculos'
    else if (operation?.operation === 'Arrendamento') path = '/arrendar'

    navigate(`${path}?${params.toString()}`, { replace: true })
  }

  const selectedProperty = buyerPropertyTypes.find((item) => item.id === prefs.propertyTypeId)
  const selectedOperation = buyerOperations.find((item) => item.id === prefs.operationId)
  const isVehicle = selectedProperty?.category === 'Veículo'

  if (!isLoggedIn || profile.userRole !== userRoles.buyer) return null

  return (
    <div className="onboarding-screen onboarding-flow">
      <div className="onboarding-card onboarding-wide">
        <div className="flow-header">
          <img className="onboarding-logo small" src="/kuteka-logo.svg" alt="Kuteka" />
          <div className="flow-steps" aria-label="Progresso">
            {steps.map((item) => (
              <span
                key={item.id}
                className={`flow-step-dot ${step >= item.id ? 'active' : ''} ${step === item.id ? 'current' : ''}`}
              />
            ))}
          </div>
          <p className="flow-step-label">
            Passo {step} de {steps.length} — {steps[step - 1].title}
          </p>
        </div>

        {step === 1 ? (
          <>
            <h1>Que tipo de imóvel ou veículo deseja?</h1>
            <p className="onboarding-lead">Escolha uma opção para personalizar a sua pesquisa.</p>
            <div className="choice-grid">
              {buyerPropertyTypes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`choice-card ${prefs.propertyTypeId === item.id ? 'selected' : ''}`}
                  onClick={() => {
                    updatePref('propertyTypeId', item.id)
                    if (item.category === 'Veículo') updatePref('operationId', 'comprar')
                    nextStep()
                  }}
                >
                  <span className="choice-icon">{item.icon}</span>
                  <strong>{item.label}</strong>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h1>Pretende comprar ou arrendar?</h1>
            <p className="onboarding-lead">
              {isVehicle
                ? 'Para veículos, normalmente é compra.'
                : 'Escolha como quer usar o imóvel.'}
            </p>
            <div className="choice-grid choice-grid-2">
              {(isVehicle ? buyerOperations.filter((item) => item.id === 'comprar') : buyerOperations).map(
                (item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`choice-card ${prefs.operationId === item.id ? 'selected' : ''}`}
                    onClick={() => {
                      updatePref('operationId', item.id)
                      nextStep()
                    }}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.operation === 'Venda' ? 'Pagamento único em Kz' : 'Mensalidade em Kz'}</span>
                  </button>
                ),
              )}
            </div>
            <button className="text-button flow-back" type="button" onClick={prevStep}>
              ← Voltar
            </button>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h1>Em que província procura?</h1>
            <p className="onboarding-lead">Pode ajustar bairro e preço no passo seguinte.</p>
            <label className="flow-field">
              Província
              <select
                value={prefs.province}
                onChange={(event) => updatePref('province', event.target.value)}
              >
                {Object.keys(provinces).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <div className="flow-actions">
              <button className="button filter-button" type="button" onClick={prevStep}>
                Voltar
              </button>
              <button className="button primary" type="button" onClick={nextStep}>
                Continuar
              </button>
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <h1>Últimos detalhes (opcional)</h1>
            <p className="onboarding-lead">Ajuda-nos a mostrar anúncios mais relevantes.</p>
            <div className="flow-fields">
              <label className="flow-field">
                Preço máximo (Kz)
                <input
                  type="number"
                  placeholder="Ex.: 50000000"
                  value={prefs.maxPrice}
                  onChange={(event) => updatePref('maxPrice', event.target.value)}
                />
              </label>
              {!isVehicle ? (
                <label className="flow-field">
                  Quartos mínimos
                  <select
                    value={prefs.bedrooms}
                    onChange={(event) => updatePref('bedrooms', event.target.value)}
                  >
                    <option value="">Qualquer</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                  </select>
                </label>
              ) : null}
            </div>
            <div className="flow-actions">
              <button className="button filter-button" type="button" onClick={prevStep}>
                Voltar
              </button>
              <button className="button primary" type="button" onClick={nextStep}>
                Ver resumo
              </button>
            </div>
          </>
        ) : null}

        {step === 5 ? (
          <>
            <h1>Perfeito! Vamos mostrar-lhe opções.</h1>
            <div className="flow-summary panel-card">
              <p>
                <strong>Tipo:</strong> {selectedProperty?.label || '—'}
              </p>
              <p>
                <strong>Operação:</strong> {selectedOperation?.label || 'Comprar'}
              </p>
              <p>
                <strong>Província:</strong> {prefs.province}
              </p>
              {prefs.maxPrice ? (
                <p>
                  <strong>Preço máx.:</strong> {Number(prefs.maxPrice).toLocaleString('pt-PT')} Kz
                </p>
              ) : null}
              {prefs.bedrooms ? (
                <p>
                  <strong>Quartos:</strong> {prefs.bedrooms}+
                </p>
              ) : null}
            </div>
            <div className="flow-actions">
              <button className="button filter-button" type="button" onClick={prevStep}>
                Ajustar
              </button>
              <button className="button primary" type="button" onClick={finishFlow}>
                Ver anúncios
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
