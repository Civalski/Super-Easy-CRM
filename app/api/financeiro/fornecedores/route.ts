import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'

export const dynamic = 'force-dynamic'

async function ensurePremiumAccess(userId: string) {
  void userId
  return null
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const premiumDenied = await ensurePremiumAccess(userId)
      if (premiumDenied) return premiumDenied

      const { searchParams } = new URL(request.url)
      const q = searchParams.get('q')?.trim() || ''

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
        take: q.length >= 2 ? 30 : 50,
      })

      const format = searchParams.get('format')
      if (format === 'options') {
        return NextResponse.json(
          fornecedores.map((f) => ({
            id: f.id,
            nome: f.nome,
            subtitulo: f.empresa || f.email || undefined,
            tipo: 'outro' as const,
          }))
        )
      }

      return NextResponse.json(fornecedores)
    } catch (error) {
      console.error('Erro ao listar fornecedores:', error)
      return NextResponse.json({ error: 'Erro ao listar fornecedores' }, { status: 500 })
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

      const fornecedor = await prisma.fornecedor.create({
        data: {
          userId,
          nome,
          email: typeof body.email === 'string' ? body.email.trim() || null : null,
          telefone: typeof body.telefone === 'string' ? body.telefone.trim() || null : null,
          documento: typeof body.documento === 'string' ? body.documento.trim() || null : null,
          empresa: typeof body.empresa === 'string' ? body.empresa.trim() || null : null,
          endereco: typeof body.endereco === 'string' ? body.endereco.trim() || null : null,
          cidade: typeof body.cidade === 'string' ? body.cidade.trim() || null : null,
          estado: typeof body.estado === 'string' ? body.estado.trim() || null : null,
          cep: typeof body.cep === 'string' ? body.cep.trim() || null : null,
          observacoes: typeof body.observacoes === 'string' ? body.observacoes.trim() || null : null,
        },
      })

      return NextResponse.json(fornecedor, { status: 201 })
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error)
      return NextResponse.json({ error: 'Erro ao criar fornecedor' }, { status: 500 })
    }
  })
}
