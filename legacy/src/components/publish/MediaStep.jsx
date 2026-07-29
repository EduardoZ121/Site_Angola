import { MediaUploader } from './MediaUploader'
import { PublishFieldHint } from './PublishFieldHint'

export function MediaStep({ draft, onChange }) {
  return (
    <section className="publish-step panel-card publish-step-animate">
      <header className="publish-step-header">
        <h2>Fotografias</h2>
        <p>A primeira foto (capa) é a que mais aparece nos resultados.</p>
      </header>

      <PublishFieldHint>
        Anúncios com mais de 8 fotos recebem muito mais visualizações. Use luz natural sempre que possível.
      </PublishFieldHint>

      <MediaUploader
        photos={draft.photos}
        coverIndex={draft.coverIndex}
        onChange={(photos, coverIndex = draft.coverIndex) => onChange({ photos, coverIndex })}
      />
    </section>
  )
}
