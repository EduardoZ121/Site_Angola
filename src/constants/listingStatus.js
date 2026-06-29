export const LISTING_STATUS = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  RENTED: 'RENTED',
  SOLD: 'SOLD',
  EXPIRED: 'EXPIRED',
  DRAFT: 'DRAFT',
  READY: 'READY',
  UNDER_REVIEW: 'UNDER_REVIEW',
  PUBLISHED: 'PUBLISHED',
  REJECTED: 'REJECTED',
  ARCHIVED: 'ARCHIVED',
}

const legacyMap = {
  Ativo: LISTING_STATUS.ACTIVE,
  Pendente: LISTING_STATUS.UNDER_REVIEW,
  Rejeitado: LISTING_STATUS.REJECTED,
}

export function normalizeListingStatus(status) {
  if (Object.values(LISTING_STATUS).includes(status)) return status
  return legacyMap[status] || LISTING_STATUS.PENDING
}

export function isListingPublic(status) {
  const normalized = normalizeListingStatus(status)
  return normalized === LISTING_STATUS.ACTIVE || normalized === LISTING_STATUS.PUBLISHED
}
