import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const { searchParams } = new URL(request.url)
      const query = searchParams.get('q')?.trim() || ''

      if (!query || query.length < 2) {
        const clientesRecentes = await prisma.cliente.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            nome: true,
            email: true,
            empresa: true,
          },
        })
        return NextResponse.json(
          clientesRecentes.map((c) => ({
            id: c.id,
            nome: c.nome,
            subtitulo: c.empresa || c.email || undefined,
            tipo: 'cliente' as const,
            original: c,
          }))
        )
      }

      const clientes = await prisma.cliente.findMany({
        where: {
          userId,
          OR: [
            { nome: { contains: query, mode: 'insensitive' } },
            { empresa: { contains: query, mode: 'insensitive' } },
            ...(query.includes('@') ? [{ email: { contains: query, mode: 'insensitive' as const } }] : []),
          ],
        },
        select: {
          id: true,
          nome: true,
          email: true,
          empresa: true,
        },
        take: 20,
        orderBy: { nome: 'asc' },
      })

      return NextResponse.json(
        clientes.map((c) => ({
          id: c.id,
          nome: c.nome,
          subtitulo: c.empresa || c.email || undefined,
          tipo: 'cliente' as const,
          original: c,
        }))
      )
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar clientes' },
        { status: 500 }
      )
    }
  })
}
