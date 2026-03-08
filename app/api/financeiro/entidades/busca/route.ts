import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import { getUserSubscriptionAccess } from '@/lib/billing/subscription-access'

export const dynamic = 'force-dynamic'

const TIPOS = ['cliente', 'fornecedor', 'funcionario'] as const

async function ensurePremiumAccess(userId: string) {
  const access = await getUserSubscriptionAccess(userId)
  if (!access.schemaReady) return NextResponse.json({ error: 'Schema nao pronto' }, { status: 503 })
  if (access.active) return null
  return NextResponse.json({ error: 'Premium requerido' }, { status: 402 })
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const premiumDenied = await ensurePremiumAccess(userId)
      if (premiumDenied) return premiumDenied

      const { searchParams } = new URL(request.url)
      const tipoParam = searchParams.get('tipo')
      const tipo = TIPOS.includes(tipoParam as (typeof TIPOS)[number]) ? (tipoParam as (typeof TIPOS)[number]) : 'cliente'
      const q = searchParams.get('q')?.trim() || ''

      if (tipo === 'cliente') {
        const clientes = await prisma.cliente.findMany({
          where: {
            userId,
            ...(q.length >= 2
              ? {
                  OR: [
                    { nome: { contains: q, mode: 'insensitive' as const } },
                    { empresa: { contains: q, mode: 'insensitive' as const } },
                    ...(q.includes('@') ? [{ email: { contains: q, mode: 'insensitive' as const } }] : []),
                  ],
                }
              : {}),
          },
          select: { id: true, nome: true, email: true, empresa: true },
          orderBy: { nome: 'asc' },
          take: q.length >= 2 ? 20 : 10,
        })
        return NextResponse.json(
          clientes.map((c) => ({
            id: c.id,
            nome: c.nome,
            subtitulo: c.empresa || c.email || undefined,
            tipo: 'cliente' as const,
          }))
        )
      }

      if (tipo === 'fornecedor') {
        const fornecedores = await prisma.fornecedor.findMany({
          where: {
            userId,
            ...(q.length >= 2
              ? {
                  OR: [
                    { nome: { contains: q, mode: 'insensitive' as const } },
                    { empresa: { contains: q, mode: 'insensitive' as const } },
                    ...(q.includes('@') ? [{ email: { contains: q, mode: 'insensitive' as const } }] : []),
                  ],
                }
              : {}),
          },
          select: { id: true, nome: true, email: true, empresa: true },
          orderBy: { nome: 'asc' },
          take: q.length >= 2 ? 20 : 10,
        })
        return NextResponse.json(
          fornecedores.map((f) => ({
            id: f.id,
            nome: f.nome,
            subtitulo: f.empresa || f.email || undefined,
            tipo: 'outro' as const,
            tipoEntidade: 'fornecedor' as const,
          }))
        )
      }

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
        take: q.length >= 2 ? 20 : 10,
      })
      return NextResponse.json(
        funcionarios.map((f) => ({
          id: f.id,
          nome: f.nome,
          subtitulo: f.cargo || f.email || undefined,
          tipo: 'outro' as const,
          tipoEntidade: 'funcionario' as const,
        }))
      )
    } catch (error) {
      console.error('Erro ao buscar entidades financeiras:', error)
      return NextResponse.json({ error: 'Erro ao buscar' }, { status: 500 })
    }
  })
}
