import { OAuth2Client } from 'google-auth-library'
import { env } from '../config/env.js'

let client = null

function getClient() {
  if (!env.googleClientId) return null
  if (!client) client = new OAuth2Client(env.googleClientId)
  return client
}

export async function verifyGoogleCredential(credential) {
  const oauth = getClient()
  if (!oauth) {
    return { ok: false, error: 'GOOGLE_CLIENT_ID não configurado' }
  }

  const ticket = await oauth.verifyIdToken({
    idToken: credential,
    audience: env.googleClientId,
  })

  const payload = ticket.getPayload()
  if (!payload?.email) {
    return { ok: false, error: 'Token Google inválido' }
  }

  return {
    ok: true,
    user: {
      name: payload.name || payload.email.split('@')[0],
      email: payload.email.toLowerCase(),
      googleId: payload.sub,
      picture: payload.picture || '',
      emailVerified: payload.email_verified,
    },
  }
}
