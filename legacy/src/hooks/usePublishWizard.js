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

function formatSavedAgo(iso) {
  if (!iso) return 'agora'
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 8) return 'agora'
  if (seconds < 60) return `há ${seconds} segundos`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `há ${minutes} min`
  return `há ${Math.floor(minutes / 60)} h`
}

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
  const [lastSavedAt, setLastSavedAt] = useState(draft.lastSavedAt || null)
  const [savedLabel, setSavedLabel] = useState('agora')

  const stepIndex = Math.min(Math.max(draft.step || 0, 0), PUBLISH_STEPS.length - 1)
  const currentStep = PUBLISH_STEPS[stepIndex]
  const completion = draftCompletionPercent(draft)

  useEffect(() => {
    const savedAt = new Date().toISOString()
    localStorage.setItem(storageKey, JSON.stringify({ ...draft, lastSavedAt: savedAt }))
    setLastSavedAt(savedAt)
  }, [draft, storageKey])

  useEffect(() => {
    setSavedLabel(formatSavedAgo(lastSavedAt))
    const timer = window.setInterval(() => {
      setSavedLabel(formatSavedAgo(lastSavedAt))
    }, 4000)
    return () => window.clearInterval(timer)
  }, [lastSavedAt])

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
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return true
  }, [currentStep.id, draft])

  const goBack = useCallback(() => {
    setErrors([])
    setDraft((prev) => ({ ...prev, step: Math.max(prev.step - 1, 0) }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
    savedLabel,
    validateCurrentStep: () => validatePublishStep(currentStep.id, draft),
  }
}
