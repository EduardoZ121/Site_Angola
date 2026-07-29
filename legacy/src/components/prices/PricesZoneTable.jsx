import { Link } from 'react-router-dom'
import { formatKz } from '../../utils/format'
import { buildZoneCatalogLink } from '../../utils/prices'

export function PricesZoneTable({ rows, filterId, maxAvg }) {
  if (!rows.length) return null

  const isRent = filterId === 'rent'
  const suffix = isRent ? '/mês' : ''

  return (
    <section className="prices-zone-table-wrap panel-card" aria-labelledby="prices-zone-title">
      <h2 id="prices-zone-title" className="prices-section-title">
        Médias por bairro
      </h2>
      <div className="prices-zone-scroll">
        <table className="prices-zone-table">
          <thead>
            <tr>
              <th scope="col">Zona</th>
              <th scope="col">Média</th>
              <th scope="col">Intervalo</th>
              <th scope="col">Anúncios</th>
              <th scope="col">
                <span className="sr-only">Acções</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const barWidth = maxAvg ? Math.max(12, Math.round((row.avg / maxAvg) * 100)) : 0
              return (
                <tr key={row.zone}>
                  <td>
                    <div className="prices-zone-name">{row.neighborhood}</div>
                    <div className="prices-zone-sub">
                      {row.municipality}, {row.province}
                    </div>
                    <div
                      className="prices-zone-bar"
                      style={{ width: `${barWidth}%` }}
                      aria-hidden="true"
                    />
                  </td>
                  <td className="prices-zone-avg">
                    {formatKz(row.avg)}
                    {suffix}
                  </td>
                  <td className="prices-zone-range">
                    {formatKz(row.min)} – {formatKz(row.max)}
                    {suffix}
                  </td>
                  <td>{row.count}</td>
                  <td>
                    <Link className="text-button" to={buildZoneCatalogLink(row, filterId)}>
                      Ver anúncios
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
