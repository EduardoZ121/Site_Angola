import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { activeFilterCount, filtersToSearchParams } from '../utils/filters'

export function ListingSearchBar({ filters, filtersPath, onSearch }) {
  const [query, setQuery] = useState(filters.query || '')
  const filterCount = activeFilterCount(filters, {
    category: filters.category,
    operation: filters.operation,
  })

  useEffect(() => {
    setQuery(filters.query || '')
  }, [filters.query])

  function handleSubmit(event) {
    event.preventDefault()
    onSearch(query.trim())
  }

  const filterLink = `${filtersPath}?${filtersToSearchParams(filters).toString()}`

  return (
    <form className="listing-search-bar panel-card" onSubmit={handleSubmit}>
      <div className="listing-search-row">
        <label className="listing-search-field">
          <span className="sr-only">Pesquisar</span>
          <input
            placeholder="Bairro, zona, título do imóvel..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <Link className="button filter-button" to={filterLink}>
          Filtros e mapa{filterCount > 0 ? ` (${filterCount})` : ''}
        </Link>
        <button className="button primary" type="submit">
          Pesquisar
        </button>
      </div>
    </form>
  )
}
