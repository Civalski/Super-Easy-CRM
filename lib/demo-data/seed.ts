import { GoalMetricType, GoalPeriodType, Prisma, type Prisma as PrismaNamespace } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { roundMoney } from '@/lib/money'
import {
  DEMO_CLIENTS,
  DEMO_CONTACTS,
  DEMO_GOALS,
  DEMO_LOSS_REASONS,
  DEMO_PRODUCTS,
  DEMO_PROSPECTS,
} from './constants'
import { clearDemoDataForUser } from './cleanup'

type DemoTx = PrismaNamespace.TransactionClient

function daysFromNow(days: number, hour = 10) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, 0, 0, 0)
  return date
}

async function track(tx: DemoTx, userId: string, model: string, recordId: string) {
  await tx.demoDataRecord.create({
    data: { userId, model, recordId },
  })
}

async function createGoalSnapshot(tx: DemoTx, goalId: string, target: number, current: number) {
  const now = new Date()
  const progress = Math.min(100, Math.round((current / Math.max(1, target)) * 100))
  let periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  let periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  return tx.goalSnapshot.create({
    data: {
      goalId,
      periodStart,
      periodEnd,
      current,
      target,
      progress,
    },
  })
}

async function getNextNumeroStart(tx: DemoTx, tableName: 'clientes' | 'oportunidades' | 'pedidos') {
  const rows = await tx.$queryRaw<Array<{ maxNumero: number | null }>>(
    Prisma.sql`SELECT COALESCE(MAX("numero"), 0) AS "maxNumero" FROM ${Prisma.raw(`"${tableName}"`)}`
  )

  return Number(rows[0]?.maxNumero ?? 0) + 1
}

