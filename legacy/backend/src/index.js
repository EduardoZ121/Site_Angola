import { createApp } from './app.js'
import { connectDatabase } from './db.js'
import { env } from './config/env.js'

const app = createApp()

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
