import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const { searchParams } = new URL(request.url)
        const query = searchParams.get('q')?.trim() || ''
        const context = searchParams.get('context')?.trim()
        const useCompactRecentList = context === 'oportunidade'
        const recentLimit = useCompactRecentList ? 3 : 5

        // Sem busca digitada, retorna lista recente curta para reduzir ruido.
        if (!query) {
            const [clientesRecentes, prospectosRecentes] = await Promise.all([
                prisma.cliente.findMany({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
                    take: recentLimit,
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        empresa: true,
                        createdAt: true,
                    },
                }),
                prisma.prospecto.findMany({
                    where: {
                        userId,
                        status: { not: 'convertido' },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: recentLimit,
                    select: {
                        id: true,
                        razaoSocial: true,
                        nomeFantasia: true,
                        email: true,
                        status: true,
                        createdAt: true,
                    },
                }),
            ])

            const resultados = [
                ...clientesRecentes.map((c) => ({
                    id: c.id,
                    nome: c.nome,
                    subtitulo: c.empresa || c.email || 'Cliente recente',
                    tipo: 'cliente' as const,
                    createdAt: c.createdAt,
                    original: c,
                })),
                ...prospectosRecentes.map((p) => ({
                    id: p.id,
                    nome: p.nomeFantasia || p.razaoSocial,
                    subtitulo: `${p.status.toUpperCase()} - ${p.razaoSocial || 'Lead'}`,
                    tipo: 'prospecto' as const,
                    createdAt: p.createdAt,
                    original: p,
                })),
            ]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, recentLimit)
                .map(({ createdAt, ...item }) => item)

            return NextResponse.json(resultados)
        }

        if (query.length < 2) {
            return NextResponse.json([])
        }

        // Buscar clientes por nome e opcionalmente por email.
        const clientes = await prisma.cliente.findMany({
            where: {
                userId,
                OR: [
                    { nome: { contains: query, mode: 'insensitive' } },
                    ...(query.includes('@')
                        ? [{ email: { contains: query, mode: 'insensitive' as const } }]
                        : []),
                ],
            },
            select: {
                id: true,
                nome: true,
                email: true,
                empresa: true,
            },
            take: 5,
        })

        // Buscar leads nao convertidos.
        const prospectos = await prisma.prospecto.findMany({
            where: {
                userId,
                status: { not: 'convertido' },
                OR: [
                    { razaoSocial: { contains: query, mode: 'insensitive' } },
                    { nomeFantasia: { contains: query, mode: 'insensitive' } },
                    ...(query.includes('@')
                        ? [{ email: { contains: query, mode: 'insensitive' as const } }]
                        : []),
                ],
            },
            select: {
                id: true,
                razaoSocial: true,
                nomeFantasia: true,
                email: true,
                status: true,
            },
            take: 5,
        })

        const resultados = [
            ...clientes.map((c) => ({
                id: c.id,
                nome: c.nome,
                subtitulo: c.empresa || c.email || 'Cliente',
                tipo: 'cliente' as const,
                original: c,
            })),
            ...prospectos.map((p) => ({
                id: p.id,
                nome: p.nomeFantasia || p.razaoSocial,
                subtitulo: `${p.status.toUpperCase()} - ${p.razaoSocial || 'Lead'}`,
                tipo: 'prospecto' as const,
                original: p,
            })),
        ]

      return NextResponse.json(resultados)
    } catch (error) {
      console.error('Erro ao buscar pessoas:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar pessoas' },
        { status: 500 }
      )
    }
  })
}
