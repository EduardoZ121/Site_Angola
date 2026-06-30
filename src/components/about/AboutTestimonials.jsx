import { homeTestimonials } from '../../data/homeContent'
import { HelpTip } from '../ui/HelpTip'

export function AboutTestimonials() {
  return (
    <section className="about-testimonials" aria-labelledby="about-testimonials-title">
      <div className="about-testimonials-head">
        <h2 id="about-testimonials-title" className="about-section-title">
          O que dizem os utilizadores
        </h2>
        <HelpTip
          label="Ajuda: testemunhos"
          text="Exemplos de demonstração — avaliações reais quando a plataforma estiver em produção."
        />
      </div>
      <div className="about-testimonials-grid">
        {homeTestimonials.map((item) => (
          <article className="about-testimonial-card panel-card" key={item.name}>
            <div className="about-stars" aria-label={`${item.rating} estrelas`}>
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
    </section>
  )
}
