import { createApp } from '../backend/src/app.js'
import { connectDatabase } from '../backend/src/db.js'

const app = createApp()
let bootPromise

function ensureReady() {
  if (!bootPromise) bootPromise = connectDatabase()
  return bootPromise
}

export default async function handler(req, res) {
  await ensureReady()
  return app(req, res)
}