import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'

export const dynamic = 'force-dynamic'

/**
 * Reseta as sequences de numero (clientes, oportunidades, pedidos) quando
 * a tabela correspondente estiver vazia, para que novos registros comecem em 1.
 * Em produção (ex: Supabase), o usuário pode não ter permissão ALTER SEQUENCE;
 * nesse caso, ignora o reset sem falhar a operação principal.
 */
async function resetSequencesIfEmpty(): Promise<string[]> {
  const [clientesCount, oportunidadesCount, pedidosCount] = await Promise.all([
    prisma.cliente.count(),
    prisma.oportunidade.count(),
    prisma.pedido.count(),
  ])

  const resets: string[] = []
  try {
    if (clientesCount === 0) {
      await prisma.$executeRaw(Prisma.sql`ALTER SEQUENCE clientes_numero_seq RESTART WITH 1`)
      resets.push('clientes')
    }
    if (oportunidadesCount === 0) {
      await prisma.$executeRaw(Prisma.sql`ALTER SEQUENCE oportunidades_numero_seq RESTART WITH 1`)
      resets.push('oportunidades')
    }
    if (pedidosCount === 0) {
      await prisma.$executeRaw(Prisma.sql`ALTER SEQUENCE pedidos_numero_seq RESTART WITH 1`)
      resets.push('pedidos')
    }
  } catch (seqError) {
    // Em produção (ex: Supabase), o role pode não ter permissão para ALTER SEQUENCE.
    // A exclusão dos dados já foi feita; o reset é apenas conveniência.
    console.warn('Reset de sequences ignorado (sem permissão ou sequence inexistente):', seqError)
  }
  return resets
}

/**
 * DELETE /api/users/me/data
 * Remove todos os dados operacionais da conta do usuário (clientes, contatos,
 * oportunidades, pedidos, tarefas, prospectos, metas, etc.). O usuário não é apagado.
 * Quando todas as tabelas de clientes, orçamentos e pedidos ficarem vazias,
 * as contagens (códigos) são resetadas para começar em 1.
 */
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const resumo = await prisma.$transaction(async (tx) => {
        // Ordem respeitando FKs: entidades dependentes primeiro
        const movimentos = await tx.movimentoFinanceiro.deleteMany({ where: { userId } })
        const contasReceber = await tx.contaReceber.deleteMany({ where: { userId } })
        const pedidoItens = await tx.pedidoItem.deleteMany({ where: { userId } })
        const pedidos = await tx.pedido.deleteMany({ where: { userId } })
        const followUpAttempts = await tx.followUpAttempt.deleteMany({ where: { userId } })
        const tarefas = await tx.tarefa.deleteMany({ where: { userId } })
        const oportunidades = await tx.oportunidade.deleteMany({ where: { userId } })
        const contratos = await tx.contrato.deleteMany({ where: { userId } })
        const iaGeracoesContrato = await tx.iaGeracaoContrato.deleteMany({ where: { userId } })
        const contatos = await tx.contato.deleteMany({ where: { userId } })
        const prospectos = await tx.prospecto.deleteMany({ where: { userId } })

        const goalIds = await tx.goal.findMany({
          where: { userId },
          select: { id: true },
        })
        const goalSnapshots =
          goalIds.length > 0
            ? await tx.goalSnapshot.deleteMany({
                where: { goalId: { in: goalIds.map((g) => g.id) } },
              })
            : { count: 0 }
        const metas = await tx.goal.deleteMany({ where: { userId } })
        const motivosPerda = await tx.motivoPerda.deleteMany({ where: { userId } })
        const clientes = await tx.cliente.deleteMany({ where: { userId } })
        const prospectoAgendamentos = await tx.prospectoEnvioAgendado.deleteMany({
          where: { userId },
        })

        const metaConfig = await tx.metaContatoConfig.findUnique({
          where: { userId },
          select: { id: true },
        })
        if (metaConfig) {
          await tx.metaContatoDiaEsquecido.deleteMany({
            where: { configId: metaConfig.id },
          })
        }
        await tx.metaContatoConfig.deleteMany({ where: { userId } })
        const produtosServicos = await tx.produtoServico.deleteMany({ where: { userId } })
        await tx.pdfConfig.deleteMany({ where: { userId } })

        return {
          clientes: clientes.count,
          contatos: contatos.count,
          oportunidades: oportunidades.count,
          contratos: contratos.count,
          iaGeracoesContrato: iaGeracoesContrato.count,
          pedidos: pedidos.count,
          pedidoItens: pedidoItens.count,
          tarefas: tarefas.count,
          prospectos: prospectos.count,
          metas: metas.count,
          metasSnapshots: goalSnapshots.count,
          motivosPerda: motivosPerda.count,
          contasReceber: contasReceber.count,
          movimentosFinanceiros: movimentos.count,
          prospectoAgendamentos: prospectoAgendamentos.count,
          produtosServicos: produtosServicos.count,
        }
      })

      const sequencesResetadas = await resetSequencesIfEmpty()

      const total = Object.values(resumo).reduce((a, b) => a + b, 0)
      const msgBase =
        total > 0
          ? `Dados excluídos com sucesso. ${total} registro(s) removido(s).`
          : 'Nenhum dado a excluir.'
      const msgSequences =
        sequencesResetadas.length > 0
          ? ` Contagens resetadas: ${sequencesResetadas.join(', ')}.`
          : ''

      return NextResponse.json({
        message: msgBase + msgSequences,
        resumo,
        sequencesResetadas,
      })
    } catch (error) {
      console.error('Erro ao excluir dados do usuário:', error)
      return NextResponse.json(
        { error: 'Erro ao excluir dados. Tente novamente.' },
        { status: 500 }
      )
    }
  })
}
