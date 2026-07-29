import { homeTestimonials } from '../../data/homeContent'

export function TestimonialsSection({ hideHead = false }) {
  return (
    <section className="hp-section hp-section-muted">
      <div className="hp-container">
        {hideHead ? null : (
          <div className="hp-section-head">
            <p className="hp-eyebrow dark">Testemunhos</p>
            <h2>O que dizem os utilizadores</h2>
            <p className="hp-section-lead">
              Exemplos de demonstração — avaliações reais quando a plataforma estiver activa.
            </p>
          </div>
        )}
        <div className="hp-testimonials-grid">
          {homeTestimonials.map((item) => (
            <article className="hp-testimonial-card" key={item.name}>
              <div className="hp-stars" aria-label={`${item.rating} estrelas`}>
                {'★'.repeat(item.rating)}
                {'☆'.repeat(5 - item.rating)}
              </div>
              <p>&ldquo;{item.text}&rdquo;</p>
              <footer>
                <strong>{item.name}</strong>
                <span>{item.role}</span>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
