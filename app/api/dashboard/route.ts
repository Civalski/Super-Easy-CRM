import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Buscar contagens de forma paralela para melhor performance
    const [clientesCount, oportunidadesCount, tarefasCount, oportunidades] = await Promise.all([
      prisma.cliente.count(),
      prisma.oportunidade.count(),
      prisma.tarefa.count(),
      prisma.oportunidade.findMany({
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

