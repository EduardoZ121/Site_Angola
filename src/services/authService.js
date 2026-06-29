import { STORAGE_KEYS } from '../data/constants'
import { createSessionId, encodePassword, verifyPassword } from '../utils/localAuth'

/** Camada de persistência local — substituir por fetch() quando existir API. */

export function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function readAccounts() {
  return readJson(STORAGE_KEYS.accounts, [])
}

export function writeAccounts(accounts) {
  writeJson(STORAGE_KEYS.accounts, accounts)
}

export function readPasswordResetTokens() {
  return readJson(STORAGE_KEYS.passwordResetTokens, [])
}

export function writePasswordResetTokens(tokens) {
  writeJson(STORAGE_KEYS.passwordResetTokens, tokens)
}

export function findAccountByEmail(email) {
  const normalized = normalizeEmail(email)
  return readAccounts().find((account) => account.email === normalized) || null
}

/** Modelo de utilizador preparado para API — campos vazios até existirem no backend. */
export function buildUserSession({ name, email, sessionId, googleId, picture, emailVerified }) {
  const now = new Date().toISOString()
  return {
    name: name || '',
    email: email || '',
    sessionId: sessionId || createSessionId(),
    googleId: googleId || '',
    picture: picture || '',
    avatar: picture || '',
    emailVerified: emailVerified ?? false,
    phoneVerified: false,
    documentsVerified: false,
    verified: false,
    role: '',
    subscription: '',
    preferredProvince: '',
    language: 'pt-AO',
    currency: 'AOA',
    createdAt: now,
  }
}

export function validateRegistration({ name, email, password, confirmPassword }) {
  if (!name?.trim()) {
    return { ok: false, error: 'Indique o seu nome completo.' }
  }
  if (!normalizeEmail(email).includes('@')) {
    return { ok: false, error: 'Indique um email válido.' }
  }
  if (password.length < 6) {
    return { ok: false, error: 'A senha deve ter pelo menos 6 caracteres.' }
  }
  if (password !== confirmPassword) {
    return { ok: false, error: 'As senhas não coincidem.' }
  }
  return { ok: true }
}

export function registerAccount({ name, email, password }) {
  const normalizedEmail = normalizeEmail(email)

  if (findAccountByEmail(normalizedEmail)) {
    return { ok: false, error: 'Este email já está cadastrado. Entre com a sua senha.' }
  }

  const account = {
    email: normalizedEmail,
    name: name.trim(),
    passwordHash: encodePassword(password),
    createdAt: new Date().toISOString(),
  }

  writeAccounts([account, ...readAccounts()])

  return {
    ok: true,
    session: buildUserSession({
      name: account.name,
      email: account.email,
      emailVerified: false,
    }),
  }
}

export function authenticateAccount({ email, password }) {
  const account = findAccountByEmail(email)

  if (!account || !verifyPassword(password, account.passwordHash)) {
    return { ok: false, error: 'Email ou senha incorrectos.' }
  }

  return {
    ok: true,
    session: buildUserSession({
      name: account.name,
      email: account.email,
      emailVerified: false,
    }),
  }
}

export function requestPasswordReset(email) {
  const normalizedEmail = normalizeEmail(email)
  const account = findAccountByEmail(normalizedEmail)

  if (!account) {
    return { ok: false, error: 'Não encontrámos conta com este email.' }
  }

  const token = `rst-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
  const expiresAt = Date.now() + 60 * 60 * 1000

  const tokens = readPasswordResetTokens().filter((entry) => entry.email !== normalizedEmail)
  tokens.push({ token, email: normalizedEmail, expiresAt })
  writePasswordResetTokens(tokens)

  return { ok: true, token, email: normalizedEmail }
}

export function resetPasswordWithToken({ token, password, confirmPassword }) {
  if (password.length < 6) {
    return { ok: false, error: 'A nova senha deve ter pelo menos 6 caracteres.' }
  }
  if (password !== confirmPassword) {
    return { ok: false, error: 'As senhas não coincidem.' }
  }

  const tokens = readPasswordResetTokens()
  const entry = tokens.find((item) => item.token === token)

  if (!entry || entry.expiresAt < Date.now()) {
    return { ok: false, error: 'Link inválido ou expirado. Peça uma nova recuperação.' }
  }

  const accounts = readAccounts()
  const index = accounts.findIndex((account) => account.email === entry.email)

  if (index === -1) {
    return { ok: false, error: 'Conta não encontrada.' }
  }

  accounts[index] = {
    ...accounts[index],
    passwordHash: encodePassword(password),
    updatedAt: new Date().toISOString(),
  }

  writeAccounts(accounts)
  writePasswordResetTokens(tokens.filter((item) => item.token !== token))

  return {
    ok: true,
    session: buildUserSession({
      name: accounts[index].name,
      email: accounts[index].email,
      emailVerified: false,
    }),
  }
}
