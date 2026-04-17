import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { withRouteContext } from '@/lib/api/route-helpers'
import { isRecoverablePendingRegisterUser } from '@/lib/auth/supabase-email-confirmation'
import { extractClientIpFromRequest } from '@/lib/security/client-ip'
import {
  consumeRateLimit,
  registerRateLimitConfig,
  resetRateLimit,
} from '@/lib/security/rate-limit'
import { verifyTurnstileToken } from '@/lib/security/turnstile'
import { sendConfirmationEmail } from '@/lib/auth/send-confirmation-email'
import { buildEmailConfirmationLink } from '@/lib/auth/email-confirmation-link'
import {
  createSupabaseAdminClient,
  getRequestOrigin,
  getSupabaseEmailRedirectTo,
} from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<NextResponse> {
  return withRouteContext(request, async () =>
    executeRegister(request).catch((error) => {
      console.error('Erro ao registrar usuario:', error);
      return NextResponse.json({ error: 'Erro ao registrar usuario' }, { status: 500 });
    })
  );
}

type ExistingRegisterUser = {
  id: string
  subscriptionProvider: string | null
  subscriptionStatus: string
  subscriptionExternalId: string | null
}

type TeamMemberInput = {
  name: string
  email: string
  username: string
  password: string
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidPassword(value: string) {
  if (value.length < 8) return false
  if (!/[A-Z]/.test(value)) return false
  if (!/[a-z]/.test(value)) return false
  if (!/[0-9]/.test(value)) return false
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) return false
  return true
}

