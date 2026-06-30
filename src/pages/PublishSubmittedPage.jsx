import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { defaultPhoto } from '../data/constants'
import { useMarketplace } from '../context/MarketplaceContext'
import { CatalogBreadcrumbs } from '../components/catalog/CatalogBreadcrumbs'
import { PublishCrossNav } from '../components/publish/PublishCrossNav'
import { PublishSubmittedActions } from '../components/publish/PublishSubmittedActions'
import { HomeIcon } from '../components/icons/HomeIcon'
import { HelpTip } from '../components/ui/HelpTip'
import { TrustBadge } from '../components/ui'
import { formatKz, trustSealFromProfile } from '../utils/format'
import { getSubmissionStatusMeta } from '../utils/publish'
import { PageIntro, SectionBlock } from '../components/SectionBlock'
import '../styles/publish.css'

export default function PublishSubmittedPage() {
  const { id } = useParams()
  const { getListing, profile, isListingOwner } = useMarketplace()
  const listing = getListing(id)
  const owned = listing && isListingOwner(listing)
  const statusMeta = getSubmissionStatusMeta(owned ? listing : null)

  useEffect(() => {
    document.title = owned ? 'Estado da publicação | Kuteka' : 'Publicação | Kuteka'
  }, [owned])

  if (!owned) {
    return (
      <main className="page-main publish-submitted-page">
        <PageIntro eyebrow="Publicar" title="Pedido não encontrado" />
        <div className="section-block-inner">
          <CatalogBreadcrumbs
            items={[
              { label: 'Início', to: '/inicio' },
              { label: 'Publicar', to: '/publicar' },
              { label: 'Estado', to: `/publicar/enviado/${id}` },
            ]}
          />
          <SectionBlock>
            <div className="empty-state panel-card">
              <p>Este anúncio não existe ou não pertence à sua conta.</p>
              <Link className="button primary" to="/publicar">
                Voltar a publicar
              </Link>
            </div>
          </SectionBlock>
          <PublishCrossNav />
        </div>
      </main>
    )
  }

  const isPending = listing.status === 'Pendente'
  const isRejected = listing.status === 'Rejeitado'
  const isApproved = listing.status === 'Ativo'

  return (
    <main className="page-main publish-submitted-page">
      <PageIntro
        eyebrow="Publicação"
        title={statusMeta.title}
        subtitle={statusMeta.subtitle}
      />

      <div className="section-block-inner">
        <CatalogBreadcrumbs
          items={[
            { label: 'Início', to: '/inicio' },
            { label: 'Painel', to: '/painel' },
            { label: 'Estado do anúncio', to: `/publicar/enviado/${listing.id}` },
          ]}
        />

        <p className="publish-help-line">
          Acompanhe aqui o estado do pedido até ficar visível no catálogo.
          <HelpTip
            label="Ajuda: moderação"
            text="A equipa Kuteka verifica fotos, preço e contactos. Em produção receberia email a cada mudança de estado."
          />
        </p>

        <SectionBlock id="estado" eyebrow="Estado" title="Situação do pedido" tone="muted">
          <div
            className={`pending-banner panel-card publish-status-banner publish-status-${statusMeta.tone}`}
          >
            <span className="pending-icon" aria-hidden="true">
              <HomeIcon name={statusMeta.icon} />
            </span>
            <div>
              <strong>{statusMeta.bannerTitle}</strong>
              <p>{statusMeta.bannerText}</p>
            </div>
            <span className={`status-pill status-${listing.status.toLowerCase()}`}>
              {listing.status}
            </span>
          </div>
        </SectionBlock>

        {isRejected ? (
          <SectionBlock id="motivo" eyebrow="Acção necessária" title="Motivo da rejeição">
            <div className="owner-reject-reason panel-card">
              <p>{listing.rejectReason || 'Conteúdo não conforme com as regras Kuteka.'}</p>
              <p>Corrija fotos, descrição ou preço e reenvie para nova revisão.</p>
              <Link className="button primary" to={`/painel/editar/${listing.id}`}>
                Corrigir e reenviar
              </Link>
            </div>
          </SectionBlock>
        ) : null}

        {isPending ? (
          <SectionBlock id="perfil" eyebrow="Anunciante" title="Perfil enviado para revisão">
            <div className="profile-review-card panel-card">
              <div className="profile-review-head">
                <span className="profile-avatar">{profile.name?.charAt(0) || '?'}</span>
                <div>
                  <strong>{profile.name}</strong>
                  <p>{profile.type}</p>
                </div>
                <span className="status-pill status-pending">Pendente</span>
              </div>
              <ul className="profile-review-list">
                <li>Email: {profile.email || '—'}</li>
                <li>Telefone: {profile.phone}</li>
                <li>Selo: {trustSealFromProfile(profile)}</li>
              </ul>
            </div>
          </SectionBlock>
        ) : null}

        <SectionBlock id="anuncio" eyebrow="Pré-visualização" title={listing.title}>
          <div className="pending-listing-preview panel-card">
            <img src={listing.photos?.[0] || defaultPhoto} alt={listing.title} />
            <div>
              <div className="listing-meta">
                <span>{listing.category}</span>
                <span>{listing.operation}</span>
                <TrustBadge listing={listing} />
              </div>
              <strong className="detail-price">{formatKz(listing.price)}</strong>
              <p>
                {listing.province} / {listing.municipality} / {listing.neighborhood}
              </p>
              <p>{listing.description}</p>
              <div className="preview-strip compact">
                {listing.photos.map((photo, index) => (
                  <img src={photo} alt={`Foto ${index + 1}`} key={`${listing.id}-${index}`} />
                ))}
              </div>
            </div>
          </div>

          <div className="pending-next-steps panel-card">
            <strong>O que acontece a seguir?</strong>
            {isApproved ? (
              <p>O anúncio está activo e já aparece nas pesquisas do Kuteka.</p>
            ) : isRejected ? (
              <p>Corrija o anúncio com base no motivo acima e clique em «Corrigir e reenviar».</p>
            ) : (
              <ol>
                <li>O administrador vê o pedido no painel de moderação.</li>
                <li>Se estiver conforme, clica em Aprovar e o anúncio fica público.</li>
                <li>Recebe uma mensagem (email demo) a confirmar a publicação.</li>
              </ol>
            )}

            <PublishSubmittedActions
              listing={listing}
              isApproved={isApproved}
              isRejected={isRejected}
              isPending={isPending}
            />
          </div>
        </SectionBlock>

        <PublishCrossNav />
      </div>
    </main>
  )
}
