import { NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { extractClientIpFromRequest } from '@/lib/security/client-ip'
import {
  consumeRateLimit,
  registerRateLimitConfig,
  resetRateLimit,
} from '@/lib/security/rate-limit'
import { verifyTurnstileToken } from '@/lib/security/turnstile'

export const dynamic = 'force-dynamic'

function normalizeCode(code: string) {
  return code.replace(/\s+/g, '').toUpperCase()
}

function hashCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex')
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function POST(request: Request) {
  try {
    const clientIp = extractClientIpFromRequest(request)
    const ipRateKey = `auth:register:ip:${clientIp}`

    const ipRateLimit = consumeRateLimit(ipRateKey, registerRateLimitConfig)
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Muitas tentativas. Tente novamente em ${Math.ceil(
            ipRateLimit.retryAfterSec / 60
          )} minuto(s).`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(ipRateLimit.retryAfterSec),
          },
        }
      )
    }

    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email =
      typeof body.email === 'string' && body.email.trim() !== ''
        ? body.email.trim().toLowerCase()
        : null
    const username =
      typeof body.username === 'string' ? body.username.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const code = typeof body.code === 'string' ? body.code : ''
    const honeypot = typeof body.website === 'string' ? body.website.trim() : ''
    const turnstileToken =
      typeof body.turnstileToken === 'string' ? body.turnstileToken.trim() : ''
    const userRateKey = username ? `auth:register:user:${username}` : ''

    if (honeypot.length > 0) {
      console.warn('Registro rejeitado por honeypot', { clientIp })
      return NextResponse.json(
        { error: 'Requisicao invalida' },
        { status: 400 }
      )
    }

    if (userRateKey) {
      const userRateLimit = consumeRateLimit(userRateKey, registerRateLimitConfig)
      if (!userRateLimit.allowed) {
        return NextResponse.json(
          {
            error: `Muitas tentativas para este usuario. Tente novamente em ${Math.ceil(
              userRateLimit.retryAfterSec / 60
            )} minuto(s).`,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(userRateLimit.retryAfterSec),
            },
          }
        )
      }
    }

    if (!name || !email || !username || !password || !code) {
      return NextResponse.json(
        { error: 'Preencha nome, email, usuario, senha e codigo' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email invalido' },
        { status: 400 }
      )
    }

    const turnstileResult = await verifyTurnstileToken({
      token: turnstileToken,
      remoteIp: clientIp,
    })
    if (!turnstileResult.success) {
      return NextResponse.json(
        { error: 'Falha na verificacao anti-bot' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      )
    }

    const normalizedCode = normalizeCode(code)
    const codeHash = hashCode(normalizedCode)

    const existingCode = await prisma.registrationCode.findUnique({
      where: { codeHash },
    })

    if (!existingCode || existingCode.usedAt) {
      return NextResponse.json(
        { error: 'Codigo invalido ou ja utilizado' },
        { status: 400 }
      )
    }

    const orConditions: { username?: string; email?: string }[] = [{ username }]
    if (email) {
      orConditions.push({ email })
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: orConditions },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Usuario ou email ja cadastrado' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: name || null,
          email,
          username,
          passwordHash,
        },
      })

      const updated = await tx.registrationCode.updateMany({
        where: { id: existingCode.id, usedAt: null },
        data: { usedAt: new Date(), usedById: created.id },
      })

      if (updated.count !== 1) {
        throw new Error('Codigo ja utilizado')
      }

      return created
    })

    resetRateLimit(ipRateKey)
    if (userRateKey) {
      resetRateLimit(userRateKey)
    }

    return NextResponse.json({ success: true, userId: user.id })
  } catch (error) {
    console.error('Erro ao registrar usuario:', error)
    if (error instanceof Error && error.message === 'Codigo ja utilizado') {
      return NextResponse.json(
        { error: 'Codigo invalido ou ja utilizado' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao registrar usuario' },
      { status: 500 }
    )
  }
}
