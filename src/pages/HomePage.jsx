import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { provinces } from '../data/constants'
import { useMarketplace } from '../context/MarketplaceContext'
import { SectionBlock } from '../components/SectionBlock'

const sections = [
  {
    to: '/comprar',
    icon: '🏠',
    title: 'Comprar imóveis',
    text: 'Casas, apartamentos, terrenos e lojas para venda.',
    tab: 'comprar',
  },
  {
    to: '/arrendar',
    icon: '🔑',
    title: 'Arrendar imóveis',
    text: 'Arrendamento mensal em Kz com contacto directo.',
    tab: 'arrendar',
  },
  {
    to: '/veiculos',
    icon: '🚗',
    title: 'Veículos',
    text: 'Carros e pickups com filtros por marca e modelo.',
    tab: 'veiculos',
  },
  {
    to: '/publicar',
    icon: '📝',
    title: 'Publicar anúncio',
    text: 'Área do proprietário, agente ou empresa.',
    tab: null,
  },
]

const tools = [
  { to: '/conta', title: 'Minha conta', text: 'Perfil, verificação e selo de confiança.' },
  { to: '/favoritos', title: 'Favoritos', text: 'Anúncios guardados para ver depois.' },
  { to: '/comparar', title: 'Comparar', text: 'Compare até 3 imóveis ou veículos.' },
  { to: '/precos', title: 'Preços por zona', text: 'Médias em Kz por bairro e município.' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { listings, favorites } = useMarketplace()
  const [searchTab, setSearchTab] = useState('comprar')
  const [query, setQuery] = useState('')
  const [province, setProvince] = useState('Todos')

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
    <main className="home-page">
      {/* SECÇÃO 1 — Hero principal (só pesquisa) */}
      <section className="home-hero-section">
        <div className="home-hero-content">
          <p className="eyebrow eyebrow-light">Kuteka • Angola</p>
          <h1>Encontre casa, carro ou espaço com confiança.</h1>
          <p className="home-hero-lead">
            Cada botão abre a sua própria página — comprar, arrendar, veículos ou publicar.
          </p>

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
                Onde procura?
                <input
                  placeholder="Talatona, Kilamba, Toyota..."
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
        </div>
      </section>

      {/* SECÇÃO 2 — Navegar por área (cada card = página própria) */}
      <SectionBlock
        id="explorar"
        eyebrow="Explorar"
        title="Escolha a secção"
        subtitle="Cada opção abre uma página separada, como no Daft."
      >
        <div className="browse-grid">
          {sections.map((item) => (
            <Link className="browse-card" key={item.to} to={item.to}>
              <span className="browse-icon">{item.icon}</span>
              <strong>{item.title}</strong>
              <span>{item.text}</span>
              <em>Abrir página →</em>
            </Link>
          ))}
        </div>
      </SectionBlock>

      {/* SECÇÃO 3 — Ferramentas (páginas separadas) */}
      <SectionBlock
        id="ferramentas"
        eyebrow="Ferramentas"
        title="Conta e utilidades"
        subtitle="Favoritos, comparação, preços e perfil — cada um na sua página."
        tone="muted"
      >
        <div className="tools-grid">
          {tools.map((item) => (
            <Link className="tool-card" key={item.to} to={item.to}>
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </Link>
          ))}
        </div>
      </SectionBlock>

      {/* SECÇÃO 4 — Números rápidos */}
      <SectionBlock id="stats" eyebrow="Mercado" title="Kuteka em números" tone="dark">
        <div className="stats-grid">
          <div className="stat-card">
            <strong>{listings.length}</strong>
            <span>Anúncios activos</span>
          </div>
          <div className="stat-card">
            <strong>{favorites.length}</strong>
            <span>Favoritos guardados</span>
          </div>
          <div className="stat-card">
            <strong>{Object.keys(provinces).length}</strong>
            <span>Províncias</span>
          </div>
          <div className="stat-card">
            <strong>Kz</strong>
            <span>Moeda local</span>
          </div>
        </div>
      </SectionBlock>
    </main>
  )
}
