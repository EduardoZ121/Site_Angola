export function ListingDetailSections({ listing }) {
  return (
    <>
      <section className="listing-block panel-card">
        <h3>Descrição</h3>
        <p>{listing.description}</p>
      </section>

      <section className="listing-block panel-card">
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
        <section className="listing-block panel-card">
          <h3>Comodidades</h3>
          <ul className="listing-tags">
            {listing.amenities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {listing.rules.length ? (
        <section className="listing-block panel-card">
          <h3>Regras</h3>
          <ul>
            {listing.rules.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {listing.documentation.length ? (
        <section className="listing-block panel-card">
          <h3>Documentação</h3>
          <ul>
            {listing.documentation.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  )
}
