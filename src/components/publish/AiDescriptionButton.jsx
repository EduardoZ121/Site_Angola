import { useState } from 'react'
import { generateListingDescription } from '../../lib/api'

export function AiDescriptionButton({ draft, onGenerated }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerate() {
    if (!draft.title?.trim()) {
      setError('Escreva um titulo antes de gerar a descricao.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const result = await generateListingDescription({
        title: draft.title,
        category: draft.listingCategory,
        operation: draft.operation,
        province: draft.province,
        municipality: draft.municipality,
        bedrooms: draft.bedrooms,
        price: draft.price,
        notes: draft.description,
      })
      if (!result.ok) {
        setError(result.error || 'IA indisponivel')
        return
      }
      onGenerated(result.description)
    } catch {
      setError('Nao foi possivel contactar a API. Verifique se npm run dev esta activo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="publish-ai-desc">
      <button type="button" className="button filter-button" onClick={handleGenerate} disabled={loading}>
        {loading ? 'A gerar...' : 'Gerar descricao com IA'}
      </button>
      {error ? <p className="publish-ai-error">{error}</p> : null}
    </div>
  )
}