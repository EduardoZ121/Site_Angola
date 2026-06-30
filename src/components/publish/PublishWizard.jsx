import { useNavigate } from 'react-router-dom'
import { useMarketplace } from '../../context/MarketplaceContext'
import { usePublishWizard } from '../../hooks/usePublishWizard'
import { getProfilePublishErrors, isProfileReadyToPublish } from '../../utils/profile'
import { clearPublishDraft, PUBLISH_DRAFT_KEY, validateAllPublishSteps } from '../../utils/publishDraft'
import { PublishAutosaveStatus } from './PublishAutosaveStatus'
import { PublishBottomBar } from './PublishBottomBar'
import { PublishHero } from './PublishHero'
import { PublishLivePreview } from './PublishLivePreview'
import { PublishProfileAlert } from './PublishProfileAlert'
import { PublishTimeline } from './PublishTimeline'
import { PublishTipsPanel } from './PublishTipsPanel'
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
  const {
    draft,
    patchDraft,
    setCategory,
    currentStep,
    stepIndex,
    steps,
    errors,
    goNext,
    goBack,
    completion,
    savedLabel,
  } = wizard

  function handlePatch(patch) {
    patchDraft(patch)
  }

  function handlePublish() {
    const stepErrors = validateAllPublishSteps(draft)
    if (stepErrors.length) {
      wizard.setErrors(stepErrors)
      return
    }
    const profileErrors = getProfilePublishErrors(profile)
    if (profileErrors.length) {
      wizard.setErrors(profileErrors)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (editListingId) {
      const wasRejected = listing?.status === 'Rejeitado'
      const updatedId = updateOwnerListing(editListingId, draft)
      if (updatedId) {
        localStorage.removeItem(`${PUBLISH_DRAFT_KEY}.${editListingId}`)
        navigate(wasRejected ? `/publicar/enviado/${editListingId}` : '/painel')
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
        return (
          <LocationStep draft={draft} provinces={provinces} bairros={bairros} onChange={handlePatch} />
        )
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
  const profileReady = isProfileReadyToPublish(profile)

  return (
    <div className="publish-wizard">
      <PublishAutosaveStatus savedLabel={savedLabel} />

      <PublishHero editMode={Boolean(editListingId)} />

      <PublishProfileAlert profile={profile} />

      <PublishTimeline
        steps={steps}
        currentIndex={stepIndex}
        completion={completion}
        onStepClick={(index) => index < stepIndex && wizard.goToStep(index)}
      />

      <div className="publish-layout">
        <div className="publish-main">
          <ValidationSummary errors={errors} />
          <div className="publish-step-shell" key={currentStep.id}>
            {renderStep()}
          </div>
        </div>

        <aside className="publish-aside">
          <PublishLivePreview draft={draft} />
          <PublishTipsPanel />
        </aside>
      </div>

      <PublishBottomBar
        stepIndex={stepIndex}
        totalSteps={steps.length}
        completion={completion}
        isLast={isLast}
        onBack={goBack}
        onNext={goNext}
        onPublish={handlePublish}
        editMode={Boolean(editListingId)}
        canGoBack={stepIndex > 0}
        publishDisabled={isLast && !profileReady}
        publishLabel={
          editListingId && listing?.status === 'Rejeitado' ? 'Reenviar para revisão →' : undefined
        }
      />
    </div>
  )
}
