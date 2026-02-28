import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Filter logic
    const filter = request.nextUrl.searchParams.get('filter')
    const dateParam = request.nextUrl.searchParams.get('date')
    const referenceDate = dateParam ? new Date(dateParam) : new Date()

    let startDate: Date
    let endDate: Date

    if (filter === 'day') {
      startDate = startOfDay(referenceDate)
      endDate = endOfDay(referenceDate)
    } else {
      // Default to month
      startDate = startOfMonth(referenceDate)
      endDate = endOfMonth(referenceDate)
    }

    // Create date filter object
    const dateFilter = {
      gte: startDate,
      lte: endDate,
    }

    // Buscar dados de forma paralela
    const [
      clientesCount,
      oportunidadesCount,
      tarefasCount,
      valorTotalAgg,
      valorGanhosAgg,
      valorPerdidosAgg,
      oportunidadesStatusGroups,
      tarefasStatusGroups
    ] = await Promise.all([
      // Contagens baseadas em criação (novos no período)
      prisma.cliente.count({
        where: { userId, createdAt: dateFilter }
      }),
      prisma.oportunidade.count({
        where: { userId, createdAt: dateFilter }
      }),
      prisma.tarefa.count({
        where: { userId, createdAt: dateFilter }
      }),

      // Valor Total (Pipeline gerado no período - excluindo perdidas)
      prisma.oportunidade.aggregate({
        _sum: { valor: true },
        where: {
          userId,
          status: { not: 'perdida' },
          createdAt: dateFilter
        }
      }),

      // Valor Ganhos (Fechadas no período)
      prisma.oportunidade.aggregate({
        _sum: { valor: true },
        where: {
          userId,
          status: 'fechada',
          updatedAt: dateFilter // Usando updatedAt para capturar quando foi fechada
        }
      }),

      // Valor Perdidos (Perdidas no período)
      prisma.oportunidade.aggregate({
        _sum: { valor: true },
        where: {
          userId,
          status: 'perdida',
          updatedAt: dateFilter // Usando updatedAt para capturar quando foi perdida
        }
      }),

      // Status distribution (Baseado em criação no período)
      prisma.oportunidade.groupBy({
        by: ['status'],
        _count: { status: true },
        where: {
          userId,
          createdAt: dateFilter
        }
      }),

      // Task status distribution (Baseado em criacao no periodo)
      prisma.tarefa.groupBy({
        by: ['status'],
        _count: { status: true },
        where: {
          userId,
          createdAt: dateFilter
        }
      }),
    ])

    const valorTotal = valorTotalAgg._sum.valor || 0
    const valorGanhos = valorGanhosAgg._sum.valor || 0
    const valorPerdidos = valorPerdidosAgg._sum.valor || 0

    const oportunidadesPorStatus = oportunidadesStatusGroups.map((group) => ({
      status: group.status,
      _count: group._count.status,
    }))

    const tarefasPorStatus = tarefasStatusGroups.map((group) => ({
      status: group.status,
      _count: group._count.status,
    }))

    return NextResponse.json({
      clientesCount,
      oportunidadesCount,
      tarefasCount,
      valorTotal,
      valorGanhos,
      valorPerdidos,
      oportunidadesPorStatus,
      tarefasPorStatus,
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas do dashboard' },
      { status: 500 }
    )
  }
}
