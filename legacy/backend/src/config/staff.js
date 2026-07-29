export const ADMIN_EMAILS = [
  'amarilinhaa@gmail.com',
  'vicentemakiesejb81@gmail.com',
]

export const AGENT_EMAIL = 'amarilinhaz@gmail.com'

export function normalizeEmail(email) {
  return email?.trim().toLowerCase() || ''
}

export function isAdminEmail(email) {
  const normalized = normalizeEmail(email)
  return ADMIN_EMAILS.some((item) => item.toLowerCase() === normalized)
}

export function isAgentEmail(email) {
  return normalizeEmail(email) === AGENT_EMAIL.toLowerCase()
}