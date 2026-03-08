import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import { getUserSubscriptionAccess } from '@/lib/billing/subscription-access'

export const dynamic = 'force-dynamic'

async function ensurePremiumAccess(userId: string) {
  const access = await getUserSubscriptionAccess(userId)
  if (!access.schemaReady) {
    return NextResponse.json(
      { error: 'Banco sem colunas de assinatura. Rode a migracao do Prisma.', code: 'SUBSCRIPTION_SCHEMA_MISSING' },
      { status: 503 }
    )
  }
  if (access.active) return null
  return NextResponse.json(
    { error: 'Modulo financeiro disponivel apenas para assinaturas premium.', code: 'PREMIUM_REQUIRED' },
    { status: 402 }
  )
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const premiumDenied = await ensurePremiumAccess(userId)
      if (premiumDenied) return premiumDenied

      const { searchParams } = new URL(request.url)
      const q = searchParams.get('q')?.trim() || ''

      const funcionarios = await prisma.funcionario.findMany({
        where: {
          userId,
          ...(q.length >= 2
            ? {
                OR: [
                  { nome: { contains: q, mode: 'insensitive' as const } },
                  { cargo: { contains: q, mode: 'insensitive' as const } },
                  ...(q.includes('@') ? [{ email: { contains: q, mode: 'insensitive' as const } }] : []),
                ],
              }
            : {}),
        },
        select: { id: true, nome: true, email: true, cargo: true },
        orderBy: { nome: 'asc' },
        take: q.length >= 2 ? 30 : 50,
      })

      const format = searchParams.get('format')
      if (format === 'options') {
        return NextResponse.json(
          funcionarios.map((f) => ({
            id: f.id,
            nome: f.nome,
            subtitulo: f.cargo || f.email || undefined,
            tipo: 'outro' as const,
          }))
        )
      }

      return NextResponse.json(funcionarios)
    } catch (error) {
      console.error('Erro ao listar funcionarios:', error)
      return NextResponse.json({ error: 'Erro ao listar funcionarios' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const premiumDenied = await ensurePremiumAccess(userId)
      if (premiumDenied) return premiumDenied

      const body = await request.json().catch(() => null)
      if (!body || typeof body !== 'object') {
        return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
      }

      const nome = typeof body.nome === 'string' ? body.nome.trim() : ''
      if (!nome) {
        return NextResponse.json({ error: 'Nome e obrigatorio' }, { status: 400 })
      }

      const funcionario = await prisma.funcionario.create({
        data: {
          userId,
          nome,
          email: typeof body.email === 'string' ? body.email.trim() || null : null,
          telefone: typeof body.telefone === 'string' ? body.telefone.trim() || null : null,
          documento: typeof body.documento === 'string' ? body.documento.trim() || null : null,
          cargo: typeof body.cargo === 'string' ? body.cargo.trim() || null : null,
          departamento: typeof body.departamento === 'string' ? body.departamento.trim() || null : null,
          observacoes: typeof body.observacoes === 'string' ? body.observacoes.trim() || null : null,
        },
      })

      return NextResponse.json(funcionario, { status: 201 })
    } catch (error) {
      console.error('Erro ao criar funcionario:', error)
      return NextResponse.json({ error: 'Erro ao criar funcionario' }, { status: 500 })
    }
  })
}
