/**
 * GET /api/users/me/export
 *
 * Exporta todos os dados operacionais do usuário (clientes, contatos, tarefas,
 * orçamentos, pedidos, metas, financeiro, prospectos, produtos) em JSON.
 * Útil para backup e processamento por LLM.
 */
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/route-helpers'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function serializeDate(d: Date | null | undefined): string | null {
  if (!d) return null
  return d.toISOString()
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const [
        clientes,
        contatos,
        tarefas,
        oportunidades,
        pedidos,
        pedidoItens,
        metas,
        goalSnapshots,
        contasReceber,
        movimentosFinanceiros,
        prospectos,
        produtosServicos,
      ] = await Promise.all([
        prisma.cliente.findMany({
          where: { userId },
          orderBy: { numero: 'asc' },
        }),
        prisma.contato.findMany({
          where: { userId },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.tarefa.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.oportunidade.findMany({
          where: { userId },
          orderBy: { numero: 'asc' },
        }),
        prisma.pedido.findMany({
          where: { userId },
          orderBy: { numero: 'asc' },
        }),
        prisma.pedidoItem.findMany({
          where: { userId },
          orderBy: [{ pedidoId: 'asc' }, { createdAt: 'asc' }],
        }),
        prisma.goal.findMany({
          where: { userId },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.goalSnapshot.findMany({
          where: {
            goal: { userId },
          },
          orderBy: { periodStart: 'asc' },
        }),
        prisma.contaReceber.findMany({
          where: { userId },
          orderBy: { dataVencimento: 'asc' },
        }),
        prisma.movimentoFinanceiro.findMany({
          where: { userId },
          orderBy: { dataMovimento: 'asc' },
        }),
        prisma.prospecto.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.produtoServico.findMany({
          where: { userId },
          orderBy: { nome: 'asc' },
        }),
      ])

      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        clientes: clientes.map((c) => ({
          ...c,
          createdAt: serializeDate(c.createdAt),
          updatedAt: serializeDate(c.updatedAt),
        })),
        contatos: contatos.map((c) => ({
          ...c,
          createdAt: serializeDate(c.createdAt),
          updatedAt: serializeDate(c.updatedAt),
        })),
        tarefas: tarefas.map((t) => ({
          ...t,
          dataVencimento: serializeDate(t.dataVencimento),
          dataAviso: serializeDate(t.dataAviso),
          createdAt: serializeDate(t.createdAt),
          updatedAt: serializeDate(t.updatedAt),
        })),
        orcamentos: oportunidades.map((o) => ({
          ...o,
          dataFechamento: serializeDate(o.dataFechamento),
          proximaAcaoEm: serializeDate(o.proximaAcaoEm),
          createdAt: serializeDate(o.createdAt),
          updatedAt: serializeDate(o.updatedAt),
        })),
        pedidos: pedidos.map((p) => ({
          ...p,
          dataEntrega: serializeDate(p.dataEntrega),
          dataAprovacao: serializeDate(p.dataAprovacao),
          createdAt: serializeDate(p.createdAt),
          updatedAt: serializeDate(p.updatedAt),
        })),
        pedidoItens: pedidoItens.map((i) => ({
          ...i,
          createdAt: serializeDate(i.createdAt),
          updatedAt: serializeDate(i.updatedAt),
        })),
        metas: metas.map((m) => ({
          ...m,
          startDate: serializeDate(m.startDate),
          endDate: serializeDate(m.endDate),
          createdAt: serializeDate(m.createdAt),
          updatedAt: serializeDate(m.updatedAt),
        })),
        goalSnapshots: goalSnapshots.map((s) => ({
          ...s,
          periodStart: serializeDate(s.periodStart),
          periodEnd: serializeDate(s.periodEnd),
          createdAt: serializeDate(s.createdAt),
          updatedAt: serializeDate(s.updatedAt),
        })),
        contasReceber: contasReceber.map((c) => ({
          ...c,
          dataVencimento: serializeDate(c.dataVencimento),
          createdAt: serializeDate(c.createdAt),
          updatedAt: serializeDate(c.updatedAt),
        })),
        movimentosFinanceiros: movimentosFinanceiros.map((m) => ({
          ...m,
          dataMovimento: serializeDate(m.dataMovimento),
          createdAt: serializeDate(m.createdAt),
          updatedAt: serializeDate(m.updatedAt),
        })),
        prospectos: prospectos.map((p) => ({
          ...p,
          dataImportacao: serializeDate(p.dataImportacao),
          ultimoContato: serializeDate(p.ultimoContato),
          createdAt: serializeDate(p.createdAt),
          updatedAt: serializeDate(p.updatedAt),
        })),
        produtosServicos: produtosServicos.map((p) => ({
          ...p,
          createdAt: serializeDate(p.createdAt),
          updatedAt: serializeDate(p.updatedAt),
        })),
      }

      const dateStr = new Date().toISOString().slice(0, 10)
      const json = JSON.stringify(exportData, null, 2)

      return new NextResponse(json, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="backup-crm-${dateStr}.json"`,
        },
      })
    } catch (error) {
      console.error('Erro ao exportar dados:', error)
      return NextResponse.json(
        { error: 'Erro ao exportar dados. Tente novamente.' },
        { status: 500 }
      )
    }
  })
}
