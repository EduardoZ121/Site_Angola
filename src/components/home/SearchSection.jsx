import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { provinces } from '../../data/constants'

const searchTypes = [
  { id: 'comprar', label: 'Comprar', path: '/comprar' },
  { id: 'arrendar', label: 'Arrendar', path: '/arrendar' },
  { id: 'veiculos', label: 'Veículos', path: '/veiculos' },
]

export function SearchSection() {
  const navigate = useNavigate()
  const [searchType, setSearchType] = useState('comprar')
  const [province, setProvince] = useState('Todos')
  const [municipality, setMunicipality] = useState('Todos')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [keyword, setKeyword] = useState('')

  const municipalities = useMemo(() => {
    if (province === 'Todos') return []
    return provinces[province] || []
  }, [province])

  function handleSubmit(event) {
    event.preventDefault()
    const type = searchTypes.find((item) => item.id === searchType) || searchTypes[0]
    const params = new URLSearchParams()
    if (province !== 'Todos') params.set('province', province)
    if (municipality !== 'Todos') params.set('municipality', municipality)
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    if (keyword.trim()) params.set('query', keyword.trim())
    const query = params.toString()
    navigate(`${type.path}${query ? `?${query}` : ''}`)
  }

  return (
    <section className="hp-section hp-search-wrap" id="pesquisa">
      <div className="hp-container">
        <form className="hp-search-card" onSubmit={handleSubmit}>
          <div className="hp-search-tabs" role="tablist" aria-label="Tipo de pesquisa">
            {searchTypes.map((item) => (
              <button
                key={item.id}
                type="button"
                className={searchType === item.id ? 'hp-search-tab active' : 'hp-search-tab'}
                onClick={() => setSearchType(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="hp-search-grid">
            <label className="hp-search-keyword">
              Palavra-chave
              <input
                type="search"
                placeholder="Ex: T3, Prado, terreno..."
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </label>
            <label>
              Província
              <select
                value={province}
                onChange={(event) => {
                  setProvince(event.target.value)
                  setMunicipality('Todos')
                }}
              >
                <option>Todos</option>
                {Object.keys(provinces).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Município
              <select
                value={municipality}
                onChange={(event) => setMunicipality(event.target.value)}
                disabled={province === 'Todos'}
              >
                <option>Todos</option>
                {municipalities.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Preço mínimo (Kz)
              <input
                type="number"
                min="0"
                placeholder="Ex: 50000"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
              />
            </label>
            <label>
              Preço máximo (Kz)
              <input
                type="number"
                min="0"
                placeholder="Ex: 5000000"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
              />
            </label>
          </div>
          <button className="hp-btn hp-btn-primary hp-search-submit" type="submit">
            Pesquisar
          </button>
        </form>
      </div>
    </section>
  )
}
