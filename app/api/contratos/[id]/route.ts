import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensureDatabaseInitialized } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'

export const dynamic = 'force-dynamic'
const STATUS_VALUES = ['em_andamento', 'aprovado_assinado', 'rejeitado'] as const

function parseOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function parseDate(v: unknown): Date | null {
  if (!v) return null
  const d = new Date(String(v))
  return Number.isNaN(d.getTime()) ? null : d
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (userId) => {
    try {
      await ensureDatabaseInitialized()

      const { id } = await params
      const body = await request.json().catch(() => null)
      if (!body || typeof body !== 'object') {
        return NextResponse.json({ error: 'Corpo da requisicao invalido' }, { status: 400 })
      }

      const contrato = await prisma.contrato.findFirst({
        where: { id, userId },
      })

      if (!contrato) {
        return NextResponse.json({ error: 'Contrato nao encontrado' }, { status: 404 })
      }

      const titulo = parseOptionalString(body.titulo)
      const statusRaw = parseOptionalString(body.status)
      const status = statusRaw && STATUS_VALUES.includes(statusRaw as (typeof STATUS_VALUES)[number])
        ? (statusRaw as (typeof STATUS_VALUES)[number])
        : null
      const tipo = parseOptionalString(body.tipo)
      const descricao = parseOptionalString(body.descricao)
      const preambulo = parseOptionalString(body.preambulo)
      const localAssinatura = parseOptionalString(body.localAssinatura)
      const observacoes = parseOptionalString(body.observacoes)
      const clienteIdSent = 'clienteId' in body
      const oportunidadeIdSent = 'oportunidadeId' in body
      const clienteId = clienteIdSent ? (parseOptionalString(body.clienteId) || null) : undefined
      const oportunidadeId = oportunidadeIdSent
        ? (parseOptionalString(body.oportunidadeId) || null)
        : undefined

      const clausulas = Array.isArray(body.clausulas)
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
        : null

      const dadosPartes =
        body.dadosPartes && typeof body.dadosPartes === 'object' ? body.dadosPartes : null

      const dataInicio = body.dataInicio !== undefined ? parseDate(body.dataInicio) : undefined
      const dataFim = body.dataFim !== undefined ? parseDate(body.dataFim) : undefined
      const dataAssinatura =
        body.dataAssinatura !== undefined ? parseDate(body.dataAssinatura) : undefined

      const hasFullUpdate =
        titulo !== null ||
        status !== null ||
        tipo !== null ||
        descricao !== null ||
        preambulo !== null ||
        clausulas !== null ||
        dadosPartes !== null ||
        localAssinatura !== null ||
        observacoes !== null ||
        clienteIdSent ||
        oportunidadeIdSent ||
        dataInicio !== undefined ||
        dataFim !== undefined ||
        dataAssinatura !== undefined

      if (!hasFullUpdate) {
        return NextResponse.json({ error: 'Nenhum campo valido para atualizar' }, { status: 400 })
      }

      const updateData: Record<string, unknown> = {}
      if (titulo !== null) updateData.titulo = titulo
      if (status !== null) updateData.status = status
      if (tipo !== null) updateData.tipo = tipo
      if (descricao !== null) updateData.descricao = descricao
      if (preambulo !== null) updateData.preambulo = preambulo
      if (clausulas !== null) updateData.clausulas = clausulas
      if (dadosPartes !== null) updateData.dadosPartes = dadosPartes
      if (localAssinatura !== null) updateData.localAssinatura = localAssinatura
      if (observacoes !== null) updateData.observacoes = observacoes
      if (clienteIdSent) updateData.clienteId = clienteId
      if (oportunidadeIdSent) updateData.oportunidadeId = oportunidadeId
      if (dataInicio !== undefined) updateData.dataInicio = dataInicio
      if (dataFim !== undefined) updateData.dataFim = dataFim
      if (dataAssinatura !== undefined) updateData.dataAssinatura = dataAssinatura

      const updated = await prisma.contrato.update({
        where: { id },
        data: updateData as Parameters<typeof prisma.contrato.update>[0]['data'],
        include: {
          cliente: { select: { id: true, nome: true } },
          oportunidade: { select: { id: true, titulo: true } },
        },
      })

      return NextResponse.json(updated)
    } catch (error) {
      console.error('[api/contratos] PATCH error:', error)
      return NextResponse.json({ error: 'Erro ao atualizar contrato' }, { status: 500 })
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (userId) => {
    try {
      await ensureDatabaseInitialized()

      const { id } = await params

      const contrato = await prisma.contrato.findFirst({
        where: { id, userId },
      })

      if (!contrato) {
        return NextResponse.json(
          { error: 'Contrato não encontrado' },
          { status: 404 }
        )
      }

      await prisma.contrato.delete({
        where: { id },
      })

      return NextResponse.json({ ok: true })
    } catch (error) {
      console.error('[api/contratos] DELETE error:', error)
      return NextResponse.json(
        { error: 'Erro ao excluir contrato' },
        { status: 500 }
      )
    }
  })
}
