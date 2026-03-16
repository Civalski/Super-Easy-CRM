import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendConfirmationEmail } from '@/lib/auth/send-confirmation-email'
import {
  EMAIL_CONFIRMATION_PROVIDER,
  isRecoverablePendingRegisterUser,
} from '@/lib/auth/supabase-email-confirmation'
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  getRequestOrigin,
  getSupabaseEmailRedirectTo,
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

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        email: true,
        subscriptionExternalId: true,
        subscriptionProvider: true,
        subscriptionStatus: true,
      },
    })

    if (
      !user ||
      user.subscriptionProvider !== EMAIL_CONFIRMATION_PROVIDER ||
      !isRecoverablePendingRegisterUser(user)
    ) {
      return NextResponse.json({ success: true })
    }

    const supabase = createSupabaseServerClient()
    const supabaseAdmin = createSupabaseAdminClient()
    const origin = getRequestOrigin(request) ?? new URL(request.url).origin
    const emailRedirectTo = getSupabaseEmailRedirectTo(origin)
    const useResend =
      Boolean(process.env.RESEND_API_KEY?.trim()) &&
      Boolean(supabaseAdmin)

    if (useResend && supabaseAdmin) {
      const { data: linkData, error: linkError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email,
          options: {
            redirectTo: emailRedirectTo,
          },
        })

      if (linkError) {
        console.error('Erro ao gerar link manual de confirmacao:', linkError)
        return NextResponse.json(
          { error: 'Nao foi possivel reenviar o email agora.' },
          { status: 502 }
        )
      }

      const actionLink = linkData?.properties?.action_link ?? null
      if (!actionLink) {
        console.error('Supabase generateLink sem action_link no reenvio')
        return NextResponse.json(
          { error: 'Nao foi possivel reenviar o email agora.' },
          { status: 502 }
        )
      }

      const sendResult = await sendConfirmationEmail({
        to: email,
        actionLink,
      })
      if (!sendResult.ok) {
        console.error('Erro ao reenviar email via Resend:', sendResult.error)
        return NextResponse.json(
          { error: 'Nao foi possivel reenviar o email agora.' },
          { status: 502 }
        )
      }
    } else {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo,
        },
      })

      if (error) {
        console.error('Erro ao reenviar email de confirmacao:', error)
        return NextResponse.json(
          { error: 'Nao foi possivel reenviar o email agora.' },
          { status: 502 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao reenviar confirmacao de email:', error)
    return NextResponse.json(
      { error: 'Erro ao reenviar confirmacao de email' },
      { status: 500 }
    )
  }
}
