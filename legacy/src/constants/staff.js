export const ADMIN_EMAILS = [
  'amarilinhaa@gmail.com',
  'vicentemakiesejb81@gmail.com',
]

export const ADMIN_EMAIL = ADMIN_EMAILS[0]
export const AGENT_EMAIL = 'amarilinhaz@gmail.com'

export const STAFF_ROLES = {
  admin: 'admin',
  agent: 'agent',
}

export function normalizeStaffEmail(email) {
  return email?.trim().toLowerCase() || ''
}

export function getStaffRole(email, approvedAgents = []) {
  const normalized = normalizeStaffEmail(email)
  if (!normalized) return null
  if (ADMIN_EMAILS.some((item) => item.toLowerCase() === normalized)) return STAFF_ROLES.admin

  const agentEmails = approvedAgents.map((item) =>
    normalizeStaffEmail(typeof item === 'string' ? item : item.email),
  )
  if (agentEmails.includes(normalized)) return STAFF_ROLES.agent
  return null
}

export function isAdminEmail(email) {
  return getStaffRole(email) === STAFF_ROLES.admin
}

export function isAgentEmail(email, approvedAgents = []) {
  return getStaffRole(email, approvedAgents) === STAFF_ROLES.agent
}

export function isStaffEmail(email, approvedAgents = []) {
  return Boolean(getStaffRole(email, approvedAgents))
}

export function isListingPending(listing) {
  if (!listing) return false
  return listing.status === 'Pendente' || listing.listingStatus === 'UNDER_REVIEW'
}

export function createSeedApprovedAgents() {
  return [
    {
      email: AGENT_EMAIL.toLowerCase(),
      name: 'Agente Kuteka',
      approvedAt: new Date().toISOString(),
      approvedBy: 'system',
    },
  ]
}