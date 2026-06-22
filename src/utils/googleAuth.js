export function parseGoogleCredential(credential) {
  if (!credential || typeof credential !== 'string') return null

  try {
    const payload = credential.split('.')[1]
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(normalized)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    )
    const data = JSON.parse(json)

    return {
      googleId: data.sub,
      name: data.name || '',
      email: data.email || '',
      picture: data.picture || '',
      emailVerified: Boolean(data.email_verified),
    }
  } catch {
    return null
  }
}

export function loadGoogleIdentityScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google)
      return
    }

    const existing = document.querySelector('script[data-google-identity]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google), { once: true })
      existing.addEventListener('error', reject, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    script.onload = () => resolve(window.google)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
