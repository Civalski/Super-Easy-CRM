/**
 * Serviço de importação de dados do backup JSON.
 * Importa tudo exceto clientes (feito manualmente na aba de clientes).
 * Usa mapeamento por numero para resolver FKs (cliente, oportunidade, pedido).
 */
import { GoalMetricType, GoalPeriodType } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const VALID_METRIC_TYPES = new Set(Object.values(GoalMetricType))
const VALID_PERIOD_TYPES = new Set(Object.values(GoalPeriodType))

type BackupData = {
  version?: number
  exportedAt?: string
  clientes?: Array<{ id: string; numero: number; [k: string]: unknown }>
  contatos?: Array<Record<string, unknown>>
  tarefas?: Array<Record<string, unknown>>
  orcamentos?: Array<Record<string, unknown>>
  pedidos?: Array<Record<string, unknown>>
  pedidoItens?: Array<Record<string, unknown>>
  metas?: Array<Record<string, unknown>>
  goalSnapshots?: Array<Record<string, unknown>>
  contasReceber?: Array<Record<string, unknown>>
  movimentosFinanceiros?: Array<Record<string, unknown>>
  prospectos?: Array<Record<string, unknown>>
  produtosServicos?: Array<Record<string, unknown>>
}

function parseDate(v: unknown): Date | null {
  if (!v) return null
  const d = new Date(String(v))
  return Number.isNaN(d.getTime()) ? null : d
}

