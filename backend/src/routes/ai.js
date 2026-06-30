import { Router } from 'express'
import { z } from 'zod'
import {
  generateListingDescription,
  isOpenAiConfigured,
  naturalLanguageSearch,
} from '../services/openai.js'

const router = Router()

const descriptionSchema = z.object({
  title: z.string().optional(),
  category: z.string().optional(),
  operation: z.string().optional(),
  province: z.string().optional(),
  municipality: z.string().optional(),
  bedrooms: z.union([z.number(), z.string()]).optional(),
  price: z.union([z.number(), z.string()]).optional(),
  notes: z.string().optional(),
})

const searchSchema = z.object({
  query: z.string().min(3),
  filters: z.record(z.unknown()).optional(),
})

router.get('/status', (_req, res) => {
  res.json({
    configured: isOpenAiConfigured(),
    features: ['listing-description', 'natural-language-search'],
  })
})

router.post('/listing-description', async (req, res) => {
  const parsed = descriptionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Dados inválidos', details: parsed.error.flatten() })
  }

  try {
    const result = await generateListingDescription(parsed.data)
    if (!result.ok) return res.status(503).json(result)
    return res.json(result)
  } catch (error) {
    console.error('[ai/listing-description]', error)
    return res.status(500).json({ ok: false, error: 'Falha ao gerar descrição' })
  }
})

router.post('/search', async (req, res) => {
  const parsed = searchSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Query inválida', details: parsed.error.flatten() })
  }

  try {
    const result = await naturalLanguageSearch(parsed.data)
    if (!result.ok) return res.status(503).json(result)
    return res.json(result)
  } catch (error) {
    console.error('[ai/search]', error)
    return res.status(500).json({ ok: false, error: 'Falha na pesquisa inteligente' })
  }
})

export default router
