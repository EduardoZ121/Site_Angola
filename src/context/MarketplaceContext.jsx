import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  STORAGE_KEYS,
  accountTypes,
  bairros,
  defaultPhoto,
  defaultProfile,
  emptyListing,
  provinces,
  starterListings,
  userRoles,
  defaultBuyerPrefs,
} from '../data/constants'
import { isProfileReadyToPublish } from '../utils/profile'
import { trustSealFromProfile } from '../utils/format'
import { VISIT_STATUS } from '../constants/visits'
import { createVisitId, formatVisitLocation } from '../utils/visits'
import { parseGoogleCredential } from '../utils/googleAuth'
import { draftToRawListing } from '../utils/publishDraft'
import { rawListingToPublishDraft } from '../utils/ownerListing'
import { LISTING_STATUS } from '../constants/listingStatus'
import { getStaffRole, isListingPending, STAFF_ROLES, createSeedApprovedAgents } from '../constants/staff'
import { AGENT_APPLICATION_STATUS } from '../constants/agentApplication'
import {
  buildTestAttempt,
  buildTestLink,
  createApplicationId,
  createTestToken,
  findApplicationByToken,
  findApplicationForProfile,
  gradeTestAttempt,
  validateAgentApplicationPayload,
} from '../utils/agentApplication'
import {
  authenticateAccount,
  buildUserSession,
  readAccounts,
  registerAccount,
  requestPasswordReset as authRequestPasswordReset,
  resetPasswordWithToken as authResetPasswordWithToken,
} from '../services/authService'

const MarketplaceContext = createContext(null)

