import compression from 'compression'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import aiRouter from './routes/ai.js'
import authRouter from './routes/auth.js'
import emailRouter from './routes/email.js'
import healthRouter from './routes/health.js'
import listingsRouter from './routes/listings.js'
import plansRouter from './routes/plans.js'
import uploadsRouter from './routes/uploads.js'

export function createApp() {
  const app = express()
  app.set('trust proxy', 1)
  app.use(helmet())
  app.use(compression())
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))
  app.use(cors({ origin: env.corsOrigin.split(',').map((item) => item.trim()), credentials: true }))
  app.use(express.json({ limit: '2mb' }))
  app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }))
  app.use('/api/health', healthRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/listings', listingsRouter)
  app.use('/api/plans', plansRouter)
  app.use('/api/uploads', uploadsRouter)
  app.use('/api/email', emailRouter)
  app.use('/api/ai', aiRouter)
  app.use((_req, res) => res.status(404).json({ ok: false, error: 'Rota nao encontrada' }))
  app.use((error, _req, res, _next) => { console.error('[api]', error); res.status(500).json({ ok: false, error: 'Erro interno do servidor' }) })
  return app
}