import { Resend } from 'resend'
import { env } from '../config/env.js'

let resend = null

function getResend() {
  if (!env.resendApiKey) return null
  if (!resend) resend = new Resend(env.resendApiKey)
  return resend
}

export function isEmailConfigured() {
  return Boolean(getResend())
}

export async function sendEmail({ to, subject, html, text }) {
  const client = getResend()
  if (!client) {
    return { ok: false, error: 'RESEND_API_KEY não configurada' }
  }

  const { data, error } = await client.emails.send({
    from: env.emailFrom,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true, id: data?.id }
}

export async function sendListingStatusEmail({ to, title, status, reason }) {
  const subject =
    status === 'Ativo'
      ? `Anúncio aprovado — ${title}`
      : status === 'Rejeitado'
        ? `Anúncio rejeitado — ${title}`
        : `Actualização do anúncio — ${title}`

  const html = `
    <p>Olá,</p>
    <p>O seu anúncio <strong>${title}</strong> foi actualizado para: <strong>${status}</strong>.</p>
    ${reason ? `<p>Motivo: ${reason}</p>` : ''}
    <p><a href="https://kutekalink.com/painel">Ver painel Kuteka</a></p>
  `

  return sendEmail({ to, subject, html, text: `${title} — ${status}` })
}
