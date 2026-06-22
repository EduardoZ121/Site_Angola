export function encodePassword(password) {
  return btoa(unescape(encodeURIComponent(password)))
}

export function verifyPassword(password, hash) {
  return encodePassword(password) === hash
}

export function createSessionId() {
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
