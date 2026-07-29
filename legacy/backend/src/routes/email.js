import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { sendEmail, isEmailConfigured } from '../services/email.js'

const router = Router()

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(3),
  message: z.string().min(10),
})

router.get('/status', (_req, res) => {
  res.json({ configured: isEmailConfigured() })
})

router.post('/contact', requireAuth, async (req, res) => {
  const parsed = contactSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Mensagem inválida' })
  }

  const { name, email, subject, message } = parsed.data
  const result = await sendEmail({
    to: 'amarilinhaa@gmail.com',
    subject: `[Kuteka] ${subject}`,
    html: `<p>De: ${name} &lt;${email}&gt;</p><p>${message.replace(/\n/g, '<br>')}</p>`,
    text: `${name} <${email}>\n\n${message}`,
  })

  if (!result.ok) return res.status(503).json(result)
  res.json({ ok: true, id: result.id })
})

export default router