async function executeRegister(request: Request): Promise<NextResponse> {
  const clientIp = extractClientIpFromRequest(request)
      const ipRateKey = `auth:register:ip:${clientIp}`

      const ipRateLimit = await consumeRateLimit(ipRateKey, registerRateLimitConfig)
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
      const planId = 'plan_1'
      const isManager = false
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      const email =
        typeof body.email === 'string' && body.email.trim() !== ''
          ? body.email.trim().toLowerCase()
          : null
      const rawPhone = typeof body.phone === 'string' ? body.phone.trim().replace(/\D/g, '') : ''
      const phone = rawPhone.length >= 10 ? rawPhone : null
      const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : ''
      const password = typeof body.password === 'string' ? body.password : ''
      const honeypot = typeof body.website === 'string' ? body.website.trim() : ''
      const turnstileToken =
        typeof body.turnstileToken === 'string' ? body.turnstileToken.trim() : ''
      const rawTeamMembers = Array.isArray(body.teamMembers) ? body.teamMembers : []
      const teamMembers: TeamMemberInput[] = rawTeamMembers
        .filter(
          (member: unknown): member is TeamMemberInput =>
            member != null &&
            typeof member === 'object' &&
            typeof (member as TeamMemberInput).name === 'string' &&
            typeof (member as TeamMemberInput).email === 'string' &&
            typeof (member as TeamMemberInput).username === 'string' &&
            typeof (member as TeamMemberInput).password === 'string'
        )
        .map((member: TeamMemberInput) => ({
          name: member.name.trim(),
          email: member.email.trim().toLowerCase(),
          username: member.username.trim().toLowerCase(),
          password: member.password,
        }))
      const userRateKey = username ? `auth:register:user:${username}` : ''

      if (honeypot.length > 0) {
        console.warn('Registro rejeitado por honeypot', { clientIp })
        return NextResponse.json({ error: 'Requisicao invalida' }, { status: 400 })
      }

      if (userRateKey) {
        const userRateLimit = await consumeRateLimit(userRateKey, registerRateLimitConfig)
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

      if (!name || !email || !username || !password) {
        return NextResponse.json(
          { error: 'Preencha nome, email, usuario e senha' },
          { status: 400 }
        )
      }

      if (!phone) {
        return NextResponse.json(
          { error: 'Informe um celular valido (com DDD)' },
          { status: 400 }
        )
      }

      if (!isValidEmail(email)) {
        return NextResponse.json({ error: 'Email invalido' }, { status: 400 })
      }

      const turnstileResult = await verifyTurnstileToken({
        expectedAction: 'register',
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
      if (!isValidPassword(password)) {
        return NextResponse.json(
          {
            error:
              'A senha deve ter maiuscula, minuscula, numero e caractere especial (!@#$%^&* etc.)',
          },
          { status: 400 }
        )
      }

      const expectedTeamSize = 0
      if (expectedTeamSize > 0 && teamMembers.length !== expectedTeamSize) {
        return NextResponse.json(
          {
            error: `Preencha todos os ${expectedTeamSize + 1} usuarios do pacote (voce + ${expectedTeamSize} membros).`,
          },
          { status: 400 }
        )
      }

      for (let i = 0; i < teamMembers.length; i++) {
        const member = teamMembers[i]
        if (!member.name || !member.email || !member.username || !member.password) {
          return NextResponse.json(
            { error: `Membro ${i + 2}: preencha nome, email, usuario e senha` },
            { status: 400 }
          )
        }
        if (!isValidEmail(member.email)) {
          return NextResponse.json(
            { error: `Membro ${i + 2}: email invalido` },
            { status: 400 }
          )
        }
        if (member.password.length < 8) {
          return NextResponse.json(
            { error: `Membro ${i + 2}: senha com pelo menos 8 caracteres` },
            { status: 400 }
          )
        }
        if (!isValidPassword(member.password)) {
          return NextResponse.json(
            {
              error: `Membro ${i + 2}: senha deve ter maiuscula, minuscula, numero e caractere especial`,
            },
            { status: 400 }
          )
        }
      }

      const orConditions: ({ username: string } | { email: string })[] = []
      if (username) orConditions.push({ username })
      if (email) orConditions.push({ email })
      for (const member of teamMembers) {
        if (member.username) orConditions.push({ username: member.username })
        if (member.email) orConditions.push({ email: member.email })
      }

      if (orConditions.length === 0) {
        return NextResponse.json(
          { error: 'Preencha nome, email, usuario e senha' },
          { status: 400 }
        )
      }

      const existingUsers = await prisma.user.findMany({
        where: { OR: orConditions },
        select: {
          id: true,
          subscriptionProvider: true,
          subscriptionStatus: true,
          subscriptionExternalId: true,
        },
      })

      const uniqueExistingUsers = Array.from(
        new Map(existingUsers.map((user) => [user.id, user])).values()
      )
      const recoverableUser =
        uniqueExistingUsers.length === 1 &&
        isRecoverablePendingRegisterUser(uniqueExistingUsers[0])
          ? uniqueExistingUsers[0]
          : null

      if (uniqueExistingUsers.length > 0 && !recoverableUser) {
        return NextResponse.json(
          { error: 'Usuario ou email ja cadastrado' },
          { status: 409 }
        )
      }

      const supabaseAdmin = createSupabaseAdminClient()
      const origin = getRequestOrigin(request) ?? new URL(request.url).origin
      const emailRedirectTo = getSupabaseEmailRedirectTo(origin)
      const resendApiKey = process.env.RESEND_API_KEY?.trim()
      let supabaseAuthUserId =
        recoverableUser?.subscriptionProvider === 'supabase'
          ? recoverableUser.subscriptionExternalId
          : null

      if (!supabaseAdmin || !resendApiKey) {
        return NextResponse.json(
          {
            error:
              'Nao foi possivel enviar o email de confirmacao agora. Verifique a configuracao do Resend e do Supabase Admin.',
          },
          { status: 503 }
        )
      }

      const { data: linkData, error: linkError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: 'signup',
          email,
          password,
          options: {
            redirectTo: emailRedirectTo,
            data: {
              planId,
              source: 'arker-crm',
              username,
            },
          },
        })

      if (linkError) {
        const msg = linkError.message ?? String(linkError)
        if (
          msg.includes('already') ||
          msg.includes('registered') ||
          msg.includes('already been registered')
        ) {
          return NextResponse.json(
            {
              error:
                'Este email ja esta cadastrado. Faca login com Google ou use "Esqueci minha senha" na tela de login para redefinir sua senha.',
            },
            { status: 409 }
          )
        }

        console.error('Erro ao gerar link de confirmacao no Supabase:', linkError)
        return NextResponse.json(
          {
            error:
              'Nao foi possivel enviar o email de confirmacao agora. Verifique a configuracao e tente novamente.',
            detail: msg,
          },
          { status: 502 }
        )
      }

      const generatedTokenHash = linkData?.properties?.hashed_token ?? null
      const generatedType = linkData?.properties?.verification_type ?? null
      if (!generatedTokenHash || !generatedType) {
        console.error('Supabase generateLink sem hashed_token/verification_type')
        return NextResponse.json(
          {
            error:
              'Nao foi possivel gerar o link de confirmacao. Tente novamente.',
          },
          { status: 502 }
        )
      }
      supabaseAuthUserId = linkData?.user?.id ?? null

      const sendResult = await sendConfirmationEmail({
        to: email,
        nome: name,
        actionLink: buildEmailConfirmationLink({
          redirectTo: emailRedirectTo,
          tokenHash: generatedTokenHash,
          type: generatedType,
        }),
      })
      if (!sendResult.ok) {
        console.error('Erro ao enviar email via Resend:', sendResult.error)
        return NextResponse.json(
          {
            error:
              'Nao foi possivel enviar o email de confirmacao agora. Tente novamente em instantes.',
          },
          { status: 502 }
        )
      }

      const passwordHash = await bcrypt.hash(password, 12)
      const primaryUserId = recoverableUser?.id ?? randomUUID()
      const isPackage = teamMembers.length > 0
      const managerRole = isManager ? 'manager' : 'user'

      const dbError = await persistUserAndTeam({
        isPackage,
        teamMembers,
        recoverableUser,
        name,
        email,
        phone,
        username,
        passwordHash,
        planId,
        primaryUserId,
        supabaseAuthUserId,
        managerRole,
      })
      if (dbError) return dbError

      await resetRateLimit(ipRateKey)
      if (userRateKey) {
        await resetRateLimit(userRateKey)
      }

  return NextResponse.json({
    success: true,
    email,
    requiresEmailConfirmation: true,
    userId: primaryUserId,
  });
}

async function persistUserAndTeam(params: {
  isPackage: boolean
  teamMembers: TeamMemberInput[]
  recoverableUser: { id: string } | null
  name: string
  email: string
  phone: string | null
  username: string
  passwordHash: string
  planId: string
  primaryUserId: string
  supabaseAuthUserId: string | null
  managerRole: string
}): Promise<NextResponse | null> {
  const {
    isPackage,
    teamMembers,
    recoverableUser,
    name,
    email,
    phone,
    username,
    passwordHash,
    planId,
    primaryUserId,
    supabaseAuthUserId,
    managerRole,
  } = params

  try {
    if (isPackage) {
          const memberHashes = await Promise.all(
            teamMembers.map((member) => bcrypt.hash(member.password, 12))
          )
          const memberUsers = teamMembers.map((member, index) => ({
            id: randomUUID(),
            name: member.name || null,
            email: member.email || null,
            username: member.username,
            passwordHash: memberHashes[index],
            role: 'user',
            subscriptionProvider: null,
            subscriptionStatus: 'inactive',
            subscriptionPlanCode: null,
            subscriptionCheckoutUrl: null,
          }))

          await prisma.$transaction(async (tx) => {
            const primaryUserData = {
              name: name || null,
              email,
              phone,
              username,
              passwordHash,
              role: managerRole,
              subscriptionProvider: 'supabase',
              subscriptionExternalId: supabaseAuthUserId,
              subscriptionStatus: 'pending',
              subscriptionPlanCode: planId,
              subscriptionCheckoutUrl: null,
              subscriptionNextBillingAt: null,
              subscriptionLastWebhookAt: null,
              onboardingCompletedAt: null,
            }

            if (recoverableUser) {
              await tx.user.update({
                where: { id: recoverableUser.id },
                data: primaryUserData,
              })
            } else {
              await tx.user.create({
                data: {
                  id: primaryUserId,
                  ...primaryUserData,
                },
              })
            }

            for (const member of memberUsers) {
              await tx.user.create({
                data: {
                  id: member.id,
                  name: member.name,
                  email: member.email,
                  username: member.username,
                  passwordHash: member.passwordHash,
                  role: member.role,
                  subscriptionProvider: member.subscriptionProvider,
                  subscriptionStatus: member.subscriptionStatus,
                  subscriptionPlanCode: member.subscriptionPlanCode,
                  subscriptionCheckoutUrl: member.subscriptionCheckoutUrl,
                },
              })
            }

            const workspaceName = `Equipe ${name || username}`
            const workspace = await tx.workspace.create({
              data: {
                name: workspaceName,
                ownerId: primaryUserId,
              },
            })

            await tx.workspaceMember.create({
              data: {
                workspaceId: workspace.id,
                userId: primaryUserId,
                role: 'gestor',
              },
            })

            for (const member of memberUsers) {
              await tx.workspaceMember.create({
                data: {
                  workspaceId: workspace.id,
                  userId: member.id,
                  role: 'vendedor',
                },
              })
            }
          })
        } else {
          const primaryUserData = {
            name: name || null,
            email,
            phone,
            username,
            passwordHash,
            role: managerRole,
            subscriptionProvider: 'supabase',
            subscriptionExternalId: supabaseAuthUserId,
            subscriptionStatus: 'pending',
            subscriptionPlanCode: planId,
            subscriptionCheckoutUrl: null,
            subscriptionNextBillingAt: null,
            subscriptionLastWebhookAt: null,
            onboardingCompletedAt: null,
          }

          if (recoverableUser) {
            await prisma.user.update({
              where: { id: recoverableUser.id },
              data: primaryUserData,
            })
          } else {
            await prisma.user.create({
              data: {
                id: primaryUserId,
                ...primaryUserData,
              },
            })
          }
        }
    return null
  } catch (registerError) {
    if (
      registerError instanceof Prisma.PrismaClientKnownRequestError &&
      registerError.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Usuario ou email ja cadastrado' },
        { status: 409 }
      )
    }

    console.error('Erro ao finalizar cadastro com onboarding liberado:', registerError)
    return NextResponse.json(
      {
        error: 'Nao foi possivel concluir o cadastro. Tente novamente em instantes.',
      },
      { status: 500 }
    )
  }
}
