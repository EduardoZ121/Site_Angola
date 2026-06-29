import { useCallback, useEffect, useState } from 'react'
import { PUBLISH_STEPS } from '../constants/publishCategories'
import {
  applyCategoryToDraft,
  createEmptyPublishDraft,
  draftCompletionPercent,
  readPublishDraft,
  validatePublishStep,
  writePublishDraft,
  PUBLISH_DRAFT_KEY,
} from '../utils/publishDraft'
import { rawListingToPublishDraft } from '../utils/ownerListing'

export function usePublishWizard({ editListingId, listing } = {}) {
  const storageKey = editListingId ? `${PUBLISH_DRAFT_KEY}.${editListingId}` : PUBLISH_DRAFT_KEY

  const [draft, setDraft] = useState(() => {
    if (editListingId && listing) return rawListingToPublishDraft(listing)
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) return { ...createEmptyPublishDraft(), ...JSON.parse(raw) }
    } catch {
      /* ignore */
    }
    return readPublishDraft()
  })
  const [errors, setErrors] = useState([])
  const [savedNotice, setSavedNotice] = useState(false)

  const stepIndex = Math.min(Math.max(draft.step || 0, 0), PUBLISH_STEPS.length - 1)
  const currentStep = PUBLISH_STEPS[stepIndex]
  const completion = draftCompletionPercent(draft)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ ...draft, lastSavedAt: new Date().toISOString() }))
    setSavedNotice(true)
    const timer = setTimeout(() => setSavedNotice(false), 2500)
    return () => clearTimeout(timer)
  }, [draft, storageKey])

  const patchDraft = useCallback((patch) => {
    setDraft((prev) => ({ ...prev, ...patch, step: patch.step ?? prev.step }))
  }, [])

  const setCategory = useCallback((listingCategory) => {
    setDraft((prev) => applyCategoryToDraft(prev, listingCategory))
  }, [])

  const goNext = useCallback(() => {
    const stepErrors = validatePublishStep(currentStep.id, draft)
    setErrors(stepErrors)
    if (stepErrors.length) return false
    setDraft((prev) => ({ ...prev, step: Math.min(prev.step + 1, PUBLISH_STEPS.length - 1) }))
    setErrors([])
    return true
  }, [currentStep.id, draft])

  const goBack = useCallback(() => {
    setErrors([])
    setDraft((prev) => ({ ...prev, step: Math.max(prev.step - 1, 0) }))
  }, [])

  const goToStep = useCallback((index) => {
    setErrors([])
    setDraft((prev) => ({ ...prev, step: index }))
  }, [])

  const resetDraft = useCallback(() => {
    const fresh = createEmptyPublishDraft()
    setDraft(fresh)
    writePublishDraft(fresh)
    setErrors([])
  }, [])

  return {
    draft,
    patchDraft,
    setCategory,
    stepIndex,
    currentStep,
    steps: PUBLISH_STEPS,
    errors,
    setErrors,
    goNext,
    goBack,
    goToStep,
    resetDraft,
    completion,
    savedNotice,
    validateCurrentStep: () => validatePublishStep(currentStep.id, draft),
  }
}
