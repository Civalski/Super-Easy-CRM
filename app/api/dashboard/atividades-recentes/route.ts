export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      // Buscar dados mais recentes de cada tipo com mais detalhes
        const [tarefas, oportunidades, clientes, metas] = await Promise.all([
            prisma.tarefa.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    cliente: { select: { id: true, nome: true } },
                    oportunidade: { select: { id: true, titulo: true } }
                }
            }),
            prisma.oportunidade.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    cliente: { select: { id: true, nome: true } }
                }
            }),
            prisma.cliente.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    contatos: { take: 1 }
                }
            }),
            prisma.goal.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 10,
            })
        ])

        const metricLabels: Record<string, string> = {
            CLIENTES_CONTATADOS: 'Clientes contatados',
            PROPOSTAS: 'Orçamentos',
            CLIENTES_CADASTRADOS: 'Clientes cadastrados',
            VENDAS: 'Vendas',
            QUALIFICACAO: 'Em potencial',
            NEGOCIACAO: 'Negociação',
            PROSPECCAO: 'Prospecção',
            FATURAMENTO: 'Faturamento',
        }
        const periodLabels: Record<string, string> = {
            DAILY: 'Diária',
            WEEKLY: 'Semanal',
            MONTHLY: 'Mensal',
            CUSTOM: 'Personalizada',
        }

        // Normalizar dados mantendo objeto original para detalhes
        const activities = [
            ...tarefas.map(t => ({
                id: t.id,
                type: 'tarefa',
                title: t.titulo,
                description: t.cliente ? `Para: ${t.cliente.nome}` : undefined,
                date: t.createdAt,
                details: t, // Objeto completo
            })),
            ...oportunidades.map(o => ({
                id: o.id,
                type: 'oportunidade',
                title: o.titulo,
                description: `Cliente: ${o.cliente.nome} | Valor: ${o.valor ? `R$ ${o.valor}` : 'N/A'}`,
                date: o.createdAt,
                details: o,
            })),
            ...clientes.map(c => ({
                id: c.id,
                type: 'cliente',
                title: c.nome,
                description: c.empresa || undefined,
                date: c.createdAt,
                details: c,
            })),
            ...metas.map(g => ({
                id: g.id,
                type: 'meta',
                title: g.title || metricLabels[g.metricType] || 'Meta',
                description: `${periodLabels[g.periodType] || g.periodType} | Meta: ${g.target}`,
                date: g.createdAt,
                details: g,
            }))
        ]

        // Ordenar por data e pegar os 10 mais recentes
        const recentActivities = activities
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10)

      return NextResponse.json(recentActivities)
    } catch (error) {
      console.error('Erro ao buscar atividades recentes:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar atividades recentes' },
        { status: 500 }
      )
    }
  })
}
