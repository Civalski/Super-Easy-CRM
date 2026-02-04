import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar contagens de forma paralela para melhor performance
    const [clientesCount, oportunidadesCount, tarefasCount, oportunidades] = await Promise.all([
      prisma.cliente.count({ where: { userId } }),
      prisma.oportunidade.count({ where: { userId } }),
      prisma.tarefa.count({ where: { userId } }),
      prisma.oportunidade.findMany({
        where: { userId },
        select: {
          status: true,
          valor: true,
        },
      }),
    ])

    // Calcular valor total (excluindo oportunidades perdidas)
    const valorTotal = oportunidades
      .filter((opp) => opp.status !== 'perdida')
      .reduce((sum, opp) => sum + (opp.valor || 0), 0)

    const valorGanhos = oportunidades
      .filter((opp) => opp.status === 'fechada')
      .reduce((sum, opp) => sum + (opp.valor || 0), 0)

    const valorPerdidos = oportunidades
      .filter((opp) => opp.status === 'perdida')
      .reduce((sum, opp) => sum + (opp.valor || 0), 0)

    // Agrupar oportunidades por status
    const oportunidadesPorStatusMap = oportunidades.reduce((acc, opp) => {
      acc[opp.status] = (acc[opp.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const oportunidadesPorStatus = Object.entries(oportunidadesPorStatusMap).map(([status, count]) => ({
      status,
      _count: count,
    }))

    return NextResponse.json({
      clientesCount,
      oportunidadesCount,
      tarefasCount,
      valorTotal,
      valorGanhos,
      valorPerdidos,
      oportunidadesPorStatus,
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas do dashboard' },
      { status: 500 }
    )
  }
}

