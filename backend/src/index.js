import compression from 'compression'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import morgan from 'morgan'
import mongoose from 'mongoose'
import { env } from './config/env.js'
import aiRouter from './routes/ai.js'
import authRouter from './routes/auth.js'
import emailRouter from './routes/email.js'
import healthRouter from './routes/health.js'
import listingsRouter from './routes/listings.js'
import plansRouter from './routes/plans.js'
import uploadsRouter from './routes/uploads.js'

const app = express()

app.set('trust proxy', 1)
app.use(helmet())
app.use(compression())
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))
app.use(
  cors({
    origin: env.corsOrigin.split(',').map((item) => item.trim()),
    credentials: true,
  }),
)
app.use(express.json({ limit: '2mb' }))

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api', apiLimiter)

app.use('/api/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/listings', listingsRouter)
app.use('/api/plans', plansRouter)
app.use('/api/uploads', uploadsRouter)
app.use('/api/email', emailRouter)
app.use('/api/ai', aiRouter)

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Rota não encontrada' })
})

app.use((error, _req, res, _next) => {
  console.error('[api]', error)
  res.status(500).json({ ok: false, error: 'Erro interno do servidor' })
})

async function connectDatabase() {
  if (!env.mongoUri || env.mongoUri.includes('CLUSTER.mongodb.net')) {
    console.warn('[db] MONGODB_URI invalida ou em falta — API arranca sem base de dados')
    return false
  }

  try {
    await mongoose.connect(env.mongoUri)
    console.log('[db] MongoDB ligado')
    return true
  } catch (error) {
    console.warn('[db] Falha ao ligar MongoDB:', error.message)
    return false
  }
}

async function start() {
  await connectDatabase()

  app.listen(env.port, () => {
    console.log(`[api] Kuteka API em http://localhost:${env.port}`)
    console.log(`[api] Health: http://localhost:${env.port}/api/health`)
  })
}

start().catch((error) => {
  console.error('[api] Falha ao arrancar', error)
  process.exit(1)
})
