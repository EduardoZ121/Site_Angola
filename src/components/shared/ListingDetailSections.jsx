export function ListingDetailSections({ listing, compact = false }) {
  const blockClass = compact ? 'listing-block listing-block-compact panel-card' : 'listing-block panel-card'

  return (
    <>
      <section className={blockClass}>
        <h3>Descrição</h3>
        <p className="listing-desc-text">{listing.description}</p>
      </section>

      <section className={blockClass}>
        <h3>Características</h3>
        <dl className="listing-features-grid">
          {listing.features.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {listing.amenities.length ? (
        <section className={blockClass}>
          <h3>Comodidades</h3>
          <ul className="listing-tags">
            {listing.amenities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {listing.rules.length ? (
        <section className={`${blockClass} listing-block-inline`}>
          <h3>Regras</h3>
          <ul className="listing-inline-list">
            {listing.rules.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {listing.documentation.length ? (
        <section className={`${blockClass} listing-block-inline`}>
          <h3>Documentação</h3>
          <ul className="listing-inline-list">
            {listing.documentation.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  )
}
