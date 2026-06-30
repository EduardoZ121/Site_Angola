import { Listing } from '../models/Listing.js'

export async function findListingByParam(id) {
  if (!id) return null
  if (/^[a-f0-9]{24}$/i.test(id)) {
    const byId = await Listing.findById(id)
    if (byId) return byId
  }
  return Listing.findOne({
    $or: [{ legacyId: id }, { slug: id }, { reference: id }],
  })
}