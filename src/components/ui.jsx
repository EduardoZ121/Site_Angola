export function Toggle({ label, checked, onToggle }) {
  return (
    <button
      type="button"
      className={`toggle-btn ${checked ? 'active' : ''}`}
      onClick={onToggle}
    >
      {checked ? '✓' : '○'} {label}
    </button>
  )
}

export function FilterSelect({ label, value, onChange, options }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

export function TrustBadge({ listing }) {
  const tone =
    listing.trustSeal === 'Ouro'
      ? 'trust-gold'
      : listing.trustSeal === 'Prata'
        ? 'trust-silver'
        : 'trust-none'
  return <span className={`trust-badge ${tone}`}>{listing.trustSeal}</span>
}
