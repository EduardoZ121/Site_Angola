import { Router } from 'express'
import { z } from 'zod'
import { requireDb } from '../middleware/db.js'
import { optionalAuth, requireAdmin, requireAuth } from '../middleware/auth.js'
import { Listing } from '../models/Listing.js'
import { getSiteSettings } from '../models/SiteSettings.js'
import { sendListingStatusEmail, isEmailConfigured } from '../services/email.js'
import { getPlanById } from '../data/plans.js'
import { findListingByParam } from '../utils/listingLookup.js'

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

router.get('/', optionalAuth, async (req, res) => {
  const settings = await getSiteSettings()
  const filter = {}

  if (req.user?.isAdmin && req.query.all === '1') {
    if (req.query.status) filter.status = String(req.query.status)
  } else if (req.user && req.query.mine === '1') {
    filter.ownerEmail = req.user.email.toLowerCase()
    if (req.query.status) filter.status = String(req.query.status)
  } else {
    filter.status = 'Ativo'
    if (settings.useRealDataOnly || !settings.showDemoListings) {
      filter.isDemo = { $ne: true }
      filter.legacyId = { $nin: ['l-1', 'l-2', 'l-3'] }
    }
  }

  if (req.query.ownerEmail && req.user?.isAdmin) {
    filter.ownerEmail = String(req.query.ownerEmail).toLowerCase()
  }

  const items = await Listing.find(filter).sort({ featured: -1, createdAt: -1 }).limit(500)
  res.json({ ok: true, listings: items.map(toClientListing) })
})

router.get('/:id', async (req, res) => {
  const listing = await findListingByParam(req.params.id)
  if (!listing) return res.status(404).json({ ok: false, error: 'Anúncio não encontrado' })
  res.json({ ok: true, listing: toClientListing(listing) })
})

router.post('/:id/view', async (req, res) => {
  const listing = await findListingByParam(req.params.id)
  if (!listing) return res.status(404).json({ ok: false, error: 'Anúncio não encontrado' })
  listing.views = (listing.views || 0) + 1
  await listing.save()
  res.json({ ok: true, views: listing.views })
})

const listingSchema = z.object({
  title: z.string().min(3),
  category: z.string().optional(),
  operation: z.string().optional(),
  propertyType: z.string().optional(),
  price: z.coerce.number().optional(),
  province: z.string().optional(),
  municipality: z.string().optional(),
  neighborhood: z.string().optional(),
  description: z.string().optional(),
  photos: z.array(z.string()).optional(),
  phone: z.string().optional(),
  bedrooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),
  area: z.coerce.number().optional(),
  amenities: z.array(z.string()).optional(),
  rules: z.array(z.string()).optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().optional(),
  mileage: z.coerce.number().optional(),
  fuel: z.string().optional(),
  gearbox: z.string().optional(),
  condition: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  legacyId: z.string().optional(),
})

router.post('/', requireAuth, async (req, res) => {
  const parsed = listingSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Dados inválidos', details: parsed.error.flatten() })
  }

  const listing = await Listing.create({
    ...parsed.data,
    ownerEmail: req.user.email,
    ownerName: req.user.name,
    ownerUserId: req.user._id,
    ownerType: req.user.accountType || 'Proprietário Particular',
    status: 'Pendente',
    isDemo: false,
    verifiedProfile: false,
    verifiedPhone: Boolean(parsed.data.phone),
    verifiedDocument: false,
    views: 0,
    favoriteCount: 0,
  })

  res.status(201).json({ ok: true, listing: toClientListing(listing) })
})

router.patch('/:id', requireAuth, async (req, res) => {
  const listing = await findListingByParam(req.params.id)
  if (!listing) return res.status(404).json({ ok: false, error: 'Anúncio não encontrado' })

  const isOwner =
    listing.ownerEmail === req.user.email.toLowerCase() ||
    String(listing.ownerUserId) === String(req.user._id)

  if (!isOwner && !req.user.isAdmin) {
    return res.status(403).json({ ok: false, error: 'Sem permissão' })
  }

  const allowed = [
    'title', 'price', 'description', 'photos', 'status', 'featured', 'featuredUntil',
    'featuredPlanId', 'phone', 'province', 'municipality', 'neighborhood', 'rejectionReason',
    'views', 'verifiedProfile', 'verifiedPhone', 'verifiedDocument', 'trustSeal', 'isDemo',
  ]

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      if (!req.user.isAdmin && ['views', 'verifiedProfile', 'verifiedPhone', 'verifiedDocument', 'trustSeal', 'isDemo', 'featured'].includes(key)) {
        continue
      }
      listing[key] = req.body[key]
    }
  }

  await listing.save()

  if (req.body.notifyOwner && listing.ownerEmail && isEmailConfigured()) {
    await sendListingStatusEmail({
      to: listing.ownerEmail,
      title: listing.title,
      status: listing.status,
      reason: listing.rejectionReason,
    })
  }

  res.json({ ok: true, listing: toClientListing(listing) })
})

router.post('/:id/featured', requireAuth, async (req, res) => {
  const plan = getPlanById(req.body.planId)
  if (!plan?.featured) {
    return res.status(400).json({ ok: false, error: 'Plano inválido' })
  }

  const listing = await findListingByParam(req.params.id)
  if (!listing) return res.status(404).json({ ok: false, error: 'Anúncio não encontrado' })

  const isOwner = listing.ownerEmail === req.user.email.toLowerCase()
  if (!isOwner && !req.user.isAdmin) {
    return res.status(403).json({ ok: false, error: 'Sem permissão' })
  }

  if (!req.body.paymentConfirmed && !req.user.isAdmin) {
    return res.status(402).json({
      ok: false,
      error: 'Pagamento em Kwanza ainda não activo',
      plan,
      paymentPending: true,
    })
  }

  const until = new Date()
  until.setDate(until.getDate() + plan.durationDays)
  listing.featured = true
  listing.featuredUntil = until
  listing.featuredPlanId = plan.id
  await listing.save()

  res.json({ ok: true, listing: toClientListing(listing), plan })
})

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const listing = await findListingByParam(req.params.id)
  if (!listing) return res.status(404).json({ ok: false, error: 'Anúncio não encontrado' })
  await listing.deleteOne()
  res.json({ ok: true })
})

export default router
