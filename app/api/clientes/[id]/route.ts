import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

type CampoPersonalizado = {
  label: string
  value: string
}

type HistoricoComercial = {
  resumo: {
    orcamentosEmAberto: number
    pedidosEmAberto: number
    comprasConcluidas: number
    cancelamentos: number
    gastoMesAtual: number
    gastoUltimosSeisMeses: number
  }
  gastoMensalUltimosSeisMeses: Array<{
    mes: string
    valor: number
  }>
  oportunidadesRecentes: Array<{
    id: string
    titulo: string
    status: string
    valor: number | null
    motivoPerda: string | null
    createdAt: Date
    updatedAt: Date
    pedidoId: string | null
  }>
  pedidosRecentes: Array<{
    id: string
    numero: number
    statusEntrega: string
    pagamentoConfirmado: boolean
    totalLiquido: number
    createdAt: Date
    updatedAt: Date
    oportunidade: {
      id: string
      titulo: string
      status: string
    }
  }>
}

const normalizeOptionalString = (
  value: unknown,
  options: { maxLength?: number; upperCase?: boolean } = {}
) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const normalized = options.upperCase ? trimmed.toUpperCase() : trimmed
  if (options.maxLength && normalized.length > options.maxLength) {
    return normalized.slice(0, options.maxLength)
  }
  return normalized
}

