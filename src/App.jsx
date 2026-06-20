import { useEffect, useMemo, useState } from 'react'
import './App.css'

const ADMIN_EMAIL = 'admin@kutekalink.com'

const STORAGE_KEYS = {
  profile: 'kuteka.market.profile',
  listings: 'kuteka.market.listings',
  favorites: 'kuteka.market.favorites',
  history: 'kuteka.market.history',
  chats: 'kuteka.market.chats',
}

const accountTypes = [
  'Proprietário Particular',
  'Agente Imobiliário',
  'Empresa Imobiliária',
]

const provinces = {
  Luanda: ['Belas', 'Cazenga', 'Kilamba Kiaxi', 'Talatona', 'Viana'],
  Benguela: ['Benguela', 'Lobito', 'Catumbela'],
  Huíla: ['Lubango', 'Chibia', 'Humpata'],
  Huambo: ['Huambo', 'Caála', 'Bailundo'],
}

const bairros = {
  Belas: ['Talatona', 'Benfica', 'Morro Bento'],
  Cazenga: ['Cazenga', '11 de Novembro', 'Hoji-ya-Henda'],
  'Kilamba Kiaxi': ['Golfe', 'Palanca', 'Nova Vida'],
  Talatona: ['Cidade Financeira', 'Camama', 'Lar do Patriota'],
  Viana: ['Zango', 'Estalagem', 'Vila Flor'],
  Benguela: ['Praia Morena', 'Compão', 'Lobito Velho'],
  Lobito: ['Restinga', 'Compão', 'Canata'],
  Catumbela: ['Catumbela Centro', 'Gama', 'Biópio'],
  Lubango: ['Mapunda', 'Tchioco', 'Nambambe'],
  Chibia: ['Cacula', 'Jau', 'Quihita'],
  Humpata: ['Humpata Centro', 'Neves Bendinha', 'Kuvango'],
  Huambo: ['São Pedro', 'Calomanda', 'Samissassa'],
  'Caála': ['Sede', 'Catchiungo', 'Katchiungo'],
  Bailundo: ['Bailundo Centro', 'Tchikala', 'Lunge'],
}

const defaultPhoto =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'

const starterListings = [
  {
    id: 'l-1',
    category: 'Imóvel',
    operation: 'Arrendamento',
    propertyType: 'Apartamento',
    title: 'T3 moderno no Talatona',
    price: 850000,
    province: 'Luanda',
    municipality: 'Talatona',
    neighborhood: 'Cidade Financeira',
    bedrooms: 3,
    bathrooms: 2,
    area: 145,
    ownerName: 'Adriano Manuel',
    ownerType: 'Proprietário Particular',
    phone: '+244923000111',
    verifiedProfile: true,
    verifiedPhone: true,
    verifiedDocument: false,
    trustSeal: 'Prata',
    status: 'Ativo',
    featured: true,
    description:
      'Apartamento com segurança 24h, estacionamento e acesso rápido à via expressa.',
    photos: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    ],
    lat: 0.64,
    lng: 0.74,
    createdAt: '2026-06-01',
  },
  {
    id: 'l-2',
    category: 'Imóvel',
    operation: 'Venda',
    propertyType: 'Vivenda',
    title: 'Vivenda T4 no Kilamba',
    price: 215000000,
    province: 'Luanda',
    municipality: 'Kilamba Kiaxi',
    neighborhood: 'Nova Vida',
    bedrooms: 4,
    bathrooms: 4,
    area: 280,
    ownerName: 'Nova Era Imobiliária',
    ownerType: 'Empresa Imobiliária',
    phone: '+244937000222',
    verifiedProfile: true,
    verifiedPhone: true,
    verifiedDocument: true,
    trustSeal: 'Ouro',
    status: 'Ativo',
    featured: true,
    description:
      'Empreendimento com documentação em dia e financiamento possível.',
    photos: [
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80',
    ],
    lat: 0.52,
    lng: 0.66,
    createdAt: '2026-06-10',
  },
  {
    id: 'l-3',
    category: 'Veículo',
    operation: 'Venda',
    title: 'Toyota Prado 2019',
    price: 42000000,
    province: 'Luanda',
    municipality: 'Viana',
    neighborhood: 'Zango',
    brand: 'Toyota',
    model: 'Prado',
    year: 2019,
    mileage: 68000,
    fuel: 'Diesel',
    gearbox: 'Automática',
    condition: 'Semi-novo',
    ownerName: 'Stand Kilamba Motors',
    ownerType: 'Agente Imobiliário',
    phone: '+244936000333',
    verifiedProfile: true,
    verifiedPhone: true,
    verifiedDocument: true,
    trustSeal: 'Ouro',
    status: 'Ativo',
    featured: false,
    description:
      'Veículo em excelente estado, revisão completa e histórico disponível.',
    photos: [
      'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1200&q=80',
    ],
    lat: 0.74,
    lng: 0.49,
    createdAt: '2026-05-28',
  },
]

