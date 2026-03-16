import { Resend } from 'resend'
import { buildConfirmationEmailHtml } from '@/lib/emails/confirmation-email-template'

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL?.trim() || 'Arker CRM <onboarding@resend.dev>'

export type SendConfirmationResult =
  | { ok: true }
  | { ok: false; error: string }

export async function sendConfirmationEmail(params: {
  to: string
  actionLink: string
  nome?: string
}): Promise<SendConfirmationResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY nao configurada' }
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: 'Confirme seu email - Arker CRM',
    html: await buildConfirmationEmailHtml({
      confirmationLink: params.actionLink,
      nome: params.nome,
    }),
  })

  if (error) {
    console.error('[send-confirmation-email] Erro Resend:', error)
    return { ok: false, error: String(error) }
  }

  return { ok: true }
}
