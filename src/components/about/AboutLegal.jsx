import { Link } from 'react-router-dom'

export function AboutLegalNav({ sections }) {
  return (
    <nav className="about-legal-nav panel-card" aria-label="Informação legal">
      {sections.map((section) => (
        <a key={section.id} className="about-legal-nav-link" href={`#${section.id}`}>
          {section.title}
        </a>
      ))}
    </nav>
  )
}

export function AboutLegalSections({ sections }) {
  return (
    <div className="about-legal-sections">
      {sections.map((section) => (
        <section className="about-legal-block panel-card" id={section.id} key={section.id}>
          <h2>{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
          {section.links?.length ? (
            <div className="about-legal-links">
              {section.links.map((link) => (
                <Link key={link.to} className="text-button" to={link.to}>
                  {link.label}
                </Link>
              ))}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  )
}