export async function ensureDemoDataForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { demoModeActive: true, demoDataSeededAt: true },
  })

  if (user?.demoModeActive && user.demoDataSeededAt) {
    return { alreadySeeded: true }
  }

  await clearDemoDataForUser(userId).catch(() => null)

  return prisma.$transaction(async (tx) => {
    const summary: Record<string, number> = {}
    let nextClienteNumero = await getNextNumeroStart(tx, 'clientes')
    let nextOportunidadeNumero = await getNextNumeroStart(tx, 'oportunidades')
    let nextPedidoNumero = await getNextNumeroStart(tx, 'pedidos')

    const clients = await Promise.all(
      DEMO_CLIENTS.map(async (client, index) => {
        const created = await tx.cliente.create({
          data: {
            numero: nextClienteNumero++,
            userId,
            nome: client.nome,
            email: client.email,
            telefone: client.telefone,
            empresa: client.empresa,
            cidade: client.cidade,
            estado: client.estado,
            observacoes: client.observacoes,
            createdAt: daysFromNow(-(12 - index), 9),
            updatedAt: daysFromNow(-(2 + index), 11),
          },
        })
        await track(tx, userId, 'Cliente', created.id)
        return created
      })
    )
    summary.Cliente = clients.length

    summary.Contato = 0
    for (const contact of DEMO_CONTACTS) {
      const created = await tx.contato.create({
        data: {
          userId,
          nome: contact.nome,
          email: contact.email,
          telefone: contact.telefone,
          cargo: contact.cargo,
          clienteId: clients[contact.clienteIndex].id,
          createdAt: daysFromNow(-6, 14),
        },
      })
      await track(tx, userId, 'Contato', created.id)
      summary.Contato += 1
    }

    summary.Prospecto = 0
    for (const prospect of DEMO_PROSPECTS) {
      const created = await tx.prospecto.create({
        data: {
          userId,
          cnpj: prospect.cnpj,
          cnpjBasico: prospect.cnpj.slice(0, 8),
          cnpjOrdem: prospect.cnpj.slice(8, 12),
          cnpjDv: prospect.cnpj.slice(12),
          razaoSocial: prospect.razaoSocial,
          nomeFantasia: prospect.nomeFantasia,
          municipio: prospect.municipio,
          uf: prospect.uf,
          telefone1: prospect.telefone1,
          email: prospect.email,
          status: prospect.status,
          createdAt: daysFromNow(-5, 10),
          updatedAt: daysFromNow(-1, 16),
        },
      })
      await track(tx, userId, 'Prospecto', created.id)
      summary.Prospecto += 1
    }

    summary.ProdutoServico = 0
    const products = []
    for (const product of DEMO_PRODUCTS) {
      const created = await tx.produtoServico.create({
        data: {
          userId,
          nome: product.nome,
          tipo: product.tipo,
          categoria: product.categoria,
          precoPadrao: product.precoPadrao,
          custoPadrao: roundMoney(product.precoPadrao * 0.45),
          controlaEstoque: product.tipo === 'produto',
          estoqueAtual: product.tipo === 'produto' ? 20 : 0,
          ativo: true,
        },
      })
      products.push(created)
      await track(tx, userId, 'ProdutoServico', created.id)
      summary.ProdutoServico += 1
    }

    summary.MotivoPerda = 0
    for (const name of DEMO_LOSS_REASONS) {
      const created = await tx.motivoPerda.create({ data: { userId, nome: name } })
      await track(tx, userId, 'MotivoPerda', created.id)
      summary.MotivoPerda += 1
    }

    const opportunities = await Promise.all([
      tx.oportunidade.create({ data: { numero: nextOportunidadeNumero++, userId, clienteId: clients[0].id, titulo: 'Automacao do atendimento', descricao: 'Projeto demo para onboarding.', valor: 22500, status: 'orcamento', probabilidade: 64, formaPagamento: 'cartao', proximaAcaoEm: daysFromNow(1, 14), canalProximaAcao: 'reuniao', responsavelProximaAcao: 'Marina Lopes', lembreteProximaAcao: true, createdAt: daysFromNow(-4, 9) } }),
      tx.oportunidade.create({ data: { numero: nextOportunidadeNumero++, userId, clienteId: clients[3].id, titulo: 'Dashboard executivo', descricao: 'Painel com indicadores para diretoria.', valor: 14800, status: 'orcamento', probabilidade: 58, formaPagamento: 'pix', proximaAcaoEm: daysFromNow(2, 16), canalProximaAcao: 'email', responsavelProximaAcao: 'Felipe Duarte', createdAt: daysFromNow(-3, 11) } }),
      tx.oportunidade.create({ data: { numero: nextOportunidadeNumero++, userId, clienteId: clients[1].id, titulo: 'Pacote suporte trimestral', descricao: 'Pedido em andamento com entrada parcial.', valor: 9400, status: 'pedido', probabilidade: 92, formaPagamento: 'pix', createdAt: daysFromNow(-8, 10), updatedAt: daysFromNow(-1, 12) } }),
      tx.oportunidade.create({ data: { numero: nextOportunidadeNumero++, userId, clienteId: clients[2].id, titulo: 'Treinamento onsite', descricao: 'Venda concluida para equipe do cliente.', valor: 6800, status: 'fechada', probabilidade: 100, formaPagamento: 'cartao', dataFechamento: daysFromNow(-2, 15), createdAt: daysFromNow(-10, 9), updatedAt: daysFromNow(-2, 15) } }),
      tx.oportunidade.create({ data: { numero: nextOportunidadeNumero++, userId, clienteId: clients[3].id, titulo: 'Renovacao anual do contrato', descricao: 'Negociacao perdida por prazo do concorrente.', valor: 26400, status: 'perdida', statusAnterior: 'orcamento', motivoPerda: DEMO_LOSS_REASONS[1], probabilidade: 28, dataFechamento: daysFromNow(-4, 13), createdAt: daysFromNow(-14, 9), updatedAt: daysFromNow(-4, 13) } }),
    ])
    for (const opportunity of opportunities) await track(tx, userId, 'Oportunidade', opportunity.id)
    summary.Oportunidade = opportunities.length

    const tasks = await Promise.all([
      tx.tarefa.create({ data: { userId, clienteId: clients[0].id, oportunidadeId: opportunities[0].id, titulo: 'Revisar proposta final', descricao: 'Cliente pediu detalhamento dos itens premium.', status: 'pendente', prioridade: 'alta', dataVencimento: daysFromNow(0, 14), createdAt: daysFromNow(-1, 9) } }),
      tx.tarefa.create({ data: { userId, clienteId: clients[1].id, oportunidadeId: opportunities[2].id, titulo: 'Confirmar entrada via pix', descricao: 'Validar comprovante recebido no WhatsApp.', status: 'em_andamento', prioridade: 'media', dataVencimento: daysFromNow(0, 16), createdAt: daysFromNow(-1, 11) } }),
      tx.tarefa.create({ data: { userId, clienteId: clients[2].id, oportunidadeId: opportunities[3].id, titulo: 'Preparar treinamento do cliente', descricao: 'Organizar kickoff e materiais.', status: 'concluida', prioridade: 'alta', dataVencimento: daysFromNow(-1, 10), createdAt: daysFromNow(-3, 10) } }),
    ])
    for (const task of tasks) await track(tx, userId, 'Tarefa', task.id)
    summary.Tarefa = tasks.length

    const orders = []
    orders.push(await tx.pedido.create({ data: { numero: nextPedidoNumero++, userId, oportunidadeId: opportunities[2].id, statusEntrega: 'em_preparacao', pagamentoConfirmado: false, formaPagamento: 'pix', dataEntrega: daysFromNow(2, 15), totalBruto: 9400, totalLiquido: 9400, createdAt: daysFromNow(-2, 10) } }))
    orders.push(await tx.pedido.create({ data: { numero: nextPedidoNumero++, userId, oportunidadeId: opportunities[3].id, statusEntrega: 'entregue', pagamentoConfirmado: true, formaPagamento: 'cartao', dataEntrega: daysFromNow(-1, 10), totalBruto: 6800, totalLiquido: 6800, createdAt: daysFromNow(-5, 10) } }))
    orders.push(await tx.pedido.create({ data: { numero: nextPedidoNumero++, userId, oportunidadeId: opportunities[4].id, statusEntrega: 'pendente', pagamentoConfirmado: false, formaPagamento: 'boleto', totalBruto: 26400, totalLiquido: 26400, createdAt: daysFromNow(-6, 10) } }))
    for (const order of orders) await track(tx, userId, 'Pedido', order.id)
    summary.Pedido = orders.length

    const orderItems = await Promise.all([
      tx.pedidoItem.create({ data: { userId, pedidoId: orders[0].id, produtoServicoId: products[1].id, descricao: products[1].nome, quantidade: 2, precoUnitario: 2800, subtotal: 5600 } }),
      tx.pedidoItem.create({ data: { userId, pedidoId: orders[0].id, produtoServicoId: products[2].id, descricao: products[2].nome, quantidade: 1, precoUnitario: 3800, subtotal: 3800 } }),
      tx.pedidoItem.create({ data: { userId, pedidoId: orders[1].id, produtoServicoId: products[0].id, descricao: products[0].nome, quantidade: 1, precoUnitario: 4200, subtotal: 4200 } }),
      tx.pedidoItem.create({ data: { userId, pedidoId: orders[1].id, produtoServicoId: products[3].id, descricao: products[3].nome, quantidade: 1, precoUnitario: 2600, subtotal: 2600 } }),
    ])
    for (const item of orderItems) await track(tx, userId, 'PedidoItem', item.id)
    summary.PedidoItem = orderItems.length

    const accounts = await Promise.all([
      tx.contaReceber.create({ data: { userId, pedidoId: orders[0].id, oportunidadeId: opportunities[2].id, clienteId: clients[1].id, tipo: 'receber', descricao: 'Recebimento pedido #1', valorTotal: 9400, valorRecebido: 3200, status: 'parcial', dataVencimento: daysFromNow(0, 18) } }),
      tx.contaReceber.create({ data: { userId, pedidoId: orders[1].id, oportunidadeId: opportunities[3].id, clienteId: clients[2].id, tipo: 'receber', descricao: 'Recebimento pedido #2', valorTotal: 6800, valorRecebido: 6800, status: 'pago', dataVencimento: daysFromNow(-1, 10) } }),
      tx.contaReceber.create({ data: { userId, tipo: 'pagar', descricao: 'Licenca operacional mensal', valorTotal: 980, valorRecebido: 0, autoDebito: true, status: 'atrasado', recorrenteMensal: true, recorrenciaAtiva: true, recorrenciaDiaVencimento: new Date().getDate(), grupoParcelaId: `demo-rec-${userId}`, dataVencimento: daysFromNow(-4, 9) } }),
    ])
    for (const account of accounts) await track(tx, userId, 'ContaReceber', account.id)
    summary.ContaReceber = accounts.length

    const movements = await Promise.all([
      tx.movimentoFinanceiro.create({ data: { userId, contaReceberId: accounts[0].id, tipo: 'entrada', valor: 3200, observacoes: 'Entrada inicial demo' } }),
      tx.movimentoFinanceiro.create({ data: { userId, contaReceberId: accounts[1].id, tipo: 'entrada', valor: 6800, observacoes: 'Venda quitada demo' } }),
      tx.movimentoFinanceiro.create({ data: { userId, contaReceberId: accounts[2].id, tipo: 'saida', valor: 980, observacoes: 'Debito operacional demo' } }),
    ])
    for (const movement of movements) await track(tx, userId, 'MovimentoFinanceiro', movement.id)
    summary.MovimentoFinanceiro = movements.length

    summary.Goal = 0
    summary.GoalSnapshot = 0
    for (const goalConfig of DEMO_GOALS) {
      const current = goalConfig.metricType === GoalMetricType.CLIENTES_CADASTRADOS ? clients.length : goalConfig.metricType === GoalMetricType.PROPOSTAS ? 3 : 1
      const goal = await tx.goal.create({ data: { userId, title: goalConfig.title, metricType: goalConfig.metricType, periodType: goalConfig.periodType, target: goalConfig.target } })
      await track(tx, userId, 'Goal', goal.id)
      summary.Goal += 1

      const snapshot = await createGoalSnapshot(tx, goal.id, goalConfig.target, current)
      await track(tx, userId, 'GoalSnapshot', snapshot.id)
      summary.GoalSnapshot += 1
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        demoModeActive: true,
        demoDataSeededAt: new Date(),
      },
    })

    return { alreadySeeded: false, summary }
  })
}
