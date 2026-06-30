import mongoose from 'mongoose'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'
import { starterListings } from '../../src/data/constants.js'
import { Listing } from '../src/models/Listing.js'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
config({ path: path.join(rootDir, '.env') })

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error('Defina MONGODB_URI no .env')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGODB_URI)
  const count = await Listing.countDocuments()
  if (count > 0) {
    console.log(`[seed] Já existem ${count} anúncios — ignorado`)
    await mongoose.disconnect()
    return
  }

  await Listing.insertMany(
    starterListings.map((item) => {
      const { id, ...rest } = item
      return { ...rest, legacyId: id, favoriteCount: 0 }
    }),
  )

  console.log(`[seed] Inseridos ${starterListings.length} anúncios demo`)
  await mongoose.disconnect()
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
