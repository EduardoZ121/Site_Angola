import { Router } from 'express'
import { z } from 'zod'
import { requireDb } from '../middleware/db.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import { Listing } from '../models/Listing.js'
import { getSiteSettings } from '../models/SiteSettings.js'
import { findListingByParam } from '../utils/listingLookup.js'
import { starterListings } from '../../../src/data/constants.js'

const router = Router()

router.use(requireDb)

function toClientListing(doc) {
  const json = doc.toJSON()
  return {
    ...json,
    id: json.legacyId || json.id,
    createdAt: doc.createdAt?.toISOString?.()?.slice(0, 10) || json.createdAt,
  }
}

router.get('/settings', async (_req, res) => {
  const settings = await getSiteSettings()
  res.json({ ok: true, settings: settings.toJSON() })
})

router.patch('/settings', requireAuth, requireAdmin, async (req, res) => {
  const settings = await getSiteSettings()
  const allowed = ['useRealDataOnly', 'showDemoListings', 'showTestimonials', 'marketingStats']
  for (const key of allowed) {
    if (req.body[key] !== undefined) settings[key] = req.body[key]
  }
  await settings.save()
  res.json({ ok: true, settings: settings.toJSON() })
})

router.get('/listings', requireAuth, requireAdmin, async (req, res) => {
  const filter = {}
  if (req.query.status) filter.status = String(req.query.status)
  const items = await Listing.find(filter).sort({ createdAt: -1 }).limit(1000)
  res.json({ ok: true, listings: items.map(toClientListing) })
})

router.delete('/demo-listings', requireAuth, requireAdmin, async (_req, res) => {
  const result = await Listing.deleteMany({
    $or: [{ isDemo: true }, { legacyId: { $in: ['l-1', 'l-2', 'l-3'] } }],
  })
  res.json({ ok: true, deleted: result.deletedCount })
})

router.post('/demo-listings/restore', requireAuth, requireAdmin, async (_req, res) => {
  const existing = await Listing.countDocuments({
    $or: [{ isDemo: true }, { legacyId: { $in: ['l-1', 'l-2', 'l-3'] } }],
  })
  if (existing > 0) {
    return res.json({ ok: true, restored: 0, message: 'Demo ja existe' })
  }

  await Listing.insertMany(
    starterListings.map((item) => {
      const { id, ...rest } = item
      return {
        ...rest,
        legacyId: id,
        favoriteCount: 0,
        status: 'Ativo',
        isDemo: true,
      }
    }),
  )

  res.json({ ok: true, restored: starterListings.length })
})

const adminListingPatch = z.object({
  views: z.coerce.number().optional(),
  verifiedProfile: z.boolean().optional(),
  verifiedPhone: z.boolean().optional(),
  verifiedDocument: z.boolean().optional(),
  trustSeal: z.string().optional(),
  isDemo: z.boolean().optional(),
  status: z.string().optional(),
  featured: z.boolean().optional(),
  rejectionReason: z.string().optional(),
})

router.patch('/listings/:id', requireAuth, requireAdmin, async (req, res) => {
  const parsed = adminListingPatch.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Dados invalidos' })
  }

  const listing = await findListingByParam(req.params.id)
  if (!listing) return res.status(404).json({ ok: false, error: 'Anuncio nao encontrado' })

  Object.assign(listing, parsed.data)
  await listing.save()
  res.json({ ok: true, listing: toClientListing(listing) })
})

export default router