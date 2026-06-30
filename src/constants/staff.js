import { LISTING_STATUS } from './listingStatus'

export const ADMIN_EMAIL = 'amarilinhaa@gmail.com'
export const AGENT_EMAIL = 'amarilinhaz@gmail.com'

export const STAFF_ROLES = {
  admin: 'admin',
  agent: 'agent',
}

export function normalizeStaffEmail(email) {
  return email?.trim().toLowerCase() || ''
}

export function getStaffRole(email) {
  const normalized = normalizeStaffEmail(email)
  if (!normalized) return null
  if (normalized === ADMIN_EMAIL.toLowerCase()) return STAFF_ROLES.admin
  if (normalized === AGENT_EMAIL.toLowerCase()) return STAFF_ROLES.agent
  return null
}

export function isAdminEmail(email) {
  return getStaffRole(email) === STAFF_ROLES.admin
}

export function isAgentEmail(email) {
  return getStaffRole(email) === STAFF_ROLES.agent
}

export function isStaffEmail(email) {
  return Boolean(getStaffRole(email))
}

export function isListingPending(listing) {
  if (!listing) return false
  return (
    listing.status === 'Pendente' ||
    listing.listingStatus === LISTING_STATUS.UNDER_REVIEW
  )
}
