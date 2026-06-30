import mongoose from 'mongoose'
import { env } from './config/env.js'

const globalCache = globalThis
if (!globalCache.__kutekaMongoose) globalCache.__kutekaMongoose = { conn: null, promise: null }
const cache = globalCache.__kutekaMongoose

export async function connectDatabase() {
  if (!env.mongoUri || env.mongoUri.includes('CLUSTER.mongodb.net')) {
    console.warn('[db] MONGODB_URI invalida ou em falta')
    return false
  }
  if (cache.conn) return true
  if (!cache.promise) {
    cache.promise = mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000, maxPoolSize: 5 })
      .then(() => { console.log('[db] MongoDB ligado'); return true })
      .catch((error) => { console.warn('[db] Falha MongoDB:', error.message); cache.promise = null; return false })
  }
  cache.conn = await cache.promise
  return cache.conn
}