import { NextResponse } from 'next/server'
import { sendResetPasswordEmail } from '@/lib/auth/send-reset-password-email'
import {
  createSupabaseAdminClient,
  getRequestOrigin,
  getSupabaseResetPasswordRedirectTo,
} from '@/lib/supabase/server'

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email =
      typeof body.email === 'string' && body.email.trim() !== ''
        ? body.email.trim().toLowerCase()
        : ''

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Email invalido' }, { status: 400 })
    }

    const useResend =
      Boolean(process.env.RESEND_API_KEY?.trim()) &&
      Boolean(createSupabaseAdminClient())

    if (useResend) {
      const supabaseAdmin = createSupabaseAdminClient()
      if (!supabaseAdmin) {
        return NextResponse.json(
          { error: 'Configuracao de email indisponivel.' },
          { status: 503 }
        )
      }

      const origin = getRequestOrigin(request) ?? new URL(request.url).origin
      const redirectTo = getSupabaseResetPasswordRedirectTo(origin)

      const { data: linkData, error: linkError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email,
          options: {
            redirectTo,
          },
        })

      if (linkError) {
        console.error('Erro ao gerar link de recuperacao:', linkError)
        return NextResponse.json(
          { error: 'Nao foi possivel enviar o email. Tente novamente.' },
          { status: 502 }
        )
      }

      const actionLink = linkData?.properties?.action_link ?? null
      if (!actionLink) {
        console.error('Supabase generateLink sem action_link (recovery)')
        return NextResponse.json(
          { error: 'Nao foi possivel enviar o email. Tente novamente.' },
          { status: 502 }
        )
      }

      const sendResult = await sendResetPasswordEmail({
        to: email,
        actionLink,
      })

      if (!sendResult.ok) {
        console.error('Erro ao enviar email de redefinicao via Resend:', sendResult.error)
        return NextResponse.json(
          { error: 'Nao foi possivel enviar o email. Tente novamente.' },
          { status: 502 }
        )
      }
    } else {
      return NextResponse.json(
        { success: true, useSupabase: true },
        { status: 200 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao processar esqueci minha senha:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitacao.' },
      { status: 500 }
    )
  }
}
