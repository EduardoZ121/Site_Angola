import { MediaUploader } from './MediaUploader'

export function MediaStep({ draft, onChange }) {
  return (
    <section className="publish-step panel-card">
      <h2>Fotografias</h2>
      <p>Adicione fotos reais. A primeira (ou capa seleccionada) aparece em destaque.</p>
      <MediaUploader
        photos={draft.photos}
        coverIndex={draft.coverIndex}
        onChange={(photos, coverIndex = draft.coverIndex) => onChange({ photos, coverIndex })}
      />
    </section>
  )
}
