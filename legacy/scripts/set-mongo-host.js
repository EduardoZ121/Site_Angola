/**
 * Actualiza MONGODB_URI no .env com o host do cluster Atlas.
 * Uso: node scripts/set-mongo-host.js kuteka.abc123.mongodb.net
 */
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const host = process.argv[2]
if (!host || host.includes(' ')) {
  console.error('Uso: node scripts/set-mongo-host.js <cluster-host>')
  console.error('Ex.: node scripts/set-mongo-host.js kuteka.abc123.mongodb.net')
  process.exit(1)
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, '.env')
let content = readFileSync(envPath, 'utf8')

if (!content.includes('CLUSTER.mongodb.net')) {
  console.error('.env não tem placeholder CLUSTER — edite MONGODB_URI manualmente')
  process.exit(1)
}

content = content.replace('CLUSTER.mongodb.net', `${host}`)
writeFileSync(envPath, content)
console.log(`[ok] MONGODB_URI actualizado com host: ${host}`)
console.log('A seguir: npm run seed && npm run dev:api')
