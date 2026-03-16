import { Resend } from 'resend'
import { buildResetPasswordEmailHtml } from '@/lib/emails/reset-password-email-template'

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL?.trim() || 'Arker CRM <onboarding@resend.dev>'

export type SendResetPasswordResult =
  | { ok: true }
  | { ok: false; error: string }

export async function sendResetPasswordEmail(params: {
  to: string
  actionLink: string
}): Promise<SendResetPasswordResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY nao configurada' }
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: 'Redefina sua senha - Arker CRM',
    html: await buildResetPasswordEmailHtml({ resetLink: params.actionLink }),
  })

  if (error) {
    console.error('[send-reset-password-email] Erro Resend:', error)
    return { ok: false, error: String(error) }
  }

  return { ok: true }
}
