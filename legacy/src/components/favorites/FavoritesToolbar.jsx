const SORT_OPTIONS = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'price-asc', label: 'Preço ↑' },
  { value: 'price-desc', label: 'Preço ↓' },
]

export function FavoritesToolbar({ total, sort, onSortChange, onClearAll, onAddToCompare, compareFull }) {
  if (!total) return null

  return (
    <div className="favorites-toolbar panel-card">
      <p className="favorites-toolbar-count">
        <strong>{total}</strong> {total === 1 ? 'resultado' : 'resultados'}
      </p>
      <div className="favorites-toolbar-actions">
        <label className="favorites-sort">
          <span className="sr-only">Ordenar favoritos</span>
          Ordenar
          <select value={sort} onChange={(event) => onSortChange(event.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="text-button"
          onClick={onAddToCompare}
          disabled={compareFull}
          title={compareFull ? 'Já tem 3 anúncios na comparação' : undefined}
        >
          Adicionar à comparação
        </button>
        <button type="button" className="text-button favorites-clear-btn" onClick={onClearAll}>
          Limpar todos
        </button>
      </div>
    </div>
  )
}
