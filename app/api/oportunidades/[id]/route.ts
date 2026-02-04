import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const oportunidade = await prisma.oportunidade.findFirst({
      where: { id: params.id, userId },
      include: {
        cliente: {
          select: {
            nome: true,
          },
        },
        ambiente: {
          select: {
            nome: true,
          },
        },
      },
    })

    if (!oportunidade) {
      return NextResponse.json(
        { error: 'Oportunidade não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(oportunidade)
  } catch (error) {
    console.error('Erro ao buscar oportunidade:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar oportunidade' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      status,
      titulo,
      descricao,
      valor,
      probabilidade,
      clienteId,
      ambienteId,
      dataFechamento,
      motivoPerda,
    } = body

    const oportunidadeAtual = await prisma.oportunidade.findFirst({
      where: { id: params.id, userId },
      select: { status: true },
    })

    if (!oportunidadeAtual) {
      return NextResponse.json(
        { error: 'Oportunidade nao encontrada' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    const isFechadaOuPerdida = status === 'fechada' || status === 'perdida'
    const tinhaStatusFechadaOuPerdida =
      oportunidadeAtual.status === 'fechada' || oportunidadeAtual.status === 'perdida'
    const hasDataFechamento = dataFechamento !== undefined
    const precisaMotivoPerda = status === 'perdida' && !tinhaStatusFechadaOuPerdida

    if (precisaMotivoPerda && (!motivoPerda || String(motivoPerda).trim() === '')) {
      return NextResponse.json(
        { error: 'Informe o motivo da perda' },
        { status: 400 }
      )
    }

    if (status !== undefined) updateData.status = status
    if (titulo !== undefined) updateData.titulo = titulo.trim()
    if (descricao !== undefined) updateData.descricao = descricao && descricao.trim() !== '' ? descricao.trim() : null
    if (valor !== undefined) updateData.valor = valor ? parseFloat(String(valor)) : null
    if (probabilidade !== undefined) updateData.probabilidade = parseInt(String(probabilidade))
    if (clienteId !== undefined) updateData.clienteId = clienteId
    if (ambienteId !== undefined) updateData.ambienteId = ambienteId
    if (dataFechamento !== undefined) updateData.dataFechamento = dataFechamento ? new Date(dataFechamento) : null
    if (motivoPerda !== undefined) {
      updateData.motivoPerda = motivoPerda && String(motivoPerda).trim() !== ''
        ? String(motivoPerda).trim()
        : null
    }

    if (clienteId) {
      const cliente = await prisma.cliente.findFirst({
        where: { id: clienteId, userId },
        select: { id: true },
      })
      if (!cliente) {
        return NextResponse.json(
          { error: 'Cliente não encontrado' },
          { status: 404 }
        )
      }
    }

    if (ambienteId) {
      const ambiente = await prisma.ambiente.findFirst({
        where: { id: ambienteId, userId },
        select: { id: true },
      })
      if (!ambiente) {
        return NextResponse.json(
          { error: 'Ambiente não encontrado' },
          { status: 404 }
        )
      }
    }

    if (status !== undefined && isFechadaOuPerdida && !tinhaStatusFechadaOuPerdida) {
      updateData.statusAnterior = oportunidadeAtual.status
      if (!hasDataFechamento) {
        updateData.dataFechamento = new Date()
      }
    }

    const updated = await prisma.oportunidade.updateMany({
      where: { id: params.id, userId },
      data: updateData,
    })

    if (updated.count === 0) {
      return NextResponse.json(
        { error: 'Oportunidade não encontrada' },
        { status: 404 }
      )
    }

    const oportunidadeAtualizada = await prisma.oportunidade.findFirst({
      where: { id: params.id, userId },
      include: {
        cliente: {
          select: {
            nome: true,
          },
        },
        ambiente: {
          select: {
            nome: true,
          },
        },
      },
    })

    return NextResponse.json(oportunidadeAtualizada)
  } catch (error: any) {
    console.error('Erro ao atualizar oportunidade:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Oportunidade não encontrada' },
        { status: 404 }
      )
    }
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cliente ou ambiente não encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar oportunidade' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await prisma.oportunidade.deleteMany({
      where: { id: params.id, userId },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Oportunidade não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao deletar oportunidade:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Oportunidade não encontrada' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao deletar oportunidade' },
      { status: 500 }
    )
  }
}
