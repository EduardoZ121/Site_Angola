import { computeHomeMarketStats } from '../../utils/homeStats'

export function HomeHeroStats({ listings }) {
  const stats = computeHomeMarketStats(listings)

  const items = [
    { value: stats.totalActive, label: 'Anúncios activos' },
    { value: stats.forRent, label: 'Arrendamentos' },
    { value: stats.vehicles, label: 'Veículos' },
    { value: stats.provinces, label: 'Províncias' },
  ]

  return (
    <ul className="hp-hero-stats" aria-label="Números do marketplace">
      {items.map((item) => (
        <li key={item.label}>
          <strong>{item.value.toLocaleString('pt-PT')}</strong>
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  )
}
