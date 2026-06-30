import { formatKz } from '../../utils/format'
import { buildCompareFeatureRows, getCompareCellValue } from '../../utils/compare'

function formatCellDisplay(item, row) {
  if (row.type === 'price') {
    const price = formatKz(item.price)
    return item.operation === 'Arrendamento' ? `${price}/mês` : price
  }
  return getCompareCellValue(item, row)
}

export function CompareFeatureTable({ items, lowestId }) {
  const rows = buildCompareFeatureRows(items)
  if (!items.length || !rows.length) return null

  return (
    <div className="compare-feature-table-wrap panel-card">
      <h3 className="compare-feature-title">Comparação detalhada</h3>
      <div className="compare-feature-scroll">
        <table className="compare-feature-table">
          <thead>
            <tr>
              <th scope="col">Campo</th>
              {items.map((item) => (
                <th scope="col" key={item.id}>
                  {item.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <th scope="row">{row.label}</th>
                {items.map((item) => {
                  const isLowest = row.type === 'price' && item.id === lowestId
                  return (
                    <td key={`${item.id}-${row.key}`} className={isLowest ? 'is-lowest' : ''}>
                      {formatCellDisplay(item, row)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
