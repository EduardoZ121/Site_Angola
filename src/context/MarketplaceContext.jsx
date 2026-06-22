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
} from '../data/constants'
import { trustSealFromProfile } from '../utils/format'
import { parseGoogleCredential } from '../utils/googleAuth'

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

  const isAdmin = profile.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()

  const isLoggedIn = Boolean(profile.googleId && profile.email)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.siteUsers, JSON.stringify(siteUsers))
  }, [siteUsers])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications))
  }, [notifications])

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

  function registerSiteUser(googleUser) {
    setSiteUsers((prev) => {
      const existing = prev.find((user) => user.email === googleUser.email)
      const entry = {
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture || '',
        googleId: googleUser.googleId,
        firstLoginAt: existing?.firstLoginAt || new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        loginCount: (existing?.loginCount || 0) + 1,
      }
      return [entry, ...prev.filter((user) => user.email !== googleUser.email)]
    })
  }

  function loginWithGoogle(credential) {
    const googleUser = parseGoogleCredential(credential)
    if (!googleUser?.email) return false

    registerSiteUser(googleUser)

    setProfile((current) => ({
      ...current,
      name: googleUser.name || current.name,
      email: googleUser.email,
      googleId: googleUser.googleId,
      picture: googleUser.picture,
      emailVerified: googleUser.emailVerified,
      authProvider: 'google',
      verifiedProfile: googleUser.emailVerified || current.verifiedProfile,
    }))

    addNotification({
      type: 'account_welcome',
      ownerName: googleUser.name,
      ownerEmail: googleUser.email,
      title: 'Conta Google ligada ao Kuteka',
      body: `Bem-vindo, ${googleUser.name}! Vai receber emails em ${googleUser.email} quando publicar ou quando o administrador aprovar anúncios.`,
    })

    return true
  }

  function logoutAccount() {
    setProfile({ ...defaultProfile })
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
    loginWithGoogle,
    logoutAccount,
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
