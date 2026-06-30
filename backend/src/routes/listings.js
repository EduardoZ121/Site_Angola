import { Router } from 'express'
import { z } from 'zod'
import { requireDb } from '../middleware/db.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import { Listing } from '../models/Listing.js'
import { sendListingStatusEmail, isEmailConfigured } from '../services/email.js'
import { getPlanById } from '../data/plans.js'

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

router.get('/', async (req, res) => {
  const filter = { status: 'Ativo' }
  if (req.query.ownerEmail) filter.ownerEmail = String(req.query.ownerEmail).toLowerCase()
  if (req.query.status) filter.status = String(req.query.status)

  const items = await Listing.find(filter).sort({ featured: -1, createdAt: -1 }).limit(500)
  res.json({ ok: true, listings: items.map(toClientListing) })
})

router.get('/:id', async (req, res) => {
  const query = req.params.id.match(/^[a-f0-9]{24}$/i)
    ? { _id: req.params.id }
    : { $or: [{ legacyId: req.params.id }, { slug: req.params.id }] }

  const listing = await Listing.findOne(query)
  if (!listing) return res.status(404).json({ ok: false, error: 'Anúncio não encontrado' })
  res.json({ ok: true, listing: toClientListing(listing) })
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
    status: 'Pendente',
  })

  res.status(201).json({ ok: true, listing: toClientListing(listing) })
})

router.patch('/:id', requireAuth, async (req, res) => {
  const listing = await Listing.findById(req.params.id)
  if (!listing) return res.status(404).json({ ok: false, error: 'Anúncio não encontrado' })

  const isOwner = listing.ownerEmail === req.user.email || String(listing.ownerUserId) === String(req.user._id)
  if (!isOwner && !req.user.isAdmin) {
    return res.status(403).json({ ok: false, error: 'Sem permissão' })
  }

  const allowed = [
    'title', 'price', 'description', 'photos', 'status', 'featured', 'featuredUntil',
    'featuredPlanId', 'phone', 'province', 'municipality', 'neighborhood', 'rejectionReason',
  ]

  for (const key of allowed) {
    if (req.body[key] !== undefined) listing[key] = req.body[key]
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

  const listing = await Listing.findById(req.params.id)
  if (!listing) return res.status(404).json({ ok: false, error: 'Anúncio não encontrado' })

  const isOwner = listing.ownerEmail === req.user.email
  if (!isOwner && !req.user.isAdmin) {
    return res.status(403).json({ ok: false, error: 'Sem permissão' })
  }

  // Pagamento Kz pendente — admin ou modo dev activa manualmente
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
  const listing = await Listing.findByIdAndDelete(req.params.id)
  if (!listing) return res.status(404).json({ ok: false, error: 'Anúncio não encontrado' })
  res.json({ ok: true })
})

export default router
