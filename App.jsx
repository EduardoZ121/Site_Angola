import { useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'kutekalink-angola-listings'
const ADMIN_EMAIL = 'admin@kutekalink.com'

const categories = ['Casa', 'Apartamento', 'Quarto', 'Carro', 'Terreno', 'Loja']
const dealTypes = ['Alugar', 'Comprar']
const provinces = [
  'Luanda',
  'Benguela',
  'Huambo',
  'Huila',
  'Cabinda',
  'Malanje',
  'Namibe',
  'Kwanza Sul',
]

const sampleListings = [
  {
    id: 'sample-1',
    title: 'Apartamento T3 no Kilamba com varanda',
    category: 'Apartamento',
    dealType: 'Alugar',
    location: 'Kilamba, Luanda',
    province: 'Luanda',
    price: 650000,
    bedrooms: 3,
    bathrooms: 2,
    owner: 'Helena Manuel',
    phone: '+244 923 000 111',
    status: 'Ativo',
    featured: true,
    description:
      'Apartamento mobilado, condominio organizado, parqueamento e acesso rapido ao centro de Luanda.',
    photos: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'sample-2',
    title: 'Vivenda familiar no Talatona',
    category: 'Casa',
    dealType: 'Comprar',
    location: 'Talatona, Luanda',
    province: 'Luanda',
    price: 185000000,
    bedrooms: 4,
    bathrooms: 4,
    owner: 'Imobiliaria Miramar',
    phone: '+244 926 000 222',
    status: 'Ativo',
    featured: true,
    description:
      'Vivenda com piscina, quintal, gerador, seguranca e suite principal ampla.',
    photos: [
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'sample-3',
    title: 'Toyota Hilux para aluguer diario',
    category: 'Carro',
    dealType: 'Alugar',
    location: 'Maianga, Luanda',
    province: 'Luanda',
    price: 45000,
    bedrooms: 0,
    bathrooms: 0,
    owner: 'Rota Angola',
    phone: '+244 924 000 333',
    status: 'Ativo',
    featured: false,
    description:
      'Pickup forte para cidade e provincia, seguro incluido e entrega combinada.',
    photos: [
      'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'sample-4',
    title: 'Loja comercial na baixa de Benguela',
    category: 'Loja',
    dealType: 'Alugar',
    location: 'Centro, Benguela',
    province: 'Benguela',
    price: 320000,
    bedrooms: 0,
    bathrooms: 1,
    owner: 'Paulo Andrade',
    phone: '+244 927 000 444',
    status: 'Pendente',
    featured: false,
    description:
      'Espaco ideal para boutique, servicos ou escritorio com montra para rua principal.',
    photos: [
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
    ],
  },
]

const emptyForm = {
  title: '',
  category: 'Apartamento',
  dealType: 'Alugar',
  location: '',
  province: 'Luanda',
  price: '',
  bedrooms: '',
  bathrooms: '',
  owner: '',
  phone: '',
  description: '',
  photos: [],
}

function readListings() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : sampleListings
  } catch {
    return sampleListings
  }
}

function App() {
  const [listings, setListings] = useState(readListings)
  const [filters, setFilters] = useState({
    query: '',
    category: 'Todos',
    dealType: 'Todos',
    province: 'Todos',
    maxPrice: '',
  })
  const [form, setForm] = useState(emptyForm)
  const [activeListing, setActiveListing] = useState(
    listings.find((listing) => listing.featured) || listings[0],
  )
  const [selectedListing, setSelectedListing] = useState(null)
  const [adminEmail, setAdminEmail] = useState('')

  const isAdmin = adminEmail.trim().toLowerCase() === ADMIN_EMAIL

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const search =
        `${listing.title} ${listing.location} ${listing.province} ${listing.description}`.toLowerCase()
      const matchesQuery = search.includes(filters.query.toLowerCase())
      const matchesCategory =
        filters.category === 'Todos' || listing.category === filters.category
      const matchesDeal =
        filters.dealType === 'Todos' || listing.dealType === filters.dealType
      const matchesProvince =
        filters.province === 'Todos' || listing.province === filters.province
      const matchesPrice =
        !filters.maxPrice || Number(listing.price) <= Number(filters.maxPrice)

      return (
        matchesQuery &&
        matchesCategory &&
        matchesDeal &&
        matchesProvince &&
        matchesPrice
      )
    })
  }, [filters, listings])

  const adminStats = useMemo(
    () => ({
      total: listings.length,
      active: listings.filter((listing) => listing.status === 'Ativo').length,
      pending: listings.filter((listing) => listing.status === 'Pendente').length,
      featured: listings.filter((listing) => listing.featured).length,
    }),
    [listings],
  )

  function updateFilters(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function updateForm(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function saveListings(nextListings) {
    setListings(nextListings)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextListings))
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
      setForm((current) => ({ ...current, photos }))
    })
  }

  function submitListing(event) {
    event.preventDefault()

    const newListing = {
      ...form,
      id: crypto.randomUUID(),
      price: Number(form.price),
      bedrooms: Number(form.bedrooms || 0),
      bathrooms: Number(form.bathrooms || 0),
      status: 'Pendente',
      featured: false,
      photos:
        form.photos.length > 0
          ? form.photos
          : [
              'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
            ],
    }

    const nextListings = [newListing, ...listings]
    saveListings(nextListings)
    setActiveListing(newListing)
    setSelectedListing(newListing)
    setForm(emptyForm)
    event.target.reset()
  }

  function updateListing(listingId, patch) {
    const nextListings = listings.map((listing) =>
      listing.id === listingId ? { ...listing, ...patch } : listing,
    )
    saveListings(nextListings)

    if (activeListing?.id === listingId) {
      setActiveListing((current) => ({ ...current, ...patch }))
    }
    if (selectedListing?.id === listingId) {
      setSelectedListing((current) => ({ ...current, ...patch }))
    }
  }

  function deleteListing(listingId) {
    const nextListings = listings.filter((listing) => listing.id !== listingId)
    saveListings(nextListings)
    setSelectedListing(null)
    if (activeListing?.id === listingId) {
      setActiveListing(nextListings[0] || sampleListings[0])
    }
  }

  return (
    <main>
      <header className="hero">
        <nav className="nav">
          <a className="brand" href="#top" aria-label="Kuteka inicio">
            <img className="brand-logo" src="/kuteka-logo.svg" alt="Kuteka" />
          </a>
          <div className="nav-links">
            <a href="#anuncios">Anuncios</a>
            <a href="#categorias">Categorias</a>
            <a href="#publicar">Publicar</a>
            <a href="#admin">Admin</a>
          </div>
        </nav>

        <section className="hero-grid" id="top">
          <div className="hero-copy">
            <p className="eyebrow">Site marketplace para Angola</p>
            <h1>Casas, carros e espacos para alugar ou comprar em Angola.</h1>
            <p className="hero-text">
              Este e um site, nao e APK. A primeira versao ja permite pesquisar
              anuncios, publicar com fotos e preparar o painel admin para o seu
              email.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#publicar">
                Publicar anuncio
              </a>
              <a className="button secondary" href="#anuncios">
                Ver anuncios em Kz
              </a>
            </div>
          </div>

          <aside className="feature-card">
            <img src={activeListing.photos[0]} alt={activeListing.title} />
            <div>
              <span>{activeListing.dealType}</span>
              <h2>{activeListing.title}</h2>
              <p>{activeListing.location}</p>
              <strong>{formatPrice(activeListing)}</strong>
              <button
                className="text-button"
                type="button"
                onClick={() => setSelectedListing(activeListing)}
              >
                Ver detalhes
              </button>
            </div>
          </aside>
        </section>
      </header>

      <section className="search-panel" aria-label="Pesquisar anuncios">
        <label>
          Pesquisa
          <input
            name="query"
            placeholder="Luanda, Talatona, Hilux..."
            value={filters.query}
            onChange={updateFilters}
          />
        </label>
        <label>
          Categoria
          <select
            name="category"
            value={filters.category}
            onChange={updateFilters}
          >
            <option>Todos</option>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label>
          Provincia
          <select
            name="province"
            value={filters.province}
            onChange={updateFilters}
          >
            <option>Todos</option>
            {provinces.map((province) => (
              <option key={province}>{province}</option>
            ))}
          </select>
        </label>
        <label>
          Preco maximo Kz
          <input
            name="maxPrice"
            min="0"
            placeholder="Ex: 800000"
            type="number"
            value={filters.maxPrice}
            onChange={updateFilters}
          />
        </label>
      </section>

      <section className="section trust-strip">
        <div>
          <strong>{listings.length}</strong>
          <span>Anuncios no site</span>
        </div>
        <div>
          <strong>{provinces.length}</strong>
          <span>Provincias preparadas</span>
        </div>
        <div>
          <strong>Kz</strong>
          <span>Moeda de Angola</span>
        </div>
        <div>
          <strong>Admin</strong>
          <span>Painel por email preparado</span>
        </div>
      </section>

      <section className="section" id="categorias">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Explorar</p>
            <h2>Categorias principais</h2>
          </div>
          <p className="section-subtitle">
            O site esta preparado para imoveis, carros e outros alugueres.
          </p>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <button
              className="category-card"
              key={category}
              type="button"
              onClick={() =>
                setFilters((current) => ({ ...current, category }))
              }
            >
              <span>{categoryIcon(category)}</span>
              <strong>{category}</strong>
              <small>
                {
                  listings.filter((listing) => listing.category === category)
                    .length
                }{' '}
                anuncios
              </small>
            </button>
          ))}
        </div>
      </section>

      <section className="section" id="anuncios">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Resultados</p>
            <h2>{filteredListings.length} anuncios encontrados</h2>
          </div>
          <p className="section-subtitle">
            Clique em qualquer foto ou em "Ver detalhes" para abrir o anuncio.
          </p>
        </div>

        <div className="listing-grid">
          {filteredListings.map((listing) => (
            <article className="listing-card" key={listing.id}>
              <button
                type="button"
                onClick={() => {
                  setActiveListing(listing)
                  setSelectedListing(listing)
                }}
                aria-label={`Abrir ${listing.title}`}
              >
                <img src={listing.photos[0]} alt={listing.title} />
              </button>
              <div className="listing-body">
                <div className="listing-meta">
                  <span>{listing.category}</span>
                  <span>{listing.dealType}</span>
                  <span>{listing.status}</span>
                </div>
                <h3>{listing.title}</h3>
                <p>{listing.location}</p>
                <strong>{formatPrice(listing)}</strong>
                <p>{listing.description}</p>
                <div className="listing-actions">
                  <a href={`tel:${listing.phone}`}>Ligar</a>
                  <a href={whatsappLink(listing)} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => setSelectedListing(listing)}
                  >
                    Ver detalhes
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section owner-section" id="publicar">
        <div>
          <p className="eyebrow">Area do proprietario</p>
          <h2>Publique um anuncio em Kz com fotos.</h2>
          <p>
            Nesta fase os dados ficam no navegador para preview. Depois ligamos
            Google Login, backend, banco de dados e armazenamento de imagens.
          </p>
          <div className="owner-note">
            <strong>Fluxo futuro:</strong>
            <span>Login Google</span>
            <span>Conta do proprietario</span>
            <span>Aprovacao pelo admin</span>
          </div>
        </div>

        <form className="owner-form" onSubmit={submitListing}>
          <div className="form-row">
            <label>
              Titulo
              <input
                required
                name="title"
                placeholder="Ex: T2 no Kilamba"
                value={form.title}
                onChange={updateForm}
              />
            </label>
            <label>
              Localizacao
              <input
                required
                name="location"
                placeholder="Bairro, municipio"
                value={form.location}
                onChange={updateForm}
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Categoria
              <select
                name="category"
                value={form.category}
                onChange={updateForm}
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label>
              Provincia
              <select
                name="province"
                value={form.province}
                onChange={updateForm}
              >
                {provinces.map((province) => (
                  <option key={province}>{province}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              Operacao
              <select
                name="dealType"
                value={form.dealType}
                onChange={updateForm}
              >
                {dealTypes.map((dealType) => (
                  <option key={dealType}>{dealType}</option>
                ))}
              </select>
            </label>
            <label>
              Preco em Kz
              <input
                required
                min="1"
                name="price"
                type="number"
                placeholder="Ex: 650000"
                value={form.price}
                onChange={updateForm}
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Quartos
              <input
                min="0"
                name="bedrooms"
                type="number"
                placeholder="0 para carros/lojas"
                value={form.bedrooms}
                onChange={updateForm}
              />
            </label>
            <label>
              Casas de banho
              <input
                min="0"
                name="bathrooms"
                type="number"
                placeholder="Ex: 2"
                value={form.bathrooms}
                onChange={updateForm}
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Nome do proprietario
              <input
                required
                name="owner"
                placeholder="O seu nome"
                value={form.owner}
                onChange={updateForm}
              />
            </label>
            <label>
              Telefone Angola
              <input
                required
                name="phone"
                placeholder="+244 923 000 000"
                value={form.phone}
                onChange={updateForm}
              />
            </label>
          </div>

          <label>
            Descricao
            <textarea
              required
              name="description"
              placeholder="Fale dos detalhes, regras, disponibilidade..."
              rows="4"
              value={form.description}
              onChange={updateForm}
            />
          </label>

          <label className="upload-box">
            Fotos do anuncio
            <input
              accept="image/*"
              multiple
              type="file"
              onChange={handlePhotoUpload}
            />
            <span>Escolha ate 5 fotos para pre-visualizar.</span>
          </label>

          {form.photos.length > 0 && (
            <div className="preview-strip">
              {form.photos.map((photo, index) => (
                <img
                  src={photo}
                  alt={`Pre-visualizacao ${index + 1}`}
                  key={photo}
                />
              ))}
            </div>
          )}

          <button className="button primary" type="submit">
            Publicar para aprovacao
          </button>
        </form>
      </section>

      <section className="section dashboard-section">
        <div>
          <p className="eyebrow">Painel do proprietario</p>
          <h2>Seus anuncios neste navegador</h2>
        </div>
        <div className="owner-list">
          {listings.slice(0, 4).map((listing) => (
            <div className="owner-row" key={listing.id}>
              <img src={listing.photos[0]} alt={listing.title} />
              <div>
                <strong>{listing.title}</strong>
                <span>
                  {formatPrice(listing)} - {listing.status}
                </span>
              </div>
              <button
                className="text-button"
                type="button"
                onClick={() => setSelectedListing(listing)}
              >
                Abrir
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="section monetization-section" id="monetizar">
        <div>
          <p className="eyebrow">Como ganhar dinheiro depois</p>
          <h2>Modelos possiveis para Angola</h2>
        </div>
        <div className="plan-grid">
          <div>
            <strong>Anuncio destacado</strong>
            <p>O proprietario paga para aparecer no topo durante alguns dias.</p>
          </div>
          <div>
            <strong>Conta profissional</strong>
            <p>Imobiliarias e stands pagam mensalidade para publicar mais.</p>
          </div>
          <div>
            <strong>Taxa por contacto verificado</strong>
            <p>Cobrar por leads qualificadas quando houver mais movimento.</p>
          </div>
        </div>
      </section>

      <section className="section admin-section" id="admin">
        <div>
          <p className="eyebrow">Configuracoes e admin</p>
          <h2>Painel admin preparado por email</h2>
          <p>
            Por enquanto e modo demo. Quando adicionarmos Google Login, apenas o
            seu email real tera permissao para aprovar, destacar e apagar
            anuncios.
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
                        {listing.location} - {formatPrice(listing)}
                      </span>
                    </div>
                    <div className="admin-actions">
                      <button
                        type="button"
                        onClick={() =>
                          updateListing(listing.id, {
                            status:
                              listing.status === 'Ativo' ? 'Pendente' : 'Ativo',
                          })
                        }
                      >
                        {listing.status === 'Ativo' ? 'Pausar' : 'Aprovar'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateListing(listing.id, {
                            featured: !listing.featured,
                          })
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

      <section className="section steps" id="como-funciona">
        <div>
          <span>1</span>
          <h3>Proprietario publica</h3>
          <p>Adiciona fotos, preco em Kz, provincia e contacto.</p>
        </div>
        <div>
          <span>2</span>
          <h3>Admin aprova</h3>
          <p>O seu email controla anuncios, destaques e conteudo.</p>
        </div>
        <div>
          <span>3</span>
          <h3>Cliente contacta</h3>
          <p>O visitante liga ou abre WhatsApp para negociar.</p>
        </div>
      </section>

      {selectedListing && (
        <div
          className="modal-backdrop"
          role="button"
          tabIndex={0}
          onClick={() => setSelectedListing(null)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setSelectedListing(null)
          }}
        >
          <article
            className="listing-modal"
            role="dialog"
            aria-modal="true"
            aria-label={selectedListing.title}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setSelectedListing(null)}
            >
              Fechar
            </button>
            <img src={selectedListing.photos[0]} alt={selectedListing.title} />
            <div>
              <div className="listing-meta">
                <span>{selectedListing.category}</span>
                <span>{selectedListing.dealType}</span>
                <span>{selectedListing.status}</span>
              </div>
              <h2>{selectedListing.title}</h2>
              <p>{selectedListing.location}</p>
              <strong>{formatPrice(selectedListing)}</strong>
              <div className="detail-grid">
                <span>{selectedListing.bedrooms} quartos</span>
                <span>{selectedListing.bathrooms} casas de banho</span>
                <span>{selectedListing.province}</span>
              </div>
              <p>{selectedListing.description}</p>
              <div className="listing-actions">
                <a href={`tel:${selectedListing.phone}`}>Ligar agora</a>
                <a
                  href={whatsappLink(selectedListing)}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </article>
        </div>
      )}
    </main>
  )
}

function categoryIcon(category) {
  const icons = {
    Casa: 'CA',
    Apartamento: 'AP',
    Quarto: 'QT',
    Carro: 'CR',
    Terreno: 'TR',
    Loja: 'LJ',
  }
  return icons[category] || 'AN'
}

function formatPrice(listing) {
  const suffix = listing.dealType === 'Alugar' ? '/mes' : ''
  if (listing.category === 'Carro' && listing.dealType === 'Alugar') {
    return `${Number(listing.price).toLocaleString('pt-AO')} Kz/dia`
  }
  return `${Number(listing.price).toLocaleString('pt-AO')} Kz${suffix}`
}

function whatsappLink(listing) {
  const phone = listing.phone.replace(/\D/g, '')
  const message = encodeURIComponent(
    `Ola, tenho interesse no anuncio: ${listing.title}`,
  )
  return `https://wa.me/${phone}?text=${message}`
}

export default App
