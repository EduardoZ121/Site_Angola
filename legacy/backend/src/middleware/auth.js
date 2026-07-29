import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { User } from '../models/User.js'

export function signToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      email: user.email,
      isAdmin: user.isAdmin,
      isAgent: user.isAgent,
    },
    env.jwtSecret,
    { expiresIn: '30d' },
  )
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ ok: false, error: 'Não autenticado' })

  try {
    const payload = jwt.verify(token, env.jwtSecret)
    const user = await User.findById(payload.sub)
    if (!user) return res.status(401).json({ ok: false, error: 'Utilizador inválido' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ ok: false, error: 'Sessão expirada' })
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return next()

  jwt.verify(token, env.jwtSecret, async (error, payload) => {
    if (!error && payload?.sub) {
      req.user = await User.findById(payload.sub)
    }
    next()
  })
}

export function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ ok: false, error: 'Acesso admin necessário' })
  }
  next()
}
