import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'
import { HelpTip } from '../ui/HelpTip'
import { formatPublishedDate } from '../../utils/listingDetail'

export function ListingDetailMetaStrip({ listing }) {
  const published = formatPublishedDate(listing.publishedAt || listing.updatedAt)
  const views = listing.analytics?.views ?? 0
  const seal = listing.verification?.seal || listing.trustSeal

  return (
    <div className="listing-detail-meta-strip panel-card">
      <div className="listing-detail-meta-item">
        <span className="listing-detail-meta-label">Visualizações</span>
        <strong>{views}</strong>
        <HelpTip
          label="Ajuda: visualizações"
          text="Número de vezes que este anúncio foi aberto na Kuteka."
        />
      </div>
      {published ? (
        <div className="listing-detail-meta-item">
          <span className="listing-detail-meta-label">Publicado</span>
          <strong>{published}</strong>
        </div>
      ) : null}
      {seal ? (
        <div className="listing-detail-meta-item">
          <span className="listing-detail-meta-label">Confiança</span>
          <strong>{seal}</strong>
          <HelpTip
            label="Ajuda: selo de confiança"
            text="Selo atribuído com base na verificação de perfil, telefone e documentos do anunciante."
          />
        </div>
      ) : null}
      <Link className="listing-detail-meta-link text-button" to="/como-funciona">
        Como funciona
      </Link>
    </div>
  )
}
