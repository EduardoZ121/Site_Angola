export function OwnerStatsCards({ stats }) {
  const items = [
    { label: 'Total', value: stats.total },
    { label: 'Publicados', value: stats.active },
    { label: 'Em revisão', value: stats.pending },
    { label: 'Visualizações', value: stats.totalViews },
    { label: 'Em destaque', value: stats.featured },
    { label: 'Favoritos', value: stats.totalFavorites },
  ]

  return (
    <div className="owner-stats-grid">
      {items.map((item) => (
        <article className="owner-stat-card panel-card" key={item.label}>
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </article>
      ))}
    </div>
  )
}
