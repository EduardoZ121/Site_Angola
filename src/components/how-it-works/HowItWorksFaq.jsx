import { HOW_IT_WORKS_FAQ } from '../../utils/howItWorks'

export function HowItWorksFaq() {
  return (
    <section className="hiw-faq panel-card" aria-labelledby="hiw-faq-title">
      <h2 id="hiw-faq-title">Perguntas frequentes</h2>
      <div className="hiw-faq-list">
        {HOW_IT_WORKS_FAQ.map((item) => (
          <details key={item.question} className="hiw-faq-item">
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
