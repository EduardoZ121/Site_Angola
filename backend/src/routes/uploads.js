import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { Listing } from '../models/Listing.js'
import { createUploadUrl, isS3Configured } from '../services/s3.js'

const router = Router()

const presignSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().optional(),
  folder: z.string().optional(),
})

router.get('/status', (_req, res) => {
  res.json({ configured: isS3Configured() })
})

router.post('/presign', requireAuth, async (req, res) => {
  const parsed = presignSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Pedido inválido' })
  }

  try {
    const result = await createUploadUrl(parsed.data)
    if (!result.ok) return res.status(503).json(result)
    return res.json(result)
  } catch (error) {
    console.error('[uploads/presign]', error)
    return res.status(500).json({ ok: false, error: 'Falha ao preparar upload' })
  }
})

export default router