export function MarketplaceProvider({ children }) {
  const [profile, setProfile] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.profile)
      return raw ? JSON.parse(raw) : defaultProfile
    } catch {
      return defaultProfile
    }
  })
  const [listings, setListings] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.listings)
      return raw ? JSON.parse(raw) : starterListings
    } catch {
      return starterListings
    }
  })
  const [favorites, setFavorites] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.favorites)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [history, setHistory] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.history)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [chatByListing, setChatByListing] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.chats)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })
  const [compare, setCompare] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.compare)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [listingForm, setListingForm] = useState(emptyListing)
  const [siteUsers, setSiteUsers] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.siteUsers)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [notifications, setNotifications] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.notifications)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [accounts, setAccounts] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.accounts)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [buyerPrefs, setBuyerPrefs] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.buyerPrefs)
      return raw ? JSON.parse(raw) : defaultBuyerPrefs
    } catch {
      return defaultBuyerPrefs
    }
  })
  const [approvedAgents, setApprovedAgents] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.approvedAgents)
      return raw ? JSON.parse(raw) : createSeedApprovedAgents()
    } catch {
      return createSeedApprovedAgents()
    }
  })
  const [agentApplications, setAgentApplications] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.agentApplications)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [scheduledVisits, setScheduledVisits] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.scheduledVisits)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const staffRole = getStaffRole(profile.email, approvedAgents)
  const isAdmin = staffRole === STAFF_ROLES.admin
  const isAgent = staffRole === STAFF_ROLES.agent
  const isStaff = Boolean(staffRole)
  const canModerateListings = isStaff

  const isLoggedIn = Boolean(profile.email && (profile.googleId || profile.sessionId))

  const needsRoleSelection = isLoggedIn && !profile.userRole

  const needsBuyerFlow =
    isLoggedIn &&
    profile.userRole === userRoles.buyer &&
    !profile.buyerOnboardingDone

  const isOnboardingComplete =
    isLoggedIn &&
    profile.userRole &&
    (profile.userRole === userRoles.owner || profile.buyerOnboardingDone)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.siteUsers, JSON.stringify(siteUsers))
  }, [siteUsers])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications))
  }, [notifications])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts))
  }, [accounts])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.buyerPrefs, JSON.stringify(buyerPrefs))
  }, [buyerPrefs])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.approvedAgents, JSON.stringify(approvedAgents))
  }, [approvedAgents])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.agentApplications, JSON.stringify(agentApplications))
  }, [agentApplications])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.scheduledVisits, JSON.stringify(scheduledVisits))
  }, [scheduledVisits])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile))
  }, [profile])
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.listings, JSON.stringify(listings))
  }, [listings])
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.compare, JSON.stringify(compare))
  }, [compare])
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history))
  }, [history])
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.chats, JSON.stringify(chatByListing))
  }, [chatByListing])

  useEffect(() => {
    setListings((prev) => {
      const ids = new Set(prev.map((item) => item.id).filter(Boolean))
      const missing = starterListings.filter((item) => !ids.has(item.id))
      return missing.length ? [...prev, ...missing] : prev
    })
  }, [])

  const adminStats = useMemo(
    () => ({
      total: listings.length,
      active: listings.filter((listing) => listing.status === 'Ativo').length,
      pending: listings.filter((listing) => isListingPending(listing)).length,
      featured: listings.filter((listing) => listing.featured).length,
    }),
    [listings],
  )

  const staffBadges = useMemo(() => {
    const pendingListings = listings.filter((listing) => isListingPending(listing)).length
    const agentQueue = agentApplications.filter((item) =>
      [
        AGENT_APPLICATION_STATUS.SUBMITTED,
        AGENT_APPLICATION_STATUS.INVITED,
        AGENT_APPLICATION_STATUS.PASSED,
      ].includes(item.status),
    ).length
    const upcomingVisits = scheduledVisits.filter(
      (visit) => visit.status === VISIT_STATUS.SCHEDULED && new Date(visit.scheduledAt) >= new Date(),
    ).length
    return {
      pendingListings,
      agentQueue,
      upcomingVisits,
      adminTotal: pendingListings + agentQueue,
      agentTotal: pendingListings + upcomingVisits,
    }
  }, [listings, agentApplications, scheduledVisits])

  function updateListingField(key, value) {
    setListingForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'province') {
        const municipality = provinces[value]?.[0] || ''
        next.municipality = municipality
        next.neighborhood = bairros[municipality]?.[0] || ''
      }
      if (key === 'municipality') {
        next.neighborhood = bairros[value]?.[0] || ''
      }
      return next
    })
  }

  function handlePhotoUpload(event) {
    const files = Array.from(event.target.files).slice(0, 5)
    if (!files.length) return

    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(file)
          }),
      ),
    ).then((photos) => {
      setListingForm((current) => ({ ...current, photos }))
    })
  }

  function registerSiteUser(user) {
    setSiteUsers((prev) => {
      const existing = prev.find((entry) => entry.email === user.email)
      const entry = {
        email: user.email,
        name: user.name,
        picture: user.picture || '',
        googleId: user.googleId || '',
        authProvider: user.authProvider || 'email',
        firstLoginAt: existing?.firstLoginAt || new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        loginCount: (existing?.loginCount || 0) + 1,
      }
      return [entry, ...prev.filter((entry) => entry.email !== user.email)]
    })
  }

  function startSession(user, authProvider) {
    registerSiteUser({ ...user, authProvider })

    setProfile((current) => ({
      ...current,
      name: user.name || current.name,
      email: user.email,
      googleId: user.googleId || '',
      sessionId: user.sessionId || current.sessionId,
      picture: user.picture || current.picture,
      avatar: user.avatar || user.picture || current.avatar,
      emailVerified: user.emailVerified ?? current.emailVerified,
      phoneVerified: user.phoneVerified ?? current.phoneVerified,
      documentsVerified: user.documentsVerified ?? current.documentsVerified,
      verified: user.verified ?? current.verified,
      role: user.role ?? current.role,
      subscription: user.subscription ?? current.subscription,
      preferredProvince: user.preferredProvince ?? current.preferredProvince,
      language: user.language ?? current.language,
      currency: user.currency ?? current.currency,
      createdAt: user.createdAt || current.createdAt || new Date().toISOString(),
      authProvider,
      verifiedProfile: user.emailVerified || current.verifiedProfile,
    }))

    addNotification({
      type: 'account_welcome',
      ownerName: user.name,
      ownerEmail: user.email,
      title: 'Bem-vindo ao Kuteka',
      body: `Olá, ${user.name}! Complete o seu perfil para começar a comprar ou publicar em Angola.`,
    })
  }

  function registerWithEmail({ name, email, password }) {
    const result = registerAccount({ name, email, password })
    if (!result.ok) return result

    setAccounts(readAccounts())
    startSession(result.session, 'email')
    return { ok: true }
  }

  function loginWithEmail({ email, password }) {
    const result = authenticateAccount({ email, password })
    if (!result.ok) return result

    startSession(result.session, 'email')
    return { ok: true }
  }

  function requestPasswordReset(email) {
    return authRequestPasswordReset(email)
  }

  function resetPasswordWithToken({ token, password, confirmPassword }) {
    const result = authResetPasswordWithToken({ token, password, confirmPassword })
    if (!result.ok) return result

    setAccounts(readAccounts())
    startSession(result.session, 'email')
    return { ok: true }
  }

  function loginWithGoogle(credential) {
    const googleUser = parseGoogleCredential(credential)
    if (!googleUser?.email) return false

    startSession(
      buildUserSession({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.googleId,
        picture: googleUser.picture,
        emailVerified: googleUser.emailVerified,
      }),
      'google',
    )

    return true
  }

  function setUserRole(role) {
    setProfile((current) => ({
      ...current,
      userRole: role,
      role,
      buyerOnboardingDone: role === userRoles.owner ? true : current.buyerOnboardingDone,
    }))
  }

  function completeBuyerOnboarding(prefs) {
    setBuyerPrefs(prefs)
    setProfile((current) => ({
      ...current,
      buyerOnboardingDone: true,
    }))
  }

  function getDefaultRoute() {
    return '/inicio'
  }

  function logoutAccount() {
    setProfile({ ...defaultProfile })
    setBuyerPrefs(defaultBuyerPrefs)
  }

  function addNotification(entry) {
    const item = {
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      read: false,
      emailSent: true,
      createdAt: new Date().toISOString(),
      ...entry,
    }
    setNotifications((prev) => [item, ...prev])
    return item
  }

  function isListingOwner(listing) {
    if (!listing) return false
    if (profile.email && listing.ownerEmail && profile.email === listing.ownerEmail) return true
    return listing.ownerName === profile.name && listing.phone === profile.phone
  }

  function getMyListings() {
    return listings.filter((listing) => isListingOwner(listing))
  }

  function getMyNotifications() {
    if (!profile.email) return notifications.filter((item) => item.ownerName === profile.name)
    return notifications.filter(
      (item) => item.ownerEmail === profile.email || item.ownerName === profile.name,
    )
  }

  function markNotificationRead(notificationId) {
    setNotifications((prev) =>
      prev.map((item) => (item.id === notificationId ? { ...item, read: true } : item)),
    )
  }

  function markAllNotificationsRead() {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
  }

  function duplicateListing(listingId) {
    const listing = listings.find((item) => item.id === listingId)
    if (!listing || !isListingOwner(listing)) return null
    const newId = `l-${Date.now()}`
    const copy = {
      ...listing,
      id: newId,
      title: `${listing.title} (cópia)`,
      status: 'Pendente',
      listingStatus: LISTING_STATUS.UNDER_REVIEW,
      featured: false,
      featuredUntil: undefined,
      views: 0,
      createdAt: new Date().toISOString().slice(0, 10),
      submittedAt: new Date().toISOString(),
      approvedAt: undefined,
      rejectedAt: undefined,
      rejectReason: undefined,
    }
    setListings((prev) => [copy, ...prev])
    addNotification({
      type: 'listing_pending',
      listingId: newId,
      ownerName: profile.name,
      ownerEmail: profile.email || '',
      title: 'Cópia enviada para revisão',
      body: `A cópia "${copy.title}" aguarda aprovação antes de ficar pública.`,
    })
    return newId
  }

  function pauseListing(listingId) {
    const listing = listings.find((item) => item.id === listingId)
    if (!listing || !isListingOwner(listing)) return
    updateListing(listingId, {
      status: 'Pausado',
      listingStatus: LISTING_STATUS.ARCHIVED,
      pausedAt: new Date().toISOString(),
    })
  }

  function activateListing(listingId) {
    const listing = listings.find((item) => item.id === listingId)
    if (!listing || !isListingOwner(listing)) return
    updateListing(listingId, {
      status: 'Ativo',
      listingStatus: LISTING_STATUS.ACTIVE,
      pausedAt: undefined,
    })
  }

  function archiveListing(listingId) {
    const listing = listings.find((item) => item.id === listingId)
    if (!listing || !isListingOwner(listing)) return
    updateListing(listingId, {
      status: 'Pausado',
      listingStatus: LISTING_STATUS.ARCHIVED,
      archivedAt: new Date().toISOString(),
    })
  }

  function renewFeatured(listingId) {
    const listing = listings.find((item) => item.id === listingId)
    if (!listing || !isListingOwner(listing)) return
    const until = new Date()
    until.setDate(until.getDate() + 30)
    updateListing(listingId, {
      featured: true,
      featuredUntil: until.toISOString().slice(0, 10),
    })
    addNotification({
      type: 'featured_renewed',
      listingId,
      ownerName: profile.name,
      ownerEmail: profile.email || '',
      title: 'Destaque activado',
      body: `O anúncio "${listing.title}" está em destaque até ${until.toISOString().slice(0, 10)}.`,
    })
  }

  function updateOwnerListing(listingId, draft) {
    const existing = listings.find((item) => item.id === listingId)
    if (!existing || !isListingOwner(existing)) return null
    const payload = draftToRawListing(draft, profile)
    const wasRejected = existing.status === 'Rejeitado'
    const needsReview = existing.status === 'Ativo' || wasRejected
    updateListing(listingId, {
      ...payload,
      id: listingId,
      status: needsReview ? 'Pendente' : existing.status,
      listingStatus: needsReview ? LISTING_STATUS.UNDER_REVIEW : existing.listingStatus,
      updatedAt: new Date().toISOString(),
      submittedAt: needsReview ? new Date().toISOString() : existing.submittedAt,
      views: existing.views || 0,
      featured: existing.featured,
      featuredUntil: existing.featuredUntil,
      approvedAt: needsReview ? undefined : existing.approvedAt,
      rejectReason: wasRejected ? undefined : existing.rejectReason,
      rejectedAt: wasRejected ? undefined : existing.rejectedAt,
    })
    if (needsReview) {
      addNotification({
        type: 'listing_pending',
        listingId,
        ownerName: profile.name,
        ownerEmail: profile.email || '',
        title: wasRejected ? 'Anúncio corrigido — nova revisão' : 'Alterações enviadas para revisão',
        body: wasRejected
          ? `O anúncio "${payload.title}" foi reenviado e aguarda aprovação.`
          : `O anúncio "${payload.title}" será revisto antes de voltar a ficar público.`,
      })
      if (wasRejected) {
        addNotification({
          type: 'staff_listing_pending',
          audience: 'staff',
          listingId,
          title: 'Anúncio reenviado após rejeição',
          body: `"${payload.title}" de ${profile.name} voltou à fila de aprovação.`,
        })
      }
    }
    return listingId
  }

  function submitListingDraft(draft) {
    if (!isProfileReadyToPublish(profile)) return null
    const payload = draftToRawListing(draft, profile)
    setListings((prev) => [payload, ...prev])

    addNotification({
      type: 'listing_pending',
      listingId: payload.id,
      ownerName: profile.name,
      ownerEmail: profile.email || '',
      title: 'Anúncio enviado — aguarda aprovação',
      body: `O seu anúncio "${payload.title}" foi recebido. A equipa Kuteka vai rever fotos e dados antes de publicar no site.`,
    })

    addNotification({
      type: 'staff_listing_pending',
      audience: 'staff',
      listingId: payload.id,
      ownerName: profile.name,
      ownerEmail: profile.email || '',
      title: 'Novo anúncio na fila',
      body: `"${payload.title}" de ${profile.name} aguarda aprovação.`,
    })

    return payload.id
  }

  function submitListing(event) {
    event.preventDefault()
    if (!profile.name || !profile.phone || !listingForm.title || !listingForm.price) return null
    if (!listingForm.photos.length) return null

    const listingId = `l-${Date.now()}`
    const base = {
      id: listingId,
      category: listingForm.category,
      operation: listingForm.operation,
      title: listingForm.title,
      price: Number(listingForm.price),
      province: listingForm.province,
      municipality: listingForm.municipality,
      neighborhood: listingForm.neighborhood,
      ownerName: profile.name,
      ownerEmail: profile.email || '',
      ownerType: profile.type,
      phone: profile.phone,
      verifiedProfile: profile.verifiedProfile,
      verifiedPhone: profile.verifiedPhone,
      verifiedDocument: profile.verifiedDocument,
      trustSeal: trustSealFromProfile(profile),
      status: 'Pendente',
      listingStatus: 'UNDER_REVIEW',
      featured: false,
      description: listingForm.description,
      photos: listingForm.photos,
      lat: Number((Math.random() * 0.85 + 0.08).toFixed(2)),
      lng: Number((Math.random() * 0.85 + 0.08).toFixed(2)),
      createdAt: new Date().toISOString().slice(0, 10),
      submittedAt: new Date().toISOString(),
    }

    const payload =
      listingForm.category === 'Imóvel'
        ? {
            ...base,
            propertyType: listingForm.propertyType,
            bedrooms: Number(listingForm.bedrooms || 0),
            bathrooms: Number(listingForm.bathrooms || 0),
            area: Number(listingForm.area || 0),
          }
        : {
            ...base,
            brand: listingForm.brand,
            model: listingForm.model,
            year: Number(listingForm.year || 0),
            mileage: Number(listingForm.mileage || 0),
            fuel: listingForm.fuel,
            gearbox: listingForm.gearbox,
            condition: listingForm.condition,
          }

    setListings((prev) => [payload, ...prev])
    setListingForm(emptyListing)

    addNotification({
      type: 'listing_pending',
      listingId,
      ownerName: profile.name,
      ownerEmail: profile.email || '',
      title: 'Anúncio enviado — aguarda aprovação',
      body: `O seu anúncio "${payload.title}" foi recebido. A nossa equipa vai rever fotos e dados antes de publicar no site.`,
    })

    return listingId
  }

  function trackView(listingId) {
    setHistory((prev) => [listingId, ...prev.filter((id) => id !== listingId)].slice(0, 20))
    setListings((prev) =>
      prev.map((listing) =>
        listing.id === listingId ? { ...listing, views: (listing.views || 0) + 1 } : listing,
      ),
    )
  }

  function toggleFavorite(id) {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    )
  }

  function clearFavorites() {
    setFavorites([])
  }

  function pruneStaleFavorites() {
    setFavorites((prev) => prev.filter((id) => listings.some((listing) => listing.id === id)))
  }

  function toggleCompare(id) {
    setCompare((prev) => {
      if (prev.includes(id)) return prev.filter((value) => value !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  function clearCompare() {
    setCompare([])
  }

  function pruneStaleCompare() {
    setCompare((prev) => prev.filter((id) => listings.some((listing) => listing.id === id)))
  }

  function sendChat(listingId, messageText, senderName) {
    const message = {
      who: senderName || profile.name || 'Comprador',
      text: messageText.trim(),
      at: new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
    setChatByListing((prev) => ({
      ...prev,
      [listingId]: [...(prev[listingId] || []), message],
    }))
  }

  function updateListing(listingId, patch) {
    setListings((prev) =>
      prev.map((listing) =>
        listing.id === listingId ? { ...listing, ...patch } : listing,
      ),
    )
  }

  function deleteListing(listingId) {
    const listing = listings.find((item) => item.id === listingId)
    if (!listing) return

    if (isAdmin) {
      setListings((prev) => prev.filter((item) => item.id !== listingId))
      return
    }

    if (!isListingOwner(listing)) return
    if (!['Rejeitado', 'Pausado'].includes(listing.status)) return

    setListings((prev) => prev.filter((item) => item.id !== listingId))
  }

  function approveListing(listingId) {
    const listing = listings.find((item) => item.id === listingId)
    if (!listing) return
    if (!canModerateListings) return

    const now = new Date().toISOString()
    const approverLabel = isAdmin ? 'administrador' : 'agente Kuteka'

    updateListing(listingId, {
      status: 'Ativo',
      listingStatus: LISTING_STATUS.ACTIVE,
      approvedAt: now,
      publishedAt: now,
      approvedBy: profile.email,
      approvedByName: profile.name,
    })

    addNotification({
      type: 'listing_approved',
      listingId,
      ownerName: listing.ownerName,
      ownerEmail: listing.ownerEmail || '',
      title: 'Parabéns! O seu anúncio foi publicado',
      body: `O anúncio "${listing.title}" foi aprovado pela ${approverLabel} e já está visível no Kuteka.`,
    })
  }

  function rejectListing(listingId, reason = '') {
    const listing = listings.find((item) => item.id === listingId)
    if (!listing) return
    if (!canModerateListings) return

    updateListing(listingId, {
      status: 'Rejeitado',
      listingStatus: LISTING_STATUS.REJECTED,
      rejectedAt: new Date().toISOString(),
      rejectReason:
        reason ||
        'Conteúdo não conforme (fotos pessoais, informação incorrecta ou fora das regras do marketplace).',
    })

    addNotification({
      type: 'listing_rejected',
      listingId,
      ownerName: listing.ownerName,
      ownerEmail: listing.ownerEmail || '',
      title: 'Anúncio não aprovado',
      body: `O anúncio "${listing.title}" não foi publicado. Motivo: ${reason || 'conteúdo não conforme com as regras Kuteka'}. Pode corrigir e enviar novamente.`,
    })
  }

  function getListing(id) {
    if (!id) return undefined
    return listings.find(
      (listing) =>
        listing.id === id ||
        listing.slug === id ||
        listing.reference === id ||
        String(listing.id).toLowerCase() === String(id).toLowerCase(),
    )
  }

  function submitAgentApplication(payload = {}) {
    if (!profile.email || !profile.name) return { error: 'Complete nome e email no perfil.' }

    const description = (payload.description || payload.message || '').trim()
    const cvText = payload.cvText?.trim() || ''
    const cvFileName = payload.cvFileName?.trim() || ''
    const cvFileData = payload.cvFileData || ''

    const validationErrors = validateAgentApplicationPayload({ description, cvFileData, cvFileName })
    if (validationErrors.length) return { error: validationErrors.join(' ') }

    const existing = findApplicationForProfile(agentApplications, profile)
    if (existing && existing.status !== AGENT_APPLICATION_STATUS.REJECTED) {
      return { application: existing }
    }

    const application = {
      id: createApplicationId(),
      email: profile.email.trim().toLowerCase(),
      username: profile.name.trim(),
      phone: profile.phone || '',
      description,
      message: description,
      cvText,
      cvFileName,
      cvFileData,
      status: AGENT_APPLICATION_STATUS.SUBMITTED,
      createdAt: new Date().toISOString(),
      testToken: null,
      testSentAt: null,
      testAttempt: null,
      approvedAt: null,
      approvedBy: null,
      rejectedAt: null,
      rejectedBy: null,
      rejectReason: '',
    }

    setAgentApplications((prev) => [application, ...prev.filter((item) => item.id !== existing?.id)])

    addNotification({
      type: 'staff_agent_application',
      audience: 'staff',
      title: 'Nova candidatura a agente',
      body: `${profile.name} (${profile.email}) enviou apresentação e ${cvText || cvFileName ? 'CV' : 'sem CV'}.`,
    })

    addNotification({
      type: 'agent_application_received',
      ownerEmail: profile.email,
      ownerName: profile.name,
      title: 'Candidatura recebida',
      body: 'A administração Kuteka vai analisar a sua apresentação. Receberá o link do teste por email ou aqui em «Seja agente».',
    })

    return { application }
  }

  function adminCreateAgentCandidate({ email, username = '', phone = '', note = '' }) {
    if (!isAdmin) return null
    const normalizedEmail = email?.trim().toLowerCase()
    if (!normalizedEmail) return null

    const existing = agentApplications.find((item) => item.email === normalizedEmail)
    if (existing) return existing

    const application = {
      id: createApplicationId(),
      email: normalizedEmail,
      username: username.trim() || normalizedEmail.split('@')[0],
      phone: phone.trim(),
      message: note.trim() || 'Convite manual do administrador.',
      description: '',
      cvText: '',
      cvFileName: '',
      cvFileData: '',
      status: AGENT_APPLICATION_STATUS.SUBMITTED,
      createdAt: new Date().toISOString(),
      testToken: null,
      testSentAt: null,
      testAttempt: null,
      approvedAt: null,
      approvedBy: null,
      rejectedAt: null,
      rejectedBy: null,
      rejectReason: '',
    }

    setAgentApplications((prev) => [application, ...prev])
    return application
  }

  function adminSendAgentTest(applicationId) {
    if (!isAdmin) return null
    const application = agentApplications.find((item) => item.id === applicationId)
    if (!application) return null
    if (application.status === AGENT_APPLICATION_STATUS.APPROVED) return null

    const token = createTestToken()
    const testSentAt = new Date().toISOString()
    const link = buildTestLink(token)

    setAgentApplications((prev) =>
      prev.map((item) =>
        item.id === applicationId
          ? {
              ...item,
              status: AGENT_APPLICATION_STATUS.INVITED,
              testToken: token,
              testSentAt,
              testAttempt: buildTestAttempt(),
            }
          : item,
      ),
    )

    addNotification({
      type: 'agent_test_invite',
      ownerEmail: application.email,
      ownerName: application.username,
      title: 'Convite para teste de agente Kuteka',
      body: `Complete a avaliação de intermediário: ${link}`,
    })

    return { token, link }
  }

  function submitAgentTest(token, answers) {
    const application = findApplicationByToken(agentApplications, token)
    if (!application) return { error: 'Convite inválido ou expirado.' }
    if (application.testAttempt?.submittedAt) return { error: 'Este teste já foi submetido.' }
    if (!profile.email) return { error: 'Inicie sessão com o email da candidatura.' }

    const profileEmail = profile.email.trim().toLowerCase()
    if (profileEmail !== application.email) {
      return { error: 'Entre com o mesmo email associado à candidatura.' }
    }

    const attempt = gradeTestAttempt({
      ...(application.testAttempt || buildTestAttempt()),
      answers,
    })

    const nextStatus = attempt.passed
      ? AGENT_APPLICATION_STATUS.PASSED
      : AGENT_APPLICATION_STATUS.FAILED

    setAgentApplications((prev) =>
      prev.map((item) =>
        item.id === application.id ? { ...item, status: nextStatus, testAttempt: attempt } : item,
      ),
    )

    addNotification({
      type: attempt.passed ? 'agent_test_passed' : 'agent_test_failed',
      ownerEmail: application.email,
      ownerName: application.username,
      title: attempt.passed ? 'Teste aprovado' : 'Teste reprovado',
      body: attempt.passed
        ? `Obteve ${attempt.score}/25. A administração Kuteka vai confirmar a sua admissão.`
        : `Obteve ${attempt.score}/25. Pode tentar novamente quando a administração reenviar o convite.`,
    })

    addNotification({
      type: 'staff_agent_test_result',
      audience: 'staff',
      applicationId: application.id,
      title: attempt.passed ? 'Candidato aprovou teste' : 'Candidato reprovou teste',
      body: `${application.username} (${application.email}): ${attempt.score}/25.`,
    })

    return { applicationId: application.id, attempt }
  }

  function adminApproveAgent(applicationId) {
    if (!isAdmin) return null
    const application = agentApplications.find((item) => item.id === applicationId)
    if (!application) return null

    const now = new Date().toISOString()
    setApprovedAgents((prev) => {
      const exists = prev.some((item) => item.email === application.email)
      if (exists) return prev
      return [
        {
          email: application.email,
          name: application.username,
          phone: application.phone,
          approvedAt: now,
          approvedBy: profile.email,
          applicationId: application.id,
        },
        ...prev,
      ]
    })

    setAgentApplications((prev) =>
      prev.map((item) =>
        item.id === applicationId
          ? { ...item, status: AGENT_APPLICATION_STATUS.APPROVED, approvedAt: now, approvedBy: profile.email }
          : item,
      ),
    )

    addNotification({
      type: 'agent_approved',
      ownerEmail: application.email,
      ownerName: application.username,
      title: 'Foi aprovado como agente Kuteka',
      body: 'Já pode aceder ao painel de agente e aprovar anúncios, responder clientes e planear visitas.',
    })

    return application.email
  }

  function adminRejectAgent(applicationId, reason = '') {
    if (!isAdmin) return null
    const application = agentApplications.find((item) => item.id === applicationId)
    if (!application) return null

    const now = new Date().toISOString()
    setAgentApplications((prev) =>
      prev.map((item) =>
        item.id === applicationId
          ? {
              ...item,
              status: AGENT_APPLICATION_STATUS.REJECTED,
              rejectedAt: now,
              rejectedBy: profile.email,
              rejectReason: reason || 'Candidatura não aprovada pela administração.',
            }
          : item,
      ),
    )

    setApprovedAgents((prev) => prev.filter((item) => item.email !== application.email))

    addNotification({
      type: 'agent_rejected',
      ownerEmail: application.email,
      ownerName: application.username,
      title: 'Candidatura a agente não aprovada',
      body: reason || 'Contacte a administração Kuteka para mais informações.',
    })
  }

  function adminRevokeAgent(email) {
    if (!isAdmin) return
    const normalized = email?.trim().toLowerCase()
    setApprovedAgents((prev) => prev.filter((item) => item.email !== normalized))
  }

  function adminResetAgentTest(applicationId) {
    if (!isAdmin) return null
    return adminSendAgentTest(applicationId)
  }

  function getAgentApplicationByToken(token) {
    return findApplicationByToken(agentApplications, token)
  }

  function getMyAgentApplication() {
    if (!profile.email) return null
    return findApplicationForProfile(agentApplications, profile)
  }

  function scheduleVisit(payload) {
    if (!canModerateListings) return { error: 'Sem permissão.' }
    const listing = listings.find((item) => item.id === payload.listingId)
    if (!listing) return { error: 'Anúncio não encontrado.' }

    const when = new Date(payload.scheduledAt)
    if (Number.isNaN(when.getTime())) return { error: 'Data inválida.' }

    const visit = {
      id: createVisitId(),
      listingId: listing.id,
      listingTitle: listing.title,
      agentEmail: profile.email?.trim().toLowerCase(),
      agentName: profile.name,
      agentPhone: profile.phone || '',
      ownerName: listing.ownerName,
      ownerEmail: listing.ownerEmail || '',
      ownerPhone: listing.phone,
      buyerName: payload.buyerName || '',
      buyerPhone: payload.buyerPhone || '',
      scheduledAt: payload.scheduledAt,
      durationMinutes: payload.durationMinutes || 60,
      notes: payload.notes || '',
      location: formatVisitLocation(listing),
      status: VISIT_STATUS.SCHEDULED,
      createdAt: new Date().toISOString(),
    }

    setScheduledVisits((prev) => [visit, ...prev])

    const whenLabel = when.toLocaleString('pt-PT')
    addNotification({
      type: 'visit_scheduled',
      listingId: listing.id,
      visitId: visit.id,
      ownerName: listing.ownerName,
      ownerEmail: listing.ownerEmail || '',
      title: 'Visita agendada ao seu anúncio',
      body: `${profile.name} marcou visita para ${whenLabel} em ${visit.location}. Confirme disponibilidade.`,
      emailSent: Boolean(listing.ownerEmail),
    })

    addNotification({
      type: 'staff_visit_scheduled',
      audience: 'staff',
      visitId: visit.id,
      title: 'Visita agendada',
      body: `${listing.title} — ${whenLabel}`,
    })

    return { visit, listing }
  }

  function cancelVisit(visitId) {
    if (!canModerateListings) return
    const visit = scheduledVisits.find((item) => item.id === visitId)
    if (!visit) return

    setScheduledVisits((prev) =>
      prev.map((item) =>
        item.id === visitId ? { ...item, status: VISIT_STATUS.CANCELLED, cancelledAt: new Date().toISOString() } : item,
      ),
    )

    if (visit.ownerEmail || visit.ownerName) {
      addNotification({
        type: 'visit_cancelled',
        visitId,
        ownerName: visit.ownerName,
        ownerEmail: visit.ownerEmail,
        title: 'Visita cancelada',
        body: `A visita a «${visit.listingTitle}» (${new Date(visit.scheduledAt).toLocaleString('pt-PT')}) foi cancelada.`,
        emailSent: Boolean(visit.ownerEmail),
      })
    }
  }

  function completeVisit(visitId) {
    if (!canModerateListings) return
    setScheduledVisits((prev) =>
      prev.map((item) =>
        item.id === visitId ? { ...item, status: VISIT_STATUS.COMPLETED, completedAt: new Date().toISOString() } : item,
      ),
    )
  }

  function getAgentVisits() {
    const email = profile.email?.trim().toLowerCase()
    if (!email) return scheduledVisits
    return scheduledVisits.filter((visit) => visit.agentEmail === email || isAdmin)
  }

  function getMyVisits() {
    const email = profile.email?.trim().toLowerCase()
    if (!email) return []
    return scheduledVisits.filter((visit) => visit.ownerEmail?.toLowerCase() === email)
  }

  const value = {
    profile,
    setProfile,
    isLoggedIn,
    isAdmin,
    isAgent,
    isStaff,
    staffRole,
    canModerateListings,
    needsRoleSelection,
    needsBuyerFlow,
    isOnboardingComplete,
    loginWithGoogle,
    registerWithEmail,
    loginWithEmail,
    requestPasswordReset,
    resetPasswordWithToken,
    setUserRole,
    completeBuyerOnboarding,
    getDefaultRoute,
    logoutAccount,
    buyerPrefs,
    siteUsers,
    listings,
    favorites,
    history,
    chatByListing,
    compare,
    listingForm,
    setListingForm,
    adminStats,
    staffBadges,
    accountTypes,
    provinces,
    bairros,
    notifications,
    updateListingField,
    handlePhotoUpload,
    submitListing,
    submitListingDraft,
    duplicateListing,
    pauseListing,
    activateListing,
    archiveListing,
    renewFeatured,
    updateOwnerListing,
    approveListing,
    rejectListing,
    isListingOwner,
    getMyListings,
    getMyNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    trackView,
    toggleFavorite,
    clearFavorites,
    pruneStaleFavorites,
    toggleCompare,
    clearCompare,
    pruneStaleCompare,
    sendChat,
    updateListing,
    deleteListing,
    getListing,
    approvedAgents,
    agentApplications,
    submitAgentApplication,
    adminCreateAgentCandidate,
    adminSendAgentTest,
    submitAgentTest,
    adminApproveAgent,
    adminRejectAgent,
    adminRevokeAgent,
    adminResetAgentTest,
    getAgentApplicationByToken,
    getMyAgentApplication,
    scheduledVisits,
    scheduleVisit,
    cancelVisit,
    completeVisit,
    getAgentVisits,
    getMyVisits,
  }

  return (
    <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>
  )
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext)
  if (!context) throw new Error('useMarketplace must be used within MarketplaceProvider')
  return context
}
