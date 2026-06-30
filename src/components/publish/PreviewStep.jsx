import { useMemo } from 'react'
import { getCategoryConfig } from '../../constants/publishCategories'
import { draftToRawListing } from '../../utils/publishDraft'
import { normalizeListing } from '../../utils/listing'
import { formatKz } from '../../utils/format'
import { HomeIcon } from '../icons/HomeIcon'
import { PublishLivePreview } from './PublishLivePreview'

const REVIEW_CHECKS = [
  'Título e descrição claros',
  'Localização correcta',
  'Fotos de boa qualidade',
  'Preço definido',
  'Contacto disponível',
]

export function PreviewStep({ draft, profile }) {
  const listing = useMemo(() => {
    const raw = draftToRawListing(draft, profile)
    raw.id = 'preview'
    raw.status = 'Ativo'
    raw.listingStatus = 'ACTIVE'
    return normalizeListing(raw)
  }, [draft, profile])

  const category = getCategoryConfig(draft.listingCategory)
  const photoCount = draft.photos?.length || 0
  const location =
    draft.municipality && draft.province ? `${draft.municipality}, ${draft.province}` : '—'

  return (
    <section className="publish-step panel-card publish-step-animate publish-review-step">
      <header className="publish-step-header">
        <h2>Revisão final</h2>
        <p>Confirme os dados antes de enviar. Pode voltar atrás para corrigir qualquer etapa.</p>
      </header>

      <div className="publish-review-grid">
        <div className="publish-review-summary">
          <article className="publish-review-card">
            <h3>Resumo do anúncio</h3>
            <dl className="publish-review-dl">
              <div>
                <dt>Categoria</dt>
                <dd>{category.label}</dd>
              </div>
              <div>
                <dt>Título</dt>
                <dd>{listing.title || '—'}</dd>
              </div>
              <div>
                <dt>Localização</dt>
                <dd>{location}</dd>
              </div>
              <div>
                <dt>Preço</dt>
                <dd>{draft.price ? formatKz(listing.price) : '—'}</dd>
              </div>
              <div>
                <dt>Fotos</dt>
                <dd>{photoCount} {photoCount === 1 ? 'foto' : 'fotos'}</dd>
              </div>
              <div>
                <dt>Contacto</dt>
                <dd>{draft.useProfilePhone ? profile.phone : draft.contactPhone || profile.phone || '—'}</dd>
              </div>
            </dl>
          </article>

          <article className="publish-review-card publish-review-checklist">
            <h3>Antes de publicar</h3>
            <ul>
              {REVIEW_CHECKS.map((item) => (
                <li key={item}>
                  <HomeIcon name="check" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="publish-review-note">
              Após envio, a equipa Kuteka revê o anúncio antes de ficar visível no catálogo.
            </p>
          </article>
        </div>

        <PublishLivePreview draft={draft} />
      </div>
    </section>
  )
}
