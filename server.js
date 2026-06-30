import { createApp } from './backend/src/app.js'
import { connectDatabase } from './backend/src/db.js'

const app = createApp()
let ready

async function boot() {
  if (!ready) ready = connectDatabase()
  await ready
  return app
}

export default async function handler(req, res) {
  const application = await boot()
  return application(req, res)
}