import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config/env.js'
import { requireDb } from '../middleware/db.js'
import { requireAuth, signToken } from '../middleware/auth.js'
import { User } from '../models/User.js'
import { verifyGoogleCredential } from '../services/googleAuth.js'

const router = Router()

const ADMIN_EMAIL = 'amarilinhaa@gmail.com'
const AGENT_EMAIL = 'amarilinhaz@gmail.com'

const googleSchema = z.object({
  credential: z.string().min(10),
})

router.post('/google', requireDb, async (req, res) => {
  const parsed = googleSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Credencial Google inválida' })
  }

  try {
    const verified = await verifyGoogleCredential(parsed.data.credential)
    if (!verified.ok) return res.status(503).json(verified)

    const { user: googleUser } = verified
    let user = await User.findOne({ email: googleUser.email })

    if (!user) {
      user = await User.create({
        ...googleUser,
        authProvider: 'google',
        isAdmin: googleUser.email === ADMIN_EMAIL,
        isAgent: googleUser.email === AGENT_EMAIL,
      })
    } else {
      user.name = googleUser.name || user.name
      user.googleId = googleUser.googleId
      user.picture = googleUser.picture || user.picture
      user.emailVerified = googleUser.emailVerified
      user.isAdmin = googleUser.email === ADMIN_EMAIL
      if (googleUser.email === AGENT_EMAIL) user.isAgent = true
      await user.save()
    }

    const token = signToken(user)
    return res.json({
      ok: true,
      token,
      user: user.toJSON(),
    })
  } catch (error) {
    console.error('[auth/google]', error)
    return res.status(500).json({ ok: false, error: 'Falha na autenticação Google' })
  }
})

router.get('/me', requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user.toJSON() })
})

router.patch('/me', requireAuth, async (req, res) => {
  const allowed = ['name', 'phone', 'accountType', 'userRole', 'buyerOnboardingDone']
  for (const key of allowed) {
    if (req.body[key] !== undefined) req.user[key] = req.body[key]
  }
  await req.user.save()
  res.json({ ok: true, user: req.user.toJSON() })
})

router.get('/config', (_req, res) => {
  res.json({
    googleConfigured: Boolean(env.googleClientId),
    adminEmail: ADMIN_EMAIL,
  })
})

export default router
