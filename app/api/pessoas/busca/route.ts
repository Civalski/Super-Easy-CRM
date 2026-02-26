import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(request)
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q')?.trim() || ''

        // Se a busca estiver vazia, retorna os 5 últimos clientes cadastrados (pré-carregamento leve)
        if (!query) {
            const recentes = await prisma.cliente.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    nome: true,
                    email: true,
                    empresa: true,
                }
            })

            const resultados = recentes.map(c => ({
                id: c.id,
                nome: c.nome,
                subtitulo: c.empresa || c.email || 'Cliente Recente',
                tipo: 'cliente' as const,
                original: c
            }))

            return NextResponse.json(resultados)
        }

        if (query.length < 2) {
            return NextResponse.json([])
        }

        // Buscar Clientes - Busca apenas por NOME ou EMAIL (se for email)
        const clientes = await prisma.cliente.findMany({
            where: {
                userId,
                OR: [
                    { nome: { contains: query, mode: 'insensitive' } },
                    // Se o usuário digitou um email, podemos tentar buscar
                    ...(query.includes('@') ? [{ email: { contains: query, mode: 'insensitive' as const } }] : [])
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

        // Buscar Prospectos não convertidos
        const prospectos = await prisma.prospecto.findMany({
            where: {
                userId,
                status: { not: 'convertido' },
                OR: [
                    { razaoSocial: { contains: query, mode: 'insensitive' } },
                    { nomeFantasia: { contains: query, mode: 'insensitive' } },
                    ...(query.includes('@') ? [{ email: { contains: query, mode: 'insensitive' as const } }] : [])
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

        // Normalizar resultados
        const resultados = [
            ...clientes.map(c => ({
                id: c.id,
                nome: c.nome,
                subtitulo: c.empresa || c.email || 'Cliente',
                tipo: 'cliente' as const,
                original: c
            })),
            ...prospectos.map(p => ({
                id: p.id,
                nome: p.nomeFantasia || p.razaoSocial,
                subtitulo: `${p.status.toUpperCase()} - ${p.razaoSocial || 'Prospecto'}`,
                tipo: 'prospecto' as const,
                original: p
            }))
        ]

        return NextResponse.json(resultados)
    } catch (error) {
        console.error('Erro ao buscar pessoas:', error)
        return NextResponse.json(
            { error: 'Erro ao buscar pessoas' },
            { status: 500 }
        )
    }
}
