import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'kuteka.api.token'

export const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export function setApiToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function getApiToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export async function fetchApiHealth() {
  const { data } = await api.get('/health')
  return data
}

export async function loginWithGoogle(credential) {
  const { data } = await api.post('/auth/google', { credential })
  if (data.token) setApiToken(data.token)
  return data
}

export async function fetchListings(params) {
  const { data } = await api.get('/listings', { params })
  return data
}

export async function fetchPlans() {
  const { data } = await api.get('/plans')
  return data
}

export async function fetchAiStatus() {
  const { data } = await api.get('/ai/status')
  return data
}

export async function generateListingDescription(payload) {
  const { data } = await api.post('/ai/listing-description', payload)
  return data
}

export async function aiNaturalLanguageSearch(query, filters) {
  const { data } = await api.post('/ai/search', { query, filters })
  return data
}

export async function requestUploadUrl(payload) {
  const { data } = await api.post('/uploads/presign', payload)
  return data
}