const sanitizeCamposPersonalizados = (value: unknown): CampoPersonalizado[] | null => {
  if (!Array.isArray(value)) return null

  const campos = value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const field = item as { label?: unknown; value?: unknown }
      const label = normalizeOptionalString(field.label, { maxLength: 80 })
      if (!label) return null
      const fieldValue = normalizeOptionalString(field.value, { maxLength: 500 }) ?? ''
      return { label, value: fieldValue }
    })
    .filter((item): item is CampoPersonalizado => item !== null)
    .slice(0, 20)

  return campos.length > 0 ? campos : null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(request, async (userId) => {
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      const startOfLastSixMonthsWindow = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0)

      const cliente = await prisma.cliente.findFirst({
        where: { id, userId },
      include: {
        _count: {
          select: {
            oportunidades: true,
            contatos: true,
          },
        },
        prospecto: true,
      },
    })

    if (cliente) {
      const [
        orcamentosEmAberto,
        pedidosEmAberto,
        comprasConcluidas,
        cancelamentos,
        oportunidadesRecentes,
        pedidosRecentes,
        pedidosUltimosSeisMeses,
      ] =
        await Promise.all([
          prisma.oportunidade.count({
            where: {
              userId,
              clienteId: cliente.id,
              status: 'orcamento',
              pedido: {
                is: null,
              },
            },
          }),
          prisma.pedido.count({
            where: {
              userId,
              oportunidade: {
                is: {
                  userId,
                  clienteId: cliente.id,
                  status: {
                    not: 'perdida',
                  },
                },
              },
              OR: [
                { statusEntrega: { not: 'entregue' } },
                { pagamentoConfirmado: false },
              ],
            },
          }),
          prisma.pedido.count({
            where: {
              userId,
              oportunidade: {
                is: {
                  userId,
                  clienteId: cliente.id,
                  status: 'fechada',
                },
              },
              statusEntrega: 'entregue',
              pagamentoConfirmado: true,
            },
          }),
          prisma.oportunidade.count({
            where: {
              userId,
              clienteId: cliente.id,
              status: 'perdida',
              pedido: {
                is: null,
              },
            },
          }),
          prisma.oportunidade.findMany({
            where: {
              userId,
              clienteId: cliente.id,
            },
            orderBy: { updatedAt: 'desc' },
            take: 25,
            select: {
              id: true,
              titulo: true,
              status: true,
              valor: true,
              motivoPerda: true,
              createdAt: true,
              updatedAt: true,
              pedido: {
                select: {
                  id: true,
                },
              },
            },
          }),
          prisma.pedido.findMany({
            where: {
              userId,
              oportunidade: {
                is: {
                  userId,
                  clienteId: cliente.id,
                },
              },
            },
            orderBy: { updatedAt: 'desc' },
            take: 25,
            select: {
              id: true,
              numero: true,
              statusEntrega: true,
              pagamentoConfirmado: true,
              totalLiquido: true,
              createdAt: true,
              updatedAt: true,
              oportunidade: {
                select: {
                  id: true,
                  titulo: true,
                  status: true,
                },
              },
            },
          }),
          prisma.pedido.findMany({
            where: {
              userId,
              createdAt: {
                gte: startOfLastSixMonthsWindow,
              },
              oportunidade: {
                is: {
                  userId,
                  clienteId: cliente.id,
                  status: {
                    not: 'perdida',
                  },
                },
              },
            },
            select: {
              createdAt: true,
              totalLiquido: true,
            },
          }),
        ])

      const monthKeys: string[] = Array.from({ length: 6 }, (_, index) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1, 0, 0, 0, 0)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      })
      const monthLabels = new Map(
        monthKeys.map((key) => {
          const [year, month] = key.split('-').map(Number)
          const date = new Date(year, (month || 1) - 1, 1)
          return [
            key,
            date.toLocaleDateString('pt-BR', {
              month: 'short',
              year: '2-digit',
            }),
          ]
        })
      )
      const gastoPorMes = new Map<string, number>(monthKeys.map((key) => [key, 0]))
      let gastoMesAtual = 0
      let gastoUltimosSeisMeses = 0

      for (const pedido of pedidosUltimosSeisMeses) {
        const valor = Number(pedido.totalLiquido || 0)
        if (Number.isNaN(valor)) continue

        const pedidoDate = new Date(pedido.createdAt)
        if (pedidoDate >= startOfMonth) {
          gastoMesAtual += valor
        }

        const key = `${pedidoDate.getFullYear()}-${String(pedidoDate.getMonth() + 1).padStart(2, '0')}`
        if (gastoPorMes.has(key)) {
          gastoPorMes.set(key, (gastoPorMes.get(key) || 0) + valor)
          gastoUltimosSeisMeses += valor
        }
      }

      const historicoComercial: HistoricoComercial = {
        resumo: {
          orcamentosEmAberto,
          pedidosEmAberto,
          comprasConcluidas,
          cancelamentos,
          gastoMesAtual,
          gastoUltimosSeisMeses,
        },
        gastoMensalUltimosSeisMeses: monthKeys.map((key) => ({
          mes: monthLabels.get(key) || key,
          valor: gastoPorMes.get(key) || 0,
        })),
        oportunidadesRecentes: oportunidadesRecentes.map((oportunidade) => ({
          id: oportunidade.id,
          titulo: oportunidade.titulo,
          status: oportunidade.status,
          valor: oportunidade.valor,
          motivoPerda: oportunidade.motivoPerda,
          createdAt: oportunidade.createdAt,
          updatedAt: oportunidade.updatedAt,
          pedidoId: oportunidade.pedido?.id ?? null,
        })),
        pedidosRecentes,
      }

      return NextResponse.json({
        ...cliente,
        historicoComercial,
      })
    }

    const prospecto = await prisma.prospecto.findFirst({
      where: { id, userId },
    })

    if (prospecto) {
      const enderecoCompleto = prospecto.logradouro
        ? `${prospecto.tipoLogradouro || ''} ${prospecto.logradouro}, ${prospecto.numero || ''} ${prospecto.complemento || ''}`.trim()
        : null

      const virtualCliente = {
        id: prospecto.id,
        nome: prospecto.nomeFantasia || prospecto.razaoSocial,
        email: prospecto.email,
        telefone: prospecto.telefone1,
        empresa: prospecto.razaoSocial,
        endereco: enderecoCompleto,
        cidade: prospecto.municipio,
        estado: prospecto.uf,
        cep: prospecto.cep,
        cargo: null,
        documento: null,
        website: null,
        dataNascimento: null,
        observacoes: null,
        camposPersonalizados: null,
        createdAt: prospecto.createdAt,
        updatedAt: prospecto.updatedAt,
        _count: {
          oportunidades: 0,
          contatos: 0,
        },
        historicoComercial: {
          resumo: {
            orcamentosEmAberto: 0,
            pedidosEmAberto: 0,
            comprasConcluidas: 0,
            cancelamentos: 0,
            gastoMesAtual: 0,
            gastoUltimosSeisMeses: 0,
          },
          gastoMensalUltimosSeisMeses: [],
          oportunidadesRecentes: [],
          pedidosRecentes: [],
        },
        prospecto,
        isVirtual: true,
      }

      return NextResponse.json(virtualCliente)
    }

    return NextResponse.json(
      { error: 'Cliente ou Prospecto nao encontrado' },
      { status: 404 }
    )
    } catch (error) {
      console.error('Erro ao buscar cliente:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar cliente' },
        { status: 500 }
      )
    }
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(request, async (userId) => {
    try {
      const body = await request.json()
    const {
      nome,
      email,
      telefone,
      empresa,
      endereco,
      cidade,
      estado,
      cep,
      cargo,
      documento,
      website,
      dataNascimento,
      observacoes,
      camposPersonalizados,
    } = body

    const clienteExistente = await prisma.cliente.findFirst({
      where: { id, userId },
    })

    if (!clienteExistente) {
      return NextResponse.json(
        { error: 'Cliente nao encontrado' },
        { status: 404 }
      )
    }

    const nomeNormalizado = nome !== undefined ? normalizeOptionalString(nome, { maxLength: 120 }) : undefined
    if (nome !== undefined && !nomeNormalizado) {
      return NextResponse.json(
        { error: 'Nome e obrigatorio' },
        { status: 400 }
      )
    }

    const emailNormalizado = email !== undefined
      ? normalizeOptionalString(email, { maxLength: 120 })
      : undefined

    if (emailNormalizado) {
      const emailEmUso = await prisma.cliente.findFirst({
        where: {
          email: emailNormalizado,
          id: { not: id },
          userId,
        },
      })
      if (emailEmUso) {
        return NextResponse.json(
          { error: 'Ja existe um cliente com este email' },
          { status: 400 }
        )
      }
    }

    const updateData = {
      ...(nome !== undefined && { nome: nomeNormalizado as string }),
      ...(email !== undefined && { email: emailNormalizado ?? null }),
      ...(telefone !== undefined && { telefone: normalizeOptionalString(telefone, { maxLength: 30 }) }),
      ...(empresa !== undefined && { empresa: normalizeOptionalString(empresa, { maxLength: 120 }) }),
      ...(endereco !== undefined && { endereco: normalizeOptionalString(endereco, { maxLength: 200 }) }),
      ...(cidade !== undefined && { cidade: normalizeOptionalString(cidade, { maxLength: 80 }) }),
      ...(estado !== undefined && { estado: normalizeOptionalString(estado, { maxLength: 2, upperCase: true }) }),
      ...(cep !== undefined && { cep: normalizeOptionalString(cep, { maxLength: 12 }) }),
      ...(cargo !== undefined && { cargo: normalizeOptionalString(cargo, { maxLength: 100 }) }),
      ...(documento !== undefined && { documento: normalizeOptionalString(documento, { maxLength: 30 }) }),
      ...(website !== undefined && { website: normalizeOptionalString(website, { maxLength: 200 }) }),
      ...(dataNascimento !== undefined && { dataNascimento: normalizeOptionalString(dataNascimento, { maxLength: 20 }) }),
      ...(observacoes !== undefined && { observacoes: normalizeOptionalString(observacoes, { maxLength: 2000 }) }),
      ...(camposPersonalizados !== undefined && {
        camposPersonalizados:
          sanitizeCamposPersonalizados(camposPersonalizados) ?? Prisma.DbNull,
      }),
    }

    const updated = await prisma.cliente.updateMany({
      where: { id, userId },
      data: updateData,
    })

    if (updated.count === 0) {
      return NextResponse.json(
        { error: 'Cliente nao encontrado' },
        { status: 404 }
      )
    }

    const clienteAtualizado = await prisma.cliente.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: {
            oportunidades: true,
            contatos: true,
          },
        },
      },
    })

      return NextResponse.json(clienteAtualizado)
    } catch (error: unknown) {
      console.error('Erro ao atualizar cliente:', error)
      const prismaError = error as { code?: string }
      if (prismaError.code === 'P2025') {
        return NextResponse.json(
          { error: 'Cliente nao encontrado' },
          { status: 404 }
        )
      }
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          { error: 'Ja existe um cliente com este email' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Erro ao atualizar cliente' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(request, async (userId) => {
    try {
      const result = await prisma.cliente.deleteMany({
        where: { id, userId },
      })

      if (result.count === 0) {
        return NextResponse.json(
          { error: 'Cliente nao encontrado' },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true })
    } catch (error: unknown) {
      console.error('Erro ao deletar cliente:', error)
      const prismaError = error as { code?: string }
      if (prismaError.code === 'P2025') {
        return NextResponse.json(
          { error: 'Cliente nao encontrado' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Erro ao deletar cliente' },
        { status: 500 }
      )
    }
  })
}

