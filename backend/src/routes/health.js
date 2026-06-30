import { Router } from 'express'
import mongoose from 'mongoose'
import { env, getMissingProductionVars } from '../config/env.js'
import { isOpenAiConfigured } from '../services/openai.js'

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

export default router
