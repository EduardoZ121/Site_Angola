import { PUBLISH_STEPS } from '../constants/publishCategories'

export const PUBLISH_CROSS_LINKS = [
  { to: '/painel', label: 'Painel', icon: 'grid' },
  { to: '/precos', label: 'Preços por zona', icon: 'chart' },
  { to: '/como-funciona', label: 'Como funciona', icon: 'handshake' },
  { to: '/adicionar-propriedade', label: 'Pedir apoio', icon: 'message' },
]

export const ADD_PROPERTY_CROSS_LINKS = [
  { to: '/publicar', label: 'Publicar anúncio', icon: 'edit' },
  { to: '/precos', label: 'Preços', icon: 'chart' },
  { to: '/como-funciona', label: 'Como funciona', icon: 'handshake' },
  { to: '/painel', label: 'Painel', icon: 'grid' },
]

export function computePublishMarketStats(listings = []) {
  const active = listings.filter((item) => item.status === 'Ativo')
  const pending = listings.filter((item) => item.status === 'Pendente')
  const ownerEmails = new Set(active.map((item) => item.ownerEmail).filter(Boolean))

  return {
    activeCount: active.length,
    pendingCount: pending.length,
    ownerCount: ownerEmails.size,
    propertyCount: active.filter((item) => item.category === 'Imóvel').length,
    vehicleCount: active.filter((item) => item.category === 'Veículo').length,
  }
}

export function getPublishStepLabel(stepId) {
  return PUBLISH_STEPS.find((step) => step.id === stepId)?.label || 'Passo'
}

export function getSubmissionStatusMeta(listing) {
  if (!listing) {
    return {
      tone: 'unknown',
      title: 'Pedido não encontrado',
      subtitle: 'Não encontrámos este anúncio na sua conta.',
      icon: 'x',
      bannerTitle: 'Indisponível',
      bannerText: 'Volte a publicar ou consulte o painel.',
    }
  }

  if (listing.status === 'Ativo') {
    return {
      tone: 'approved',
      title: 'Anúncio publicado',
      subtitle: 'O seu anúncio já está visível no Kuteka.',
      icon: 'check',
      bannerTitle: 'Publicado e visível no site',
      bannerText:
        'Parabéns! Recebeu confirmação por email (demo) e o anúncio já aparece nas pesquisas.',
    }
  }

  if (listing.status === 'Rejeitado') {
    return {
      tone: 'rejected',
      title: 'Anúncio não aprovado',
      subtitle: 'Revise as fotos e informações e tente novamente.',
      icon: 'x',
      bannerTitle: 'Não aprovado pelo administrador',
      bannerText:
        listing.rejectReason ||
        'Conteúdo não conforme. Use fotos reais do imóvel ou veículo, não fotos pessoais.',
    }
  }

  return {
    tone: 'pending',
    title: 'Anúncio enviado com sucesso',
    subtitle: 'O seu pedido está pendente de aprovação pela equipa Kuteka.',
    icon: 'clock',
    bannerTitle: 'Pendente de aprovação',
    bannerText:
      'Um administrador vai rever o perfil, as fotos e os detalhes antes de publicar no site.',
  }
}
