import { Link, useNavigate } from 'react-router-dom'
import { useMarketplace } from '../../context/MarketplaceContext'
import { usePublishWizard } from '../../hooks/usePublishWizard'
import { clearPublishDraft, PUBLISH_DRAFT_KEY } from '../../utils/publishDraft'
import { StepIndicator } from './StepIndicator'
import { ValidationSummary } from './ValidationSummary'
import { CategoryStep } from './CategoryStep'
import { BasicInfoStep } from './BasicInfoStep'
import { LocationStep } from './LocationStep'
import { FeaturesStep } from './FeaturesStep'
import { MediaStep } from './MediaStep'
import { PricingStep } from './PricingStep'
import { ContactStep } from './ContactStep'
import { PreviewStep } from './PreviewStep'
import '../../styles/publish.css'

export function PublishWizard({ editListingId }) {
  const navigate = useNavigate()
  const { profile, provinces, bairros, submitListingDraft, updateOwnerListing, getListing } = useMarketplace()
  const listing = editListingId ? getListing(editListingId) : null
  const wizard = usePublishWizard({ editListingId, listing })
  const { draft, patchDraft, setCategory, currentStep, stepIndex, steps, errors, goNext, goBack, completion, savedNotice } =
    wizard

  function handlePatch(patch) {
    patchDraft(patch)
  }

  function handlePublish() {
    const stepErrors = wizard.validateCurrentStep()
    if (stepErrors.length) {
      wizard.setErrors(stepErrors)
      return
    }
    if (!profile.name || !profile.phone) {
      wizard.setErrors(['Complete o perfil (nome e telefone) em Minha conta.'])
      return
    }
    if (editListingId) {
      const updatedId = updateOwnerListing(editListingId, draft)
      if (updatedId) {
        localStorage.removeItem(`${PUBLISH_DRAFT_KEY}.${editListingId}`)
        navigate('/painel')
      }
      return
    }
    const newId = submitListingDraft(draft)
    if (newId) {
      clearPublishDraft()
      navigate(`/publicar/enviado/${newId}`)
    }
  }

  function renderStep() {
    switch (currentStep.id) {
      case 'category':
        return <CategoryStep draft={draft} onSelect={setCategory} />
      case 'basic':
        return <BasicInfoStep draft={draft} onChange={handlePatch} />
      case 'location':
        return <LocationStep draft={draft} provinces={provinces} bairros={bairros} onChange={handlePatch} />
      case 'features':
        return <FeaturesStep draft={draft} onChange={handlePatch} />
      case 'media':
        return <MediaStep draft={draft} onChange={handlePatch} />
      case 'pricing':
        return <PricingStep draft={draft} onChange={handlePatch} />
      case 'contact':
        return <ContactStep draft={draft} profile={profile} onChange={handlePatch} />
      case 'preview':
        return <PreviewStep draft={draft} profile={profile} />
      default:
        return null
    }
  }

  const isLast = stepIndex === steps.length - 1

  return (
    <div className="publish-wizard">
      <header className="publish-wizard-header">
        <div>
          <p className="eyebrow">{editListingId ? 'Editar anúncio' : 'Publicar'}</p>
          <h1>{editListingId ? 'Actualizar anúncio' : 'Publicação profissional de anúncios'}</h1>
          <p>
            {editListingId
              ? 'Altere os dados e guarde — anúncios activos voltam à fila de revisão.'
              : 'Fluxo guiado — pode sair e continuar mais tarde. O progresso é guardado automaticamente.'}
          </p>
        </div>
        {savedNotice ? <span className="publish-autosave">Rascunho guardado automaticamente</span> : null}
      </header>

      {!profile.name || !profile.phone ? (
        <div className="panel-card publish-profile-alert">
          <p>Complete nome e telefone antes de publicar.</p>
          <Link className="button primary" to="/conta">
            Ir para Minha conta
          </Link>
        </div>
      ) : null}

      <StepIndicator
        steps={steps}
        currentIndex={stepIndex}
        completion={completion}
        onStepClick={(index) => index < stepIndex && wizard.goToStep(index)}
      />

      <ValidationSummary errors={errors} />
      {renderStep()}

      <div className="publish-nav">
        <button type="button" className="button ghost" onClick={goBack} disabled={stepIndex === 0}>
          Anterior
        </button>
        {isLast ? (
          <button type="button" className="button primary" onClick={handlePublish}>
            {editListingId ? 'Guardar alterações' : 'Publicar — enviar para revisão'}
          </button>
        ) : (
          <button type="button" className="button primary ui-btn-arrow" onClick={goNext}>
            Seguinte
          </button>
        )}
      </div>
    </div>
  )
}
