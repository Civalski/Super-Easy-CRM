import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { enforceApiRateLimit } from '@/lib/security/api-rate-limit'

export const dynamic = 'force-dynamic'

const syncPasswordRateLimitConfig = {
  windowMs: 10 * 60 * 1000,
  maxAttempts: 5,
  blockDurationMs: 15 * 60 * 1000,
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const rateLimitResponse = await enforceApiRateLimit({
      key: `api:auth:sync-password:ip:${ip}`,
      config: syncPasswordRateLimitConfig,
      error: 'Muitas tentativas. Aguarde antes de tentar novamente.',
    })
    if (rateLimitResponse) return rateLimitResponse

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return NextResponse.json({ error: 'Token ausente' }, { status: 401 })
    }

    const body = await request.json()
    const password = typeof body.password === 'string' ? body.password : ''

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Senha invalida' }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user?.email) {
      return NextResponse.json({ error: 'Sessao invalida' }, { status: 401 })
    }

    const email = user.email.trim().toLowerCase()
    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.user.updateMany({
      where: { email: { equals: email, mode: 'insensitive' } },
      data: { passwordHash },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Erro ao sincronizar senha:', err)
    return NextResponse.json(
      { error: 'Erro ao atualizar senha' },
      { status: 500 }
    )
  }
}
