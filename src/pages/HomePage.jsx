import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { provinces } from '../data/constants'
import { useMarketplace } from '../context/MarketplaceContext'
import { ListingCard } from '../components/ListingCard'

export default function HomePage() {
  const navigate = useNavigate()
  const { listings, favorites, compare, toggleFavorite, toggleCompare } = useMarketplace()
  const [searchTab, setSearchTab] = useState('comprar')
  const [query, setQuery] = useState('')
  const [province, setProvince] = useState('Todos')

  const featured = useMemo(
    () => listings.filter((listing) => listing.featured && listing.status === 'Ativo').slice(0, 3),
    [listings],
  )
  const recent = useMemo(
    () => [...listings].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 4),
    [listings],
  )

  function runSearch(event) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (province !== 'Todos') params.set('province', province)
    const base =
      searchTab === 'arrendar' ? '/arrendar' : searchTab === 'veiculos' ? '/veiculos' : '/comprar'
    navigate(`${base}?${params.toString()}`)
  }

  return (
    <main>
      <section className="hero home-hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Kuteka • Angola</p>
            <h1>Encontre casa, carro ou espaço com confiança.</h1>
            <p className="hero-text">
              Organizado como o Daft: páginas separadas para comprar, arrendar, veículos e publicar.
            </p>
          </div>
        </div>

        <form className="home-search-card" onSubmit={runSearch}>
          <div className="search-tabs" role="tablist" aria-label="Tipo de pesquisa">
            <button
              type="button"
              className={searchTab === 'comprar' ? 'search-tab active' : 'search-tab'}
              onClick={() => setSearchTab('comprar')}
            >
              Comprar
            </button>
            <button
              type="button"
              className={searchTab === 'arrendar' ? 'search-tab active' : 'search-tab'}
              onClick={() => setSearchTab('arrendar')}
            >
              Arrendar
            </button>
            <button
              type="button"
              className={searchTab === 'veiculos' ? 'search-tab active' : 'search-tab'}
              onClick={() => setSearchTab('veiculos')}
            >
              Veículos
            </button>
          </div>
          <div className="home-search-fields">
            <label>
              Província, município ou bairro
              <input
                placeholder="Ex: Talatona, Kilamba, Toyota..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label>
              Província
              <select value={province} onChange={(event) => setProvince(event.target.value)}>
                <option>Todos</option>
                {Object.keys(provinces).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <button className="button primary" type="submit">
              Pesquisar
            </button>
          </div>
        </form>
      </section>

      <section className="section page-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Explorar</p>
            <h2>Navegue por secção</h2>
          </div>
        </div>
        <div className="browse-grid">
          <Link className="browse-card" to="/comprar">
            <strong>Comprar imóveis</strong>
            <span>Casas, apartamentos, terrenos e lojas</span>
          </Link>
          <Link className="browse-card" to="/arrendar">
            <strong>Arrendar imóveis</strong>
            <span>Arrendamento mensal em Kz</span>
          </Link>
          <Link className="browse-card" to="/veiculos">
            <strong>Veículos</strong>
            <span>Carros e pickups para venda</span>
          </Link>
          <Link className="browse-card" to="/publicar">
            <strong>Publicar anúncio</strong>
            <span>Área do proprietário e agentes</span>
          </Link>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section page-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Destaques</p>
              <h2>Anúncios em destaque</h2>
            </div>
          </div>
          <div className="listing-grid">
            {featured.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                favorites={favorites}
                compareIds={compare}
                onFavorite={toggleFavorite}
                onCompare={toggleCompare}
              />
            ))}
          </div>
        </section>
      )}

      <section className="section page-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Recentes</p>
            <h2>Adicionados recentemente</h2>
          </div>
          <Link className="text-button" to="/comprar">
            Ver todos
          </Link>
        </div>
        <div className="listing-grid">
          {recent.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              favorites={favorites}
              compareIds={compare}
              onFavorite={toggleFavorite}
              onCompare={toggleCompare}
            />
          ))}
        </div>
      </section>

      <section className="section page-section tools-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Ferramentas</p>
            <h2>Para compradores e vendedores</h2>
          </div>
        </div>
        <div className="tools-grid">
          <Link className="tool-card" to="/precos">
            <strong>Preços por zona</strong>
            <span>Médias em Kz por bairro</span>
          </Link>
          <Link className="tool-card" to="/comparar">
            <strong>Comparar anúncios</strong>
            <span>Até 3 imóveis ou veículos</span>
          </Link>
          <Link className="tool-card" to="/favoritos">
            <strong>Os meus favoritos</strong>
            <span>{favorites.length} guardados</span>
          </Link>
          <Link className="tool-card" to="/conta">
            <strong>Minha conta</strong>
            <span>Perfil, verificação e selo</span>
          </Link>
        </div>
      </section>

      <section className="section page-section trust-strip">
        <div>
          <strong>{listings.length}</strong>
          <span>Anúncios</span>
        </div>
        <div>
          <strong>Kz</strong>
          <span>Moeda local</span>
        </div>
        <div>
          <strong>{Object.keys(provinces).length}</strong>
          <span>Províncias</span>
        </div>
        <div>
          <strong>Directo</strong>
          <span>WhatsApp e chat</span>
        </div>
      </section>
    </main>
  )
}
