import { Link, Navigate, useParams } from 'react-router-dom'
import { defaultPhoto } from '../data/constants'
import { useMarketplace } from '../context/MarketplaceContext'
import { HomeIcon } from '../components/icons/HomeIcon'
import { TrustBadge } from '../components/ui'
import { formatKz, trustSealFromProfile } from '../utils/format'
import { PageIntro, SectionBlock } from '../components/SectionBlock'

export default function PublishSubmittedPage() {
  const { id } = useParams()
  const { getListing, profile, isListingOwner } = useMarketplace()
  const listing = getListing(id)

  if (!listing || !isListingOwner(listing)) {
    return (
      <main className="page-main">
        <PageIntro eyebrow="Publicar" title="Pedido não encontrado" />
        <SectionBlock>
          <div className="empty-state panel-card">
            <Link className="button primary" to="/publicar">
              Voltar a publicar
            </Link>
          </div>
        </SectionBlock>
      </main>
    )
  }

  const isPending = listing.status === 'Pendente'
  const isRejected = listing.status === 'Rejeitado'
  const isApproved = listing.status === 'Ativo'

  return (
    <main className="page-main">
      <PageIntro
        eyebrow="Publicação"
        title={
          isApproved
            ? 'Anúncio publicado'
            : isRejected
              ? 'Anúncio não aprovado'
              : 'Anúncio enviado com sucesso'
        }
        subtitle={
          isApproved
            ? 'O seu anúncio já está visível no Kuteka.'
            : isRejected
              ? 'Revise as fotos e informações e tente novamente.'
              : 'O seu pedido está pendente de aprovação pela equipa Kuteka.'
        }
      />

      <SectionBlock id="estado" eyebrow="Estado" title="Situação do pedido" tone="muted">
        <div className={`pending-banner panel-card ${isRejected ? 'rejected' : isApproved ? 'approved' : ''}`}>
          <span className="pending-icon" aria-hidden="true">
            <HomeIcon name={isApproved ? 'check' : isRejected ? 'x' : 'clock'} />
          </span>
          <div>
            <strong>
              {isApproved
                ? 'Publicado e visível no site'
                : isRejected
                  ? 'Não aprovado pelo administrador'
                  : 'Pendente de aprovação'}
            </strong>
            <p>
              {isApproved
                ? 'Parabéns! Recebeu confirmação por email (demo) e o anúncio já aparece nas pesquisas.'
                : isRejected
                  ? listing.rejectReason ||
                    'Conteúdo não conforme. Use fotos reais do imóvel ou veículo, não fotos pessoais.'
                  : 'Um administrador vai rever o perfil, as fotos e os detalhes antes de publicar no site.'}
            </p>
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
            <p>O anúncio está activo e já aparece em Arrendar e Comprar.</p>
          ) : isRejected ? (
            <p>Corrija o anúncio com base no motivo acima e clique em «Corrigir e reenviar».</p>
          ) : (
            <ol>
              <li>O administrador vê o pedido no painel de moderação.</li>
              <li>Se estiver conforme, clica em Aprovar e o anúncio fica público.</li>
              <li>Recebe uma mensagem (email demo) a confirmar a publicação.</li>
            </ol>
          )}
          <div className="add-property-success-actions">
            {isApproved ? (
              <>
                <Link className="button primary" to={`/anuncio/${listing.id}`}>
                  Ver anúncio publicado
                </Link>
                <Link className="button filter-button" to="/arrendar">
                  Ver no catálogo
                </Link>
              </>
            ) : isRejected ? (
              <>
                <Link className="button primary" to={`/painel/editar/${listing.id}`}>
                  Corrigir e reenviar
                </Link>
                <Link className="button filter-button" to="/painel">
                  Ir ao painel
                </Link>
              </>
            ) : null}
            <Link className="button filter-button" to="/painel">
              Ir ao painel
            </Link>
            <Link className="button filter-button" to="/conta">
              Ver mensagens na conta
            </Link>
            <Link className="text-button" to="/">
              Voltar ao início
            </Link>
          </div>
        </div>
      </SectionBlock>
    </main>
  )
}
