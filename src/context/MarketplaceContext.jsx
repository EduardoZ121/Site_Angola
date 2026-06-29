import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  ADMIN_EMAIL,
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
import { trustSealFromProfile } from '../utils/format'
import { parseGoogleCredential } from '../utils/googleAuth'
import { draftToRawListing } from '../utils/publishDraft'
import { rawListingToPublishDraft } from '../utils/ownerListing'
import { LISTING_STATUS } from '../constants/listingStatus'
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
  const [compare, setCompare] = useState([])
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

  const isAdmin = profile.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()

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
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile))
  }, [profile])
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.listings, JSON.stringify(listings))
  }, [listings])
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites))
  }, [favorites])
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history))
  }, [history])
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.chats, JSON.stringify(chatByListing))
  }, [chatByListing])

  const adminStats = useMemo(
    () => ({
      total: listings.length,
      active: listings.filter((listing) => listing.status === 'Ativo').length,
      pending: listings.filter((listing) => listing.status === 'Pendente').length,
      featured: listings.filter((listing) => listing.featured).length,
    }),
    [listings],
  )

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
    const needsReview = existing.status === 'Ativo'
    updateListing(listingId, {
      ...payload,
      id: listingId,
      status: needsReview ? 'Pendente' : existing.status,
      listingStatus: needsReview ? LISTING_STATUS.UNDER_REVIEW : existing.listingStatus,
      updatedAt: new Date().toISOString(),
      views: existing.views || 0,
      featured: existing.featured,
      featuredUntil: existing.featuredUntil,
      approvedAt: needsReview ? undefined : existing.approvedAt,
    })
    if (needsReview) {
      addNotification({
        type: 'listing_pending',
        listingId,
        ownerName: profile.name,
        ownerEmail: profile.email || '',
        title: 'Alterações enviadas para revisão',
        body: `O anúncio "${payload.title}" será revisto antes de voltar a ficar público.`,
      })
    }
    return listingId
  }

  function submitListingDraft(draft) {
    if (!profile.name || !profile.phone) return null
    const payload = draftToRawListing(draft, profile)
    setListings((prev) => [payload, ...prev])

    addNotification({
      type: 'listing_pending',
      listingId: payload.id,
      ownerName: profile.name,
      ownerEmail: profile.email || '',
      title: 'Anúncio enviado — aguarda aprovação',
      body: `O seu anúncio "${payload.title}" foi recebido. A nossa equipa vai rever fotos e dados antes de publicar no site.`,
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

  function toggleCompare(id) {
    setCompare((prev) => {
      if (prev.includes(id)) return prev.filter((value) => value !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
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
    setListings((prev) => prev.filter((listing) => listing.id !== listingId))
  }

  function approveListing(listingId) {
    const listing = listings.find((item) => item.id === listingId)
    if (!listing) return

    updateListing(listingId, {
      status: 'Ativo',
      listingStatus: LISTING_STATUS.ACTIVE,
      approvedAt: new Date().toISOString(),
    })

    addNotification({
      type: 'listing_approved',
      listingId,
      ownerName: listing.ownerName,
      ownerEmail: listing.ownerEmail || '',
      title: 'Parabéns! O seu anúncio foi publicado',
      body: `O anúncio "${listing.title}" foi aprovado pelo administrador e já está visível no Kuteka. Enviámos confirmação para ${listing.ownerEmail || 'o seu email'}.`,
    })
  }

  function rejectListing(listingId, reason = '') {
    const listing = listings.find((item) => item.id === listingId)
    if (!listing) return

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
    return listings.find((listing) => listing.id === id)
  }

  const value = {
    profile,
    setProfile,
    isLoggedIn,
    isAdmin,
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
    trackView,
    toggleFavorite,
    toggleCompare,
    sendChat,
    updateListing,
    deleteListing,
    getListing,
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
