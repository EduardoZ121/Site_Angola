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
  const [adminEmail, setAdminEmail] = useState('')

  const isAdmin = adminEmail.trim().toLowerCase() === ADMIN_EMAIL

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

  function submitListing(event) {
    event.preventDefault()
    if (!profile.name || !profile.phone || !listingForm.title || !listingForm.price) return

    const base = {
      id: `l-${Date.now()}`,
      category: listingForm.category,
      operation: listingForm.operation,
      title: listingForm.title,
      price: Number(listingForm.price),
      province: listingForm.province,
      municipality: listingForm.municipality,
      neighborhood: listingForm.neighborhood,
      ownerName: profile.name,
      ownerType: profile.type,
      phone: profile.phone,
      verifiedProfile: profile.verifiedProfile,
      verifiedPhone: profile.verifiedPhone,
      verifiedDocument: profile.verifiedDocument,
      trustSeal: trustSealFromProfile(profile),
      status: 'Pendente',
      featured: false,
      description: listingForm.description,
      photos: listingForm.photos.length ? listingForm.photos : [defaultPhoto],
      lat: Number((Math.random() * 0.85 + 0.08).toFixed(2)),
      lng: Number((Math.random() * 0.85 + 0.08).toFixed(2)),
      createdAt: new Date().toISOString().slice(0, 10),
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
    return payload.id
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

  function getListing(id) {
    return listings.find((listing) => listing.id === id)
  }

  const value = {
    profile,
    setProfile,
    listings,
    favorites,
    history,
    chatByListing,
    compare,
    listingForm,
    setListingForm,
    adminEmail,
    setAdminEmail,
    isAdmin,
    adminStats,
    accountTypes,
    provinces,
    bairros,
    updateListingField,
    handlePhotoUpload,
    submitListing,
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
