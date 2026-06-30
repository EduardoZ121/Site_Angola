import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
config({ path: path.join(rootDir, '.env') })
config({ path: path.join(rootDir, '.env.local'), override: true })

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3001),
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-in-production',
  googleClientId: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  aws: {
    region: process.env.AWS_REGION || 'eu-west-1',
    bucket: process.env.AWS_S3_BUCKET || '',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'Kuteka <noreply@kutekalink.com>',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
}

export function getMissingProductionVars() {
  const required = ['MONGODB_URI', 'JWT_SECRET', 'OPENAI_API_KEY']
  return required.filter((key) => !process.env[key])
}
