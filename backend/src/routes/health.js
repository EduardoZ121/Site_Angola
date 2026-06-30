import { Router } from 'express'
import mongoose from 'mongoose'
import { env, getMissingProductionVars } from '../config/env.js'
import { isOpenAiConfigured } from '../services/openai.js'
import { Listing } from '../models/Listing.js'
import { starterListings } from '../../../src/data/constants.js'

const router = Router()

router.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'kuteka-api',
    version: '0.1.0',
    environment: env.nodeEnv,
    integrations: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      openai: isOpenAiConfigured() ? 'configured' : 'missing_key',
      s3: env.aws.bucket ? 'configured' : 'missing_bucket',
      email: env.resendApiKey ? 'configured' : 'missing_key',
      stripe: env.stripeSecretKey ? 'configured' : 'missing_key',
      google: env.googleClientId ? 'configured' : 'missing_client_id',
    },
    missingProductionVars: env.nodeEnv === 'production' ? getMissingProductionVars() : [],
  })
})

router.post('/seed', async (req, res) => {
  if (req.headers['x-seed-key'] !== env.jwtSecret) {
    return res.status(403).json({ ok: false, error: 'Forbidden' })
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ ok: false, error: 'MongoDB indisponivel' })
  }
  const count = await Listing.countDocuments()
  if (count > 0) {
    return res.json({ ok: true, seeded: 0, message: `Ja existem ${count} anuncios` })
  }
  await Listing.insertMany(
    starterListings.map((item) => {
      const { id, ...rest } = item
      return { ...rest, legacyId: id, favoriteCount: 0, status: 'Ativo', isDemo: true }
    }),
  )
  res.json({ ok: true, seeded: starterListings.length })
})

export default router