import { fetchApiHealth, fetchListings, getApiToken } from '../lib/api'

export async function loadListingsFromApi() {
  try {
    const health = await fetchApiHealth()
    if (health.integrations?.mongodb !== 'connected') return null
    const data = await fetchListings()
    return data.listings?.length ? data.listings : null
  } catch {
    return null
  }
}

export function isApiBackendReady(health) {
  return health?.integrations?.mongodb === 'connected'
}

export function hasApiSession() {
  return Boolean(getApiToken())
}