const emptyListing = {
  category: 'Imóvel',
  operation: 'Arrendamento',
  propertyType: 'Apartamento',
  title: '',
  price: '',
  province: 'Luanda',
  municipality: 'Talatona',
  neighborhood: 'Cidade Financeira',
  bedrooms: '',
  bathrooms: '',
  area: '',
  brand: '',
  model: '',
  year: '',
  mileage: '',
  fuel: 'Gasolina',
  gearbox: 'Automática',
  condition: 'Semi-novo',
  description: '',
  photos: [],
}

function parseStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function trustSealFromProfile(profile) {
  if (profile.verifiedProfile && profile.verifiedPhone) {
    return profile.verifiedDocument ? 'Ouro' : 'Prata'
  }
  return 'Sem selo'
}

function App() {
  const [profile, setProfile] = useState(() =>
    parseStorage(STORAGE_KEYS.profile, {
      name: '',
      email: '',
      phone: '',
      type: accountTypes[0],
      verifiedProfile: false,
      verifiedPhone: false,
      verifiedDocument: false,
    }),
  )
  const [listings, setListings] = useState(() =>
    parseStorage(STORAGE_KEYS.listings, starterListings),
  )
  const [favorites, setFavorites] = useState(() =>
    parseStorage(STORAGE_KEYS.favorites, []),
  )
  const [history, setHistory] = useState(() =>
    parseStorage(STORAGE_KEYS.history, []),
  )
  const [chatByListing, setChatByListing] = useState(() =>
    parseStorage(STORAGE_KEYS.chats, {}),
  )
  const [compare, setCompare] = useState([])
  const [selected, setSelected] = useState(null)
  const [chatInput, setChatInput] = useState('')
  const [listingForm, setListingForm] = useState(emptyListing)
  const [adminEmail, setAdminEmail] = useState('')
  const [filters, setFilters] = useState({
    query: '',
    category: 'Todos',
    operation: 'Todos',
    province: 'Todos',
    municipality: 'Todos',
    neighborhood: 'Todos',
    minPrice: '',
    maxPrice: '',
    brand: '',
    model: '',
    yearMin: '',
    yearMax: '',
    mileageMax: '',
    fuel: 'Todos',
    gearbox: 'Todos',
    condition: 'Todos',
  })

  const isAdmin = adminEmail.trim().toLowerCase() === ADMIN_EMAIL
  const featuredListing =
    listings.find((listing) => listing.featured) || listings[0]

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

  const filtered = useMemo(() => {
    return listings.filter((listing) => {
      const search = `${listing.title} ${listing.neighborhood} ${listing.municipality} ${listing.province} ${listing.description}`.toLowerCase()
      if (filters.query && !search.includes(filters.query.toLowerCase())) return false
      if (filters.category !== 'Todos' && listing.category !== filters.category) return false
      if (filters.operation !== 'Todos' && listing.operation !== filters.operation) return false
      if (filters.province !== 'Todos' && listing.province !== filters.province) return false
      if (filters.municipality !== 'Todos' && listing.municipality !== filters.municipality) return false
      if (filters.neighborhood !== 'Todos' && listing.neighborhood !== filters.neighborhood) return false
      if (filters.minPrice && Number(listing.price) < Number(filters.minPrice)) return false
      if (filters.maxPrice && Number(listing.price) > Number(filters.maxPrice)) return false
      if (listing.category === 'Veículo') {
        if (filters.brand && !String(listing.brand || '').toLowerCase().includes(filters.brand.toLowerCase())) return false
        if (filters.model && !String(listing.model || '').toLowerCase().includes(filters.model.toLowerCase())) return false
        if (filters.yearMin && Number(listing.year || 0) < Number(filters.yearMin)) return false
        if (filters.yearMax && Number(listing.year || 0) > Number(filters.yearMax)) return false
        if (filters.mileageMax && Number(listing.mileage || 0) > Number(filters.mileageMax)) return false
        if (filters.fuel !== 'Todos' && listing.fuel !== filters.fuel) return false
        if (filters.gearbox !== 'Todos' && listing.gearbox !== filters.gearbox) return false
        if (filters.condition !== 'Todos' && listing.condition !== filters.condition) return false
      }
      return listing.status !== 'Pausado' || isAdmin
    })
  }, [filters, listings, isAdmin])

  const avgByZone = useMemo(() => {
    const groups = {}
    listings.forEach((listing) => {
      const key = `${listing.province} / ${listing.municipality} / ${listing.neighborhood}`
      groups[key] = groups[key] || { total: 0, count: 0 }
      groups[key].total += Number(listing.price || 0)
      groups[key].count += 1
    })
    return Object.entries(groups)
      .map(([zone, stats]) => ({
        zone,
        avg: Math.round(stats.total / stats.count),
        count: stats.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [listings])

  const adminStats = useMemo(
    () => ({
      total: listings.length,
      active: listings.filter((listing) => listing.status === 'Ativo').length,
      pending: listings.filter((listing) => listing.status === 'Pendente').length,
      featured: listings.filter((listing) => listing.featured).length,
    }),
    [listings],
  )

  const compareItems = compare
    .map((id) => listings.find((listing) => listing.id === id))
    .filter(Boolean)
  const historyItems = history
    .map((id) => listings.find((listing) => listing.id === id))
    .filter(Boolean)
  const selectedMessages = selected ? chatByListing[selected.id] || [] : []

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
    event.target.reset()
  }

  function openListing(listing) {
    setSelected(listing)
    setHistory((prev) => [listing.id, ...prev.filter((id) => id !== listing.id)].slice(0, 20))
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

  function sendChat() {
    if (!selected || !chatInput.trim()) return
    const message = {
      who: profile.name || 'Comprador',
      text: chatInput.trim(),
      at: new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
    setChatByListing((prev) => ({
      ...prev,
      [selected.id]: [...(prev[selected.id] || []), message],
    }))
    setChatInput('')
  }

  function updateListing(listingId, patch) {
    setListings((prev) =>
      prev.map((listing) =>
        listing.id === listingId ? { ...listing, ...patch } : listing,
      ),
    )
    if (selected?.id === listingId) {
      setSelected((current) => ({ ...current, ...patch }))
    }
  }

  function deleteListing(listingId) {
    setListings((prev) => prev.filter((listing) => listing.id !== listingId))
    setSelected(null)
  }

  return (
    <main>
      <header className="hero">
        <nav className="nav">
          <a className="brand" href="#top" aria-label="Kuteka início">
            <img className="brand-logo" src="/kuteka-logo.svg" alt="Kuteka" />
          </a>
          <div className="nav-links">
            <a href="#anuncios">Anúncios</a>
            <a href="#publicar">Publicar</a>
            <a href="#precos">Preços</a>
            <a href="#admin">Admin</a>
          </div>
        </nav>

        <section className="hero-grid" id="top">
          <div className="hero-copy">
            <p className="eyebrow">Kuteka • Marketplace Angola</p>
            <h1>Compra, venda e arrendamento com confiança e contacto directo.</h1>
            <p className="hero-text">
              Plataforma para proprietários, agentes e empresas publicarem imóveis e veículos em Kz,
              com verificação, filtros avançados, chat interno, WhatsApp, favoritos, comparação e
              relatório de preços por zona.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#publicar">
                Publicar anúncio
              </a>
              <a className="button secondary" href="#anuncios">
                Ver anúncios
              </a>
            </div>
          </div>

          {featuredListing && (
            <aside className="feature-card">
              <img src={featuredListing.photos?.[0] || defaultPhoto} alt={featuredListing.title} />
              <div>
                <span>{featuredListing.operation}</span>
                <TrustBadge listing={featuredListing} />
                <h2>{featuredListing.title}</h2>
                <p>
                  {featuredListing.province} / {featuredListing.municipality} /{' '}
                  {featuredListing.neighborhood}
                </p>
                <strong>{formatKz(featuredListing.price)}</strong>
                <button className="text-button" type="button" onClick={() => openListing(featuredListing)}>
                  Ver detalhes
                </button>
              </div>
            </aside>
          )}
        </section>
      </header>

      <section className="search-panel" aria-label="Pesquisar anúncios">
        <label>
          Pesquisa
          <input
            placeholder="Talatona, Toyota, Kilamba..."
            value={filters.query}
            onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
          />
        </label>
        <FilterSelect
          label="Categoria"
          value={filters.category}
          onChange={(value) => setFilters((current) => ({ ...current, category: value }))}
          options={['Todos', 'Imóvel', 'Veículo']}
        />
        <FilterSelect
          label="Província"
          value={filters.province}
          onChange={(value) => setFilters((current) => ({ ...current, province: value }))}
          options={['Todos', ...Object.keys(provinces)]}
        />
        <FilterSelect
          label="Operação"
          value={filters.operation}
          onChange={(value) => setFilters((current) => ({ ...current, operation: value }))}
          options={['Todos', 'Arrendamento', 'Venda']}
        />
      </section>

      <section className="section trust-strip">
        <div>
          <strong>{listings.length}</strong>
          <span>Anúncios no site</span>
        </div>
        <div>
          <strong>{favorites.length}</strong>
          <span>Favoritos guardados</span>
        </div>
        <div>
          <strong>Kz</strong>
          <span>Moeda de Angola</span>
        </div>
        <div>
          <strong>{trustSealFromProfile(profile)}</strong>
          <span>Selo do seu perfil</span>
        </div>
      </section>

      <section className="section profile-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Conta</p>
            <h2>Perfil e verificação</h2>
          </div>
          <p className="section-subtitle">
            Diferencie proprietário particular, agente imobiliário e empresa imobiliária.
          </p>
        </div>
        <div className="profile-grid">
          <div className="owner-form">
            <div className="form-row">
              <label>
                Nome
                <input
                  placeholder="O seu nome"
                  value={profile.name}
                  onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label>
                Email
                <input
                  placeholder="email@exemplo.com"
                  value={profile.email}
                  onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                Telefone (+244...)
                <input
                  placeholder="+244 923 000 000"
                  value={profile.phone}
                  onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
                />
              </label>
              <label>
                Tipo de conta
                <select
                  value={profile.type}
                  onChange={(event) => setProfile((current) => ({ ...current, type: event.target.value }))}
                >
                  {accountTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="toggle-row">
              <Toggle
                label="Perfil verificado"
                checked={profile.verifiedProfile}
                onToggle={() => setProfile((current) => ({ ...current, verifiedProfile: !current.verifiedProfile }))}
              />
              <Toggle
                label="Telefone verificado"
                checked={profile.verifiedPhone}
                onToggle={() => setProfile((current) => ({ ...current, verifiedPhone: !current.verifiedPhone }))}
              />
              <Toggle
                label="Documento validado"
                checked={profile.verifiedDocument}
                onToggle={() => setProfile((current) => ({ ...current, verifiedDocument: !current.verifiedDocument }))}
              />
            </div>
          </div>
          <div className="trust-card">
            <strong>Selo de confiança</strong>
            <p>{trustSealFromProfile(profile)}</p>
            <small>Anúncios com selo recebem mais cliques e contactos directos.</small>
          </div>
        </div>
      </section>

      <section className="section owner-section" id="publicar">
        <div>
          <p className="eyebrow">Publicar</p>
          <h2>Publique imóvel ou veículo em Kz.</h2>
          <p>
            Os dados ficam guardados neste navegador enquanto preparamos login Google, backend e
            armazenamento na nuvem para kutekalink.com.
          </p>
        </div>

        <form className="owner-form" onSubmit={submitListing}>
          <div className="form-row">
            <label>
              Categoria
              <select
                value={listingForm.category}
                onChange={(event) => updateListingField('category', event.target.value)}
              >
                <option>Imóvel</option>
                <option>Veículo</option>
              </select>
            </label>
            <label>
              Operação
              <select
                value={listingForm.operation}
                onChange={(event) => updateListingField('operation', event.target.value)}
              >
                <option>Arrendamento</option>
                <option>Venda</option>
              </select>
            </label>
          </div>

          <div className="form-row">
            {listingForm.category === 'Imóvel' ? (
              <label>
                Tipo de imóvel
                <select
                  value={listingForm.propertyType}
                  onChange={(event) => updateListingField('propertyType', event.target.value)}
                >
                  <option>Apartamento</option>
                  <option>Vivenda</option>
                  <option>Terreno</option>
                  <option>Loja</option>
                </select>
              </label>
            ) : (
              <label>
                Marca
                <input
                  value={listingForm.brand}
                  onChange={(event) => updateListingField('brand', event.target.value)}
                />
              </label>
            )}
            <label>
              Título
              <input
                required
                value={listingForm.title}
                onChange={(event) => updateListingField('title', event.target.value)}
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Preço (Kz)
              <input
                required
                type="number"
                value={listingForm.price}
                onChange={(event) => updateListingField('price', event.target.value)}
              />
            </label>
            <label>
              Província
              <select
                value={listingForm.province}
                onChange={(event) => updateListingField('province', event.target.value)}
              >
                {Object.keys(provinces).map((province) => (
                  <option key={province}>{province}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              Município
              <select
                value={listingForm.municipality}
                onChange={(event) => updateListingField('municipality', event.target.value)}
              >
                {(provinces[listingForm.province] || []).map((municipality) => (
                  <option key={municipality}>{municipality}</option>
                ))}
              </select>
            </label>
            <label>
              Bairro
              <select
                value={listingForm.neighborhood}
                onChange={(event) => updateListingField('neighborhood', event.target.value)}
              >
                {(bairros[listingForm.municipality] || []).map((neighborhood) => (
                  <option key={neighborhood}>{neighborhood}</option>
                ))}
              </select>
            </label>
          </div>

          {listingForm.category === 'Imóvel' ? (
            <div className="form-row">
              <label>
                Quartos
                <input
                  type="number"
                  value={listingForm.bedrooms}
                  onChange={(event) => updateListingField('bedrooms', event.target.value)}
                />
              </label>
              <label>
                Casas de banho
                <input
                  type="number"
                  value={listingForm.bathrooms}
                  onChange={(event) => updateListingField('bathrooms', event.target.value)}
                />
              </label>
              <label>
                Área (m²)
                <input
                  type="number"
                  value={listingForm.area}
                  onChange={(event) => updateListingField('area', event.target.value)}
                />
              </label>
            </div>
          ) : (
            <div className="form-row">
              <label>
                Modelo
                <input
                  value={listingForm.model}
                  onChange={(event) => updateListingField('model', event.target.value)}
                />
              </label>
              <label>
                Ano
                <input
                  type="number"
                  value={listingForm.year}
                  onChange={(event) => updateListingField('year', event.target.value)}
                />
              </label>
              <label>
                Quilometragem
                <input
                  type="number"
                  value={listingForm.mileage}
                  onChange={(event) => updateListingField('mileage', event.target.value)}
                />
              </label>
            </div>
          )}

          {listingForm.category === 'Veículo' && (
            <div className="form-row">
              <label>
                Combustível
                <select
                  value={listingForm.fuel}
                  onChange={(event) => updateListingField('fuel', event.target.value)}
                >
                  <option>Gasolina</option>
                  <option>Diesel</option>
                  <option>Elétrico</option>
                  <option>Híbrido</option>
                </select>
              </label>
              <label>
                Caixa
                <select
                  value={listingForm.gearbox}
                  onChange={(event) => updateListingField('gearbox', event.target.value)}
                >
                  <option>Automática</option>
                  <option>Manual</option>
                </select>
              </label>
              <label>
                Estado
                <select
                  value={listingForm.condition}
                  onChange={(event) => updateListingField('condition', event.target.value)}
                >
                  <option>Semi-novo</option>
                  <option>Usado</option>
                  <option>Novo</option>
                </select>
              </label>
            </div>
          )}

          <label>
            Descrição
            <textarea
              rows="4"
              value={listingForm.description}
              onChange={(event) => updateListingField('description', event.target.value)}
            />
          </label>

          <label className="upload-box">
            Fotos do anúncio
            <input accept="image/*" multiple type="file" onChange={handlePhotoUpload} />
            <span>Escolha até 5 fotos para pré-visualizar.</span>
          </label>

          {listingForm.photos.length > 0 && (
            <div className="preview-strip">
              {listingForm.photos.map((photo, index) => (
                <img src={photo} alt={`Pré-visualização ${index + 1}`} key={photo} />
              ))}
            </div>
          )}

          <button className="button primary" type="submit">
            Publicar para aprovação
          </button>
        </form>
      </section>

      <section className="section marketplace-layout" id="anuncios">
        <aside className="filters-panel">
          <h3>Filtros avançados</h3>
          <FilterSelect
            label="Município"
            value={filters.municipality}
            onChange={(value) => setFilters((current) => ({ ...current, municipality: value }))}
            options={['Todos', ...new Set(Object.values(provinces).flat())]}
          />
          <FilterSelect
            label="Bairro"
            value={filters.neighborhood}
            onChange={(value) => setFilters((current) => ({ ...current, neighborhood: value }))}
            options={['Todos', ...new Set(Object.values(bairros).flat())]}
          />
          <label>
            Preço mínimo
            <input
              type="number"
              value={filters.minPrice}
              onChange={(event) => setFilters((current) => ({ ...current, minPrice: event.target.value }))}
            />
          </label>
          <label>
            Preço máximo
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(event) => setFilters((current) => ({ ...current, maxPrice: event.target.value }))}
            />
          </label>
          <p className="filter-heading">Filtros de veículos</p>
          <label>
            Marca
            <input
              value={filters.brand}
              onChange={(event) => setFilters((current) => ({ ...current, brand: event.target.value }))}
            />
          </label>
          <label>
            Modelo
            <input
              value={filters.model}
              onChange={(event) => setFilters((current) => ({ ...current, model: event.target.value }))}
            />
          </label>
          <FilterSelect
            label="Combustível"
            value={filters.fuel}
            onChange={(value) => setFilters((current) => ({ ...current, fuel: value }))}
            options={['Todos', 'Gasolina', 'Diesel', 'Elétrico', 'Híbrido']}
          />
          <FilterSelect
            label="Caixa"
            value={filters.gearbox}
            onChange={(value) => setFilters((current) => ({ ...current, gearbox: value }))}
            options={['Todos', 'Automática', 'Manual']}
          />
          <FilterSelect
            label="Estado"
            value={filters.condition}
            onChange={(value) => setFilters((current) => ({ ...current, condition: value }))}
            options={['Todos', 'Novo', 'Semi-novo', 'Usado']}
          />
        </aside>

        <div>
          <div className="map-panel">
            <h3>Mapa interactivo (visualização de zona)</h3>
            <p>Clique num ponto para abrir o anúncio.</p>
            <div className="map-canvas">
              {filtered.map((listing) => (
                <button
                  key={`map-${listing.id}`}
                  type="button"
                  title={listing.title}
                  className="map-point"
                  onClick={() => openListing(listing)}
                  style={{
                    left: `${(listing.lng || 0.5) * 100}%`,
                    top: `${(listing.lat || 0.5) * 100}%`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="section-heading">
            <div>
              <p className="eyebrow">Resultados</p>
              <h2>{filtered.length} anúncios encontrados</h2>
            </div>
          </div>

          <div className="listing-grid">
            {filtered.map((listing) => (
              <article className="listing-card" key={listing.id}>
                <button type="button" onClick={() => openListing(listing)} aria-label={`Abrir ${listing.title}`}>
                  <img src={listing.photos?.[0] || defaultPhoto} alt={listing.title} />
                </button>
                <div className="listing-body">
                  <div className="listing-meta">
                    <span>{listing.category}</span>
                    <span>{listing.operation}</span>
                    <TrustBadge listing={listing} />
                  </div>
                  <h3>{listing.title}</h3>
                  <p>
                    {listing.province} / {listing.municipality} / {listing.neighborhood}
                  </p>
                  <strong>{formatKz(listing.price)}</strong>
                  {listing.category === 'Imóvel' ? (
                    <p>
                      {listing.propertyType} • {listing.bedrooms} quartos • {listing.bathrooms} WC •{' '}
                      {listing.area}m²
                    </p>
                  ) : (
                    <p>
                      {listing.brand} {listing.model} • {listing.year} • {listing.mileage} km • {listing.fuel}
                    </p>
                  )}
                  <p>{listing.description}</p>
                  <p className="owner-line">
                    {listing.ownerType} • {listing.ownerName}
                  </p>
                  <div className="listing-actions">
                    <button className="text-button" type="button" onClick={() => openListing(listing)}>
                      Ver detalhes
                    </button>
                    <button className="text-button" type="button" onClick={() => toggleFavorite(listing.id)}>
                      {favorites.includes(listing.id) ? 'Remover favorito' : 'Favoritar'}
                    </button>
                    <button className="text-button" type="button" onClick={() => toggleCompare(listing.id)}>
                      {compare.includes(listing.id) ? 'Remover comparação' : 'Comparar'}
                    </button>
                    <a href={whatsappLink(listing)} target="_blank" rel="noreferrer">
                      WhatsApp
                    </a>
                    <a href={`tel:${listing.phone}`}>Ligar</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section compare-history-grid">
        <div className="compare-panel">
          <h3>Comparação de imóveis/veículos</h3>
          {compareItems.length === 0 ? (
            <p>Seleccione até 3 anúncios para comparar.</p>
          ) : (
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Preço</th>
                  <th>Tipo</th>
                  <th>Local</th>
                </tr>
              </thead>
              <tbody>
                {compareItems.map((item) => (
                  <tr key={`cmp-${item.id}`}>
                    <td>{item.title}</td>
                    <td>{formatKz(item.price)}</td>
                    <td>
                      {item.category === 'Imóvel'
                        ? item.propertyType
                        : `${item.brand} ${item.model}`}
                    </td>
                    <td>{item.neighborhood}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="history-panel">
          <h3>Histórico de visualizações</h3>
          {historyItems.length === 0 ? (
            <p>Ainda sem histórico.</p>
          ) : (
            <ul className="history-list">
              {historyItems.map((item) => (
                <li key={`history-${item.id}`}>
                  {item.title} — {item.neighborhood}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="section monetization-section" id="precos">
        <div>
          <p className="eyebrow">Relatório</p>
          <h2>Preços médios por zona</h2>
        </div>
        <div className="zone-list">
          {avgByZone.map((row) => (
            <div key={row.zone} className="zone-row">
              <span>{row.zone}</span>
              <strong>
                {formatKz(row.avg)} ({row.count} anúncios)
              </strong>
            </div>
          ))}
        </div>
      </section>

      <section className="section monetization-section" id="monetizar">
        <div>
          <p className="eyebrow">Monetização</p>
          <h2>Sem comissões elevadas</h2>
        </div>
        <div className="plan-grid">
          <div>
            <strong>Planos Premium</strong>
            <p>Maior destaque para anúncios seleccionados.</p>
          </div>
          <div>
            <strong>Conta profissional</strong>
            <p>Agentes e empresas pagam mensalidade para publicar mais.</p>
          </div>
          <div>
            <strong>Serviços adicionais</strong>
            <p>Fotografia, vídeo, promoção e parceiros locais.</p>
          </div>
        </div>
      </section>

      <section className="section admin-section" id="admin">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>Painel admin por email</h2>
          <p>
            Modo demo. Depois ligamos Google Login para que apenas o seu email real possa aprovar,
            destacar e apagar anúncios.
          </p>
        </div>

        <div className="admin-card">
          <label>
            Email admin demo
            <input
              placeholder={ADMIN_EMAIL}
              type="email"
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
            />
          </label>
          <small>
            Para testar agora, use: <strong>{ADMIN_EMAIL}</strong>
          </small>

          {isAdmin ? (
            <>
              <div className="admin-stats">
                <span>Total: {adminStats.total}</span>
                <span>Ativos: {adminStats.active}</span>
                <span>Pendentes: {adminStats.pending}</span>
                <span>Destaques: {adminStats.featured}</span>
              </div>
              <div className="admin-list">
                {listings.map((listing) => (
                  <div className="admin-row" key={listing.id}>
                    <div>
                      <strong>{listing.title}</strong>
                      <span>
                        {listing.neighborhood} — {formatKz(listing.price)}
                      </span>
                    </div>
                    <div className="admin-actions">
                      <button
                        type="button"
                        onClick={() =>
                          updateListing(listing.id, {
                            status: listing.status === 'Ativo' ? 'Pausado' : 'Ativo',
                          })
                        }
                      >
                        {listing.status === 'Ativo' ? 'Pausar' : 'Aprovar'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateListing(listing.id, { featured: !listing.featured })
                        }
                      >
                        {listing.featured ? 'Remover destaque' : 'Destacar'}
                      </button>
                      <button type="button" onClick={() => deleteListing(listing.id)}>
                        Apagar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="locked-admin">
              <strong>Admin bloqueado</strong>
              <span>Insira o email admin demo para ver os controlos.</span>
            </div>
          )}
        </div>
      </section>

      {selected && (
        <div
          className="modal-backdrop"
          role="button"
          tabIndex={0}
          onClick={() => setSelected(null)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setSelected(null)
          }}
        >
          <article
            className="listing-modal"
            role="dialog"
            aria-modal="true"
            aria-label={selected.title}
            onClick={(event) => event.stopPropagation()}
          >
            <button className="modal-close" type="button" onClick={() => setSelected(null)}>
              Fechar
            </button>
            <img src={selected.photos?.[0] || defaultPhoto} alt={selected.title} />
            <div>
              <div className="listing-meta">
                <span>{selected.category}</span>
                <span>{selected.operation}</span>
                <TrustBadge listing={selected} />
              </div>
              <h2>{selected.title}</h2>
              <p>
                {selected.province} / {selected.municipality} / {selected.neighborhood}
              </p>
              <strong>{formatKz(selected.price)}</strong>
              <p>{selected.description}</p>
              <div className="listing-actions">
                <a href={`tel:${selected.phone}`}>Ligar agora</a>
                <a href={whatsappLink(selected)} target="_blank" rel="noreferrer">
                  WhatsApp directo
                </a>
              </div>

              <div className="chat-panel">
                <h3>Chat interno</h3>
                <div className="chat-box">
                  {selectedMessages.length === 0 ? (
                    <p>Inicie uma conversa com o anunciante.</p>
                  ) : (
                    selectedMessages.map((message, index) => (
                      <p key={`${selected.id}-${index}`}>
                        <strong>{message.who}</strong> ({message.at}): {message.text}
                      </p>
                    ))
                  )}
                </div>
                <div className="chat-input-row">
                  <input
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder="Escrever mensagem..."
                  />
                  <button className="button primary" type="button" onClick={sendChat}>
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      )}
    </main>
  )
}

function Toggle({ label, checked, onToggle }) {
  return (
    <button
      type="button"
      className={`toggle-btn ${checked ? 'active' : ''}`}
      onClick={onToggle}
    >
      {checked ? '✓' : '○'} {label}
    </button>
  )
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

function TrustBadge({ listing }) {
  const tone =
    listing.trustSeal === 'Ouro'
      ? 'trust-gold'
      : listing.trustSeal === 'Prata'
        ? 'trust-silver'
        : 'trust-none'
  return <span className={`trust-badge ${tone}`}>{listing.trustSeal}</span>
}

function formatKz(value) {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function whatsappLink(listing) {
  const phone = String(listing.phone || '').replace(/\D/g, '')
  const message = encodeURIComponent(`Olá, tenho interesse no anúncio: ${listing.title}`)
  return `https://wa.me/${phone}?text=${message}`
}

export default App
