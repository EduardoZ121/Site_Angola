import { PUBLISH_CATEGORIES } from '../../constants/publishCategories'

export function CategoryStep({ draft, onSelect }) {
  return (
    <section className="publish-step panel-card">
      <h2>Que tipo de anúncio quer publicar?</h2>
      <p>Escolha a categoria — só verá campos relevantes nos passos seguintes.</p>
      <div className="publish-category-grid">
        {PUBLISH_CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`publish-category-card ${draft.listingCategory === item.id ? 'selected' : ''}`}
            onClick={() => onSelect(item.id)}
          >
            <strong>{item.label}</strong>
            <span>{item.category === 'Veículo' ? 'Venda' : 'Imóvel'}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
