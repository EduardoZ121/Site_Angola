function buildPageList(current, total, maxVisible = 5) {
  if (total <= 1) return [1]
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  let start = Math.max(1, current - Math.floor(maxVisible / 2))
  let end = start + maxVisible - 1

  if (end > total) {
    end = total
    start = Math.max(1, end - maxVisible + 1)
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

export function CatalogPagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = buildPageList(page, totalPages, 5)

  return (
    <nav className="catalog-pagination" aria-label="Paginação de resultados">
      <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        ←
      </button>
      <div className="catalog-pagination-pages" role="group" aria-label="Número da página">
        {pages[0] > 1 ? (
          <>
            <button type="button" className={page === 1 ? 'active' : ''} onClick={() => onPageChange(1)}>
              1
            </button>
            {pages[0] > 2 ? <span className="catalog-pagination-ellipsis">…</span> : null}
          </>
        ) : null}
        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            className={pageNumber === page ? 'active' : ''}
            aria-current={pageNumber === page ? 'page' : undefined}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}
        {pages[pages.length - 1] < totalPages ? (
          <>
            {pages[pages.length - 1] < totalPages - 1 ? (
              <span className="catalog-pagination-ellipsis">…</span>
            ) : null}
            <button
              type="button"
              className={page === totalPages ? 'active' : ''}
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        ) : null}
      </div>
      <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        →
      </button>
    </nav>
  )
}
