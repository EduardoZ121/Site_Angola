const toneMap = {
  Destaque: 'badge-featured',
  Verificado: 'badge-verified',
  Novo: 'badge-new',
  Urgente: 'badge-urgent',
  Exclusivo: 'badge-exclusive',
  Premium: 'badge-premium',
}

export function ListingBadge({ label }) {
  return <span className={`listing-badge ${toneMap[label] || 'badge-default'}`}>{label}</span>
}

export function ListingBadgeList({ badges = [] }) {
  if (!badges.length) return null
  return (
    <div className="listing-badge-list">
      {badges.map((label) => (
        <ListingBadge key={label} label={label} />
      ))}
    </div>
  )
}
