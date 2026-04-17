import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensureDatabaseInitialized } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import { parseLimit, parsePage } from '@/lib/validations/common'

export const dynamic = 'force-dynamic'
const STATUS_VALUES = ['em_andamento', 'aprovado_assinado', 'rejeitado'] as const

function parseOptionalString(value: unknown): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') return null
  const t = value.trim()
  return t === '' ? null : t
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      await ensureDatabaseInitialized()

      const { searchParams } = new URL(request.url)
      const page = parsePage(searchParams.get('page'))
      const limit = parseLimit(searchParams.get('limit'), 20, 100)
      const tipo = parseOptionalString(searchParams.get('tipo'))
      const excludeTipo = parseOptionalString(searchParams.get('excludeTipo'))
      const statusRaw = parseOptionalString(searchParams.get('status'))
      const dataInicioRaw = parseOptionalString(searchParams.get('dataInicio'))
      const dataFimRaw = parseOptionalString(searchParams.get('dataFim'))
      const status = STATUS_VALUES.includes(statusRaw as (typeof STATUS_VALUES)[number])
        ? (statusRaw as (typeof STATUS_VALUES)[number])
        : null

      const dataInicio = dataInicioRaw ? new Date(`${dataInicioRaw}T00:00:00`) : null
      const dataFim = dataFimRaw ? new Date(`${dataFimRaw}T23:59:59.999`) : null

      const where: {
        userId: string
        status?: (typeof STATUS_VALUES)[number]
        tipo?: string | { not: string }
        createdAt?: { gte?: Date; lte?: Date }
      } = { userId }

      if (status) where.status = status
      if (tipo) {
        where.tipo = tipo
      } else if (excludeTipo) {
        where.tipo = { not: excludeTipo }
      }
      if (dataInicio || dataFim) {
        where.createdAt = {}
        if (dataInicio && !Number.isNaN(dataInicio.getTime())) where.createdAt.gte = dataInicio
        if (dataFim && !Number.isNaN(dataFim.getTime())) where.createdAt.lte = dataFim
      }

      const [rows, total] = await Promise.all([
        prisma.contrato.findMany({
          where,
          include: {
            cliente: { select: { id: true, nome: true } },
            oportunidade: { select: { id: true, titulo: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.contrato.count({ where }),
      ])

      const data = rows.map((c) => ({
        ...c,
        clausulas: (c.clausulas as unknown[]) ?? [],
        dadosPartes: (c.dadosPartes as Record<string, unknown>) ?? {},
      }))

      return NextResponse.json({
        data,
        meta: {
          total,
          page,
          limit,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
      })
    } catch (error) {
      console.error('[api/contratos] GET error:', error)
      return NextResponse.json(
        { error: 'Erro ao listar contratos' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      await ensureDatabaseInitialized()

      const body = await request.json().catch(() => null)
      if (!body || typeof body !== 'object') {
        return NextResponse.json(
          { error: 'Corpo da requisição inválido' },
          { status: 400 }
        )
      }

      const titulo = parseOptionalString(body.titulo) ?? 'Contrato sem titulo'

      const tipo = parseOptionalString(body.tipo) ?? 'geral'
      const statusRaw = parseOptionalString(body.status)
      const status = STATUS_VALUES.includes(statusRaw as (typeof STATUS_VALUES)[number])
        ? (statusRaw as (typeof STATUS_VALUES)[number])
        : 'em_andamento'
      const descricao = parseOptionalString(body.descricao)
      const preambulo = parseOptionalString(body.preambulo)
      const clausulasRaw = Array.isArray(body.clausulas)
        ? body.clausulas.filter(
            (c: unknown) =>
              c &&
              typeof c === 'object' &&
              typeof (c as { titulo?: unknown }).titulo === 'string' &&
              typeof (c as { conteudo?: unknown }).conteudo === 'string'
          ).map((c: { titulo: string; conteudo: string }) => ({
            titulo: String(c.titulo).trim(),
            conteudo: String(c.conteudo).trim(),
          }))
        : []
      const clausulas = tipo === 'proposta' ? [] : clausulasRaw
      const dadosPartes =
        body.dadosPartes && typeof body.dadosPartes === 'object'
          ? body.dadosPartes
          : {}

      const parseDate = (v: unknown): Date | null => {
        if (!v) return null
        const d = new Date(String(v))
        return Number.isNaN(d.getTime()) ? null : d
      }

      const dataInicio = parseDate(body.dataInicio)
      const dataFim = parseDate(body.dataFim)
      const dataAssinatura = parseDate(body.dataAssinatura)
      const localAssinatura = parseOptionalString(body.localAssinatura)
      const observacoes = parseOptionalString(body.observacoes)
      const clienteId = parseOptionalString(body.clienteId)
      const oportunidadeId = parseOptionalString(body.oportunidadeId)

      const contrato = await prisma.contrato.create({
        data: {
          userId,
          titulo,
          status,
          tipo,
          descricao: descricao ?? undefined,
          preambulo: preambulo ?? undefined,
          clausulas: clausulas as object,
          dadosPartes: dadosPartes as object,
          dataInicio: dataInicio ?? undefined,
          dataFim: dataFim ?? undefined,
          dataAssinatura: dataAssinatura ?? undefined,
          localAssinatura: localAssinatura ?? undefined,
          observacoes: observacoes ?? undefined,
          clienteId: clienteId ?? undefined,
          oportunidadeId: oportunidadeId ?? undefined,
        },
        include: {
          cliente: { select: { id: true, nome: true } },
          oportunidade: { select: { id: true, titulo: true } },
        },
      })

      return NextResponse.json({
        ...contrato,
        clausulas: (contrato.clausulas as unknown[]) ?? [],
        dadosPartes: (contrato.dadosPartes as Record<string, unknown>) ?? {},
      })
    } catch (error) {
      console.error('[api/contratos] POST error:', error)
      return NextResponse.json(
        { error: 'Erro ao criar contrato' },
        { status: 500 }
      )
    }
  })
}