function parseNum(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export type ImportResult = {
  produtosServicos: number
  contatos: number
  tarefas: number
  orcamentos: number
  pedidos: number
  pedidoItens: number
  metas: number
  goalSnapshots: number
  contasReceber: number
  movimentosFinanceiros: number
  prospectos: number
  skipped: { orcamentos: number; pedidos: number; contatos: number }
}

export async function importBackupData(userId: string, data: BackupData): Promise<ImportResult> {
  const result: ImportResult = {
    produtosServicos: 0,
    contatos: 0,
    tarefas: 0,
    orcamentos: 0,
    pedidos: 0,
    pedidoItens: 0,
    metas: 0,
    goalSnapshots: 0,
    contasReceber: 0,
    movimentosFinanceiros: 0,
    prospectos: 0,
    skipped: { orcamentos: 0, pedidos: 0, contatos: 0 },
  }

  const clienteIdMap = new Map<string, string>()
  const oportunidadeIdMap = new Map<string, string>()
  const pedidoIdMap = new Map<string, string>()
  const contaReceberIdMap = new Map<string, string>()
  const produtoServicoIdMap = new Map<string, string>()
  const goalIdMap = new Map<string, string>()

  // 1) Build clienteIdMap: backup cliente id -> DB cliente id (by numero)
  const clientes = data.clientes ?? []
  for (const c of clientes) {
    const numero = typeof c.numero === 'number' ? c.numero : parseNum(c.numero)
    const existing = await prisma.cliente.findFirst({
      where: { userId, numero },
      select: { id: true },
    })
    if (existing) clienteIdMap.set(String(c.id), existing.id)
  }

  const resolveCliente = (oldId: string | null | undefined): string | null =>
    oldId ? (clienteIdMap.get(String(oldId)) ?? null) : null

  // 2) ProdutosServicos (match por codigo quando disponível)
  const produtos = data.produtosServicos ?? []
  for (const p of produtos) {
    const codigoStr = String(p.codigo ?? '').trim()
    if (codigoStr) {
      const existing = await prisma.produtoServico.findFirst({
        where: { userId, codigo: codigoStr },
        select: { id: true },
      })
      if (existing) {
        produtoServicoIdMap.set(String(p.id), existing.id)
        continue
      }
    }
    const created = await prisma.produtoServico.create({
      data: {
        userId,
        codigo: (p.codigo as string)?.trim() || undefined,
        nome: String(p.nome ?? ''),
        categoria: (p.categoria as string) ?? undefined,
        marca: (p.marca as string) ?? undefined,
        codigoBarras: (p.codigoBarras as string) ?? undefined,
        tipo: ((p.tipo as string) === 'produto' ? 'produto' : 'servico') as 'produto' | 'servico',
        unidade: (p.unidade as string) ?? 'UN',
        descricao: (p.descricao as string) ?? undefined,
        observacoesInternas: (p.observacoesInternas as string) ?? undefined,
        precoPadrao: parseNum(p.precoPadrao),
        custoPadrao: parseNum(p.custoPadrao),
        comissaoPercentual: parseNum(p.comissaoPercentual),
        controlaEstoque: Boolean(p.controlaEstoque),
        estoqueAtual: parseNum(p.estoqueAtual),
        estoqueMinimo: parseNum(p.estoqueMinimo),
        tempoPadraoMinutos: parseNum(p.tempoPadraoMinutos) || undefined,
        garantiaDias: parseNum(p.garantiaDias) || undefined,
        prazoEntregaDias: parseNum(p.prazoEntregaDias) || undefined,
        ativo: p.ativo !== false,
      },
    })
    produtoServicoIdMap.set(String(p.id), created.id)
    result.produtosServicos++
  }

  // 3) Contatos (require clienteId)
  const contatos = data.contatos ?? []
  for (const c of contatos) {
    const newClienteId = resolveCliente(c.clienteId as string)
    if (!newClienteId) {
      result.skipped.contatos++
      continue
    }
    await prisma.contato.create({
      data: {
        userId,
        clienteId: newClienteId,
        nome: String(c.nome ?? ''),
        email: (c.email as string) ?? undefined,
        telefone: (c.telefone as string) ?? undefined,
        cargo: (c.cargo as string) ?? undefined,
      },
    })
    result.contatos++
  }

  // 4) Oportunidades (require clienteId)
  const orcamentos = data.orcamentos ?? []
  for (const o of orcamentos) {
    const newClienteId = resolveCliente(o.clienteId as string)
    if (!newClienteId) {
      result.skipped.orcamentos++
      continue
    }
    const created = await prisma.oportunidade.create({
      data: {
        userId,
        clienteId: newClienteId,
        titulo: String(o.titulo ?? ''),
        descricao: (o.descricao as string) ?? undefined,
        valor: parseNum(o.valor) || undefined,
        status: (o.status as string) ?? 'orcamento',
        statusAnterior: (o.statusAnterior as string) ?? undefined,
        motivoPerda: (o.motivoPerda as string) ?? undefined,
        probabilidade: parseNum(o.probabilidade) || 0,
        dataFechamento: parseDate(o.dataFechamento),
        formaPagamento: (o.formaPagamento as string) ?? undefined,
        parcelas: parseNum(o.parcelas) || undefined,
        desconto: parseNum(o.desconto) || undefined,
        proximaAcaoEm: parseDate(o.proximaAcaoEm),
        canalProximaAcao: (o.canalProximaAcao as string) ?? undefined,
        responsavelProximaAcao: (o.responsavelProximaAcao as string) ?? undefined,
        lembreteProximaAcao: Boolean(o.lembreteProximaAcao),
      },
    })
    oportunidadeIdMap.set(String(o.id), created.id)
    result.orcamentos++
  }

  // 5) Pedidos (require oportunidadeId)
  const pedidos = data.pedidos ?? []
  for (const p of pedidos) {
    const newOportId = oportunidadeIdMap.get(String(p.oportunidadeId))
    if (!newOportId) {
      result.skipped.pedidos++
      continue
    }
    const created = await prisma.pedido.create({
      data: {
        userId,
        oportunidadeId: newOportId,
        statusEntrega: (p.statusEntrega as string) ?? 'pendente',
        pagamentoConfirmado: Boolean(p.pagamentoConfirmado),
        formaPagamento: (p.formaPagamento as string) ?? undefined,
        dataEntrega: parseDate(p.dataEntrega),
        observacoes: (p.observacoes as string) ?? undefined,
        totalBruto: parseNum(p.totalBruto),
        totalDesconto: parseNum(p.totalDesconto),
        totalLiquido: parseNum(p.totalLiquido),
      },
    })
    pedidoIdMap.set(String(p.id), created.id)
    result.pedidos++
  }

  // 6) PedidoItens (require pedidoId)
  const pedidoItens = data.pedidoItens ?? []
  for (const i of pedidoItens) {
    const newPedidoId = pedidoIdMap.get(String(i.pedidoId))
    if (!newPedidoId) continue
    const newProdId = i.produtoServicoId
      ? produtoServicoIdMap.get(String(i.produtoServicoId)) ?? undefined
      : undefined
    await prisma.pedidoItem.create({
      data: {
        userId,
        pedidoId: newPedidoId,
        produtoServicoId: newProdId ?? undefined,
        descricao: String(i.descricao ?? ''),
        quantidade: parseNum(i.quantidade) || 1,
        precoUnitario: parseNum(i.precoUnitario) || 0,
        desconto: parseNum(i.desconto) || 0,
        subtotal: parseNum(i.subtotal) || 0,
      },
    })
    result.pedidoItens++
  }

  // 7) Metas + GoalSnapshots
  const metas = data.metas ?? []
  for (const m of metas) {
    const metricType = VALID_METRIC_TYPES.has(m.metricType as GoalMetricType)
      ? (m.metricType as GoalMetricType)
      : GoalMetricType.VENDAS
    const periodType = VALID_PERIOD_TYPES.has(m.periodType as GoalPeriodType)
      ? (m.periodType as GoalPeriodType)
      : GoalPeriodType.MONTHLY
    const created = await prisma.goal.create({
      data: {
        userId,
        title: (m.title as string) ?? undefined,
        metricType,
        periodType,
        target: parseNum(m.target) || 0,
        startDate: parseDate(m.startDate),
        endDate: parseDate(m.endDate),
        weekDays: Array.isArray(m.weekDays) ? (m.weekDays as number[]).filter(Number.isInteger) : [],
      },
    })
    goalIdMap.set(String(m.id), created.id)
    result.metas++
  }

  const snapshots = data.goalSnapshots ?? []
  for (const s of snapshots) {
    const newGoalId = goalIdMap.get(String(s.goalId))
    if (!newGoalId) continue
    await prisma.goalSnapshot.create({
      data: {
        goalId: newGoalId,
        periodStart: parseDate(s.periodStart) ?? new Date(),
        periodEnd: parseDate(s.periodEnd) ?? new Date(),
        current: parseNum(s.current) || 0,
        target: parseNum(s.target) || 0,
        progress: parseNum(s.progress) || 0,
      },
    })
    result.goalSnapshots++
  }

  // 8) ContasReceber (pedidoId, oportunidadeId, clienteId - use maps)
  const contas = data.contasReceber ?? []
  for (const c of contas) {
    const oldPedidoId = c.pedidoId ? String(c.pedidoId) : null
    const newPedidoId = oldPedidoId ? pedidoIdMap.get(oldPedidoId) ?? undefined : undefined
    if (oldPedidoId && !newPedidoId) continue // pedido não importado, pula conta vinculada
    const newOportId = c.oportunidadeId
      ? oportunidadeIdMap.get(String(c.oportunidadeId)) ?? undefined
      : undefined
    const newClienteId = resolveCliente(c.clienteId as string)
    const created = await prisma.contaReceber.create({
      data: {
        userId,
        pedidoId: newPedidoId ?? undefined,
        oportunidadeId: newOportId ?? undefined,
        clienteId: newClienteId ?? undefined,
        ambiente: (c.ambiente as string) ?? 'geral',
        tipo: (c.tipo as string) ?? 'receber',
        descricao: (c.descricao as string) ?? undefined,
        valorTotal: parseNum(c.valorTotal) || 0,
        valorRecebido: parseNum(c.valorRecebido) || 0,
        autoDebito: Boolean(c.autoDebito),
        grupoParcelaId: undefined, // perda de vínculo entre parcelas no restore
        numeroParcela: parseNum(c.numeroParcela) || undefined,
        totalParcelas: parseNum(c.totalParcelas) || undefined,
        recorrenteMensal: Boolean(c.recorrenteMensal),
        recorrenciaAtiva: Boolean(c.recorrenciaAtiva),
        recorrenciaDiaVencimento: parseNum(c.recorrenciaDiaVencimento) || undefined,
        dataVencimento: parseDate(c.dataVencimento),
        status: (c.status as string) ?? 'pendente',
        multaPorAtrasoPercentual: parseNum(c.multaPorAtrasoPercentual) || undefined,
        multaPorAtrasoValor: parseNum(c.multaPorAtrasoValor) || undefined,
        multaPorAtrasoPeriodo: (c.multaPorAtrasoPeriodo as string) ?? undefined,
      },
    })
    contaReceberIdMap.set(String(c.id), created.id)
    result.contasReceber++
  }

  // 9) MovimentosFinanceiros
  const movimentos = data.movimentosFinanceiros ?? []
  for (const m of movimentos) {
    const newContaId = contaReceberIdMap.get(String(m.contaReceberId))
    if (!newContaId) continue
    await prisma.movimentoFinanceiro.create({
      data: {
        userId,
        contaReceberId: newContaId,
        tipo: (m.tipo as string) ?? 'entrada',
        valor: parseNum(m.valor) || 0,
        dataMovimento: parseDate(m.dataMovimento) ?? new Date(),
        observacoes: (m.observacoes as string) ?? undefined,
      },
    })
    result.movimentosFinanceiros++
  }

  // 10) Tarefas (clienteId, oportunidadeId from maps)
  const tarefas = data.tarefas ?? []
  for (const t of tarefas) {
    const newClienteId = resolveCliente(t.clienteId as string)
    const newOportId = t.oportunidadeId
      ? oportunidadeIdMap.get(String(t.oportunidadeId)) ?? undefined
      : undefined
    await prisma.tarefa.create({
      data: {
        userId,
        titulo: String(t.titulo ?? ''),
        descricao: (t.descricao as string) ?? undefined,
        status: (t.status as string) ?? 'pendente',
        prioridade: (t.prioridade as string) ?? 'media',
        dataVencimento: parseDate(t.dataVencimento),
        dataAviso: parseDate(t.dataAviso),
        clienteId: newClienteId ?? undefined,
        oportunidadeId: newOportId ?? undefined,
        notificar: Boolean(t.notificar),
      },
    })
    result.tarefas++
  }

  // 11) Prospectos (clienteId optional)
  const prospectos = data.prospectos ?? []
  for (const p of prospectos) {
    const newClienteId = resolveCliente(p.clienteId as string)
    try {
      await prisma.prospecto.create({
        data: {
          userId,
          cnpj: String(p.cnpj ?? ''),
          cnpjBasico: String(p.cnpjBasico ?? ''),
          cnpjOrdem: String(p.cnpjOrdem ?? ''),
          cnpjDv: String(p.cnpjDv ?? ''),
          razaoSocial: String(p.razaoSocial ?? ''),
          nomeFantasia: (p.nomeFantasia as string) ?? undefined,
          capitalSocial: (p.capitalSocial as string) ?? undefined,
          porte: (p.porte as string) ?? undefined,
          naturezaJuridica: (p.naturezaJuridica as string) ?? undefined,
          situacaoCadastral: (p.situacaoCadastral as string) ?? undefined,
          dataAbertura: (p.dataAbertura as string) ?? undefined,
          matrizFilial: (p.matrizFilial as string) ?? undefined,
          cnaePrincipal: (p.cnaePrincipal as string) ?? undefined,
          cnaePrincipalDesc: (p.cnaePrincipalDesc as string) ?? undefined,
          cnaesSecundarios: (p.cnaesSecundarios as string) ?? undefined,
          tipoLogradouro: (p.tipoLogradouro as string) ?? undefined,
          logradouro: (p.logradouro as string) ?? undefined,
          numero: (p.numero as string) ?? undefined,
          complemento: (p.complemento as string) ?? undefined,
          bairro: (p.bairro as string) ?? undefined,
          cep: (p.cep as string) ?? undefined,
          municipio: String(p.municipio ?? ''),
          uf: String(p.uf ?? ''),
          telefone1: (p.telefone1 as string) ?? undefined,
          telefone2: (p.telefone2 as string) ?? undefined,
          fax: (p.fax as string) ?? undefined,
          email: (p.email as string) ?? undefined,
          status: (p.status as string) ?? 'novo',
          observacoes: (p.observacoes as string) ?? undefined,
          prioridade: parseNum(p.prioridade) || 0,
          lote: (p.lote as string) ?? undefined,
          dataImportacao: parseDate(p.dataImportacao) ?? new Date(),
          ultimoContato: parseDate(p.ultimoContato),
          clienteId: newClienteId ?? undefined,
        },
      })
      result.prospectos++
    } catch {
      // P2002: unique (userId, cnpj) - prospecto já existe
    }
  }

  return result
}
