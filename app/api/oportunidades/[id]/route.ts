import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

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
      dataFechamento,
      motivoPerda,
    } = body

    const oportunidadeAtual = await prisma.oportunidade.findFirst({
      where: { id: params.id, userId },
      select: { status: true, valor: true },
    })

    if (!oportunidadeAtual) {
      return NextResponse.json(
        { error: 'Oportunidade nao encontrada' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    let statusAutoAtualizado = false
    const effectiveStatus = status ?? oportunidadeAtual.status
    const isFechadaOuPerdida = effectiveStatus === 'fechada' || effectiveStatus === 'perdida'
    const tinhaStatusFechadaOuPerdida =
      oportunidadeAtual.status === 'fechada' || oportunidadeAtual.status === 'perdida'
    const hasDataFechamento = dataFechamento !== undefined
    const precisaMotivoPerda = effectiveStatus === 'perdida' && !tinhaStatusFechadaOuPerdida

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

    // Auto-promote: if editing valor on a 'proposta', promote to 'negociacao'
    // Check that the user is NOT explicitly changing the status (status is same as current or not provided)
    const statusNotExplicitlyChanged = status === undefined || status === oportunidadeAtual.status
    if (
      valor !== undefined &&
      oportunidadeAtual.status === 'proposta' &&
      statusNotExplicitlyChanged
    ) {
      const newValor = valor ? parseFloat(String(valor)) : null
      const currentValor = oportunidadeAtual.valor

      // Compare using fixed precision to avoid floating point issues
      const newStr = newValor !== null ? newValor.toFixed(2) : 'null'
      const curStr = currentValor !== null ? Number(currentValor).toFixed(2) : 'null'

      if (newStr !== curStr) {
        updateData.status = 'negociacao'
        statusAutoAtualizado = true
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

    // ===== AUTO-CONVERSÃO DE PROSPECTO QUANDO VENDA É FECHADA =====
    // Se a oportunidade foi fechada (virou venda), verificar se o cliente
    // vinculado originou-se de um prospecto ainda não convertido e convertê-lo.
    const novoStatus = updateData.status ?? effectiveStatus
    const eraAberta = !tinhaStatusFechadaOuPerdida
    let prospectoConvertidoAutomaticamente = false

    if (novoStatus === 'fechada' && eraAberta) {
      // Buscar a oportunidade atualizada com clienteId
      const oportunidadeComCliente = await prisma.oportunidade.findFirst({
        where: { id: params.id, userId },
        select: { clienteId: true },
      })

      if (oportunidadeComCliente?.clienteId) {
        // Verificar se esse cliente possui um prospecto vinculado que ainda não foi convertido
        const prospectoVinculado = await prisma.prospecto.findFirst({
          where: {
            clienteId: oportunidadeComCliente.clienteId,
            userId,
            status: { not: 'convertido' },
          },
          select: { id: true },
        })

        if (prospectoVinculado) {
          await prisma.prospecto.update({
            where: { id: prospectoVinculado.id },
            data: { status: 'convertido' },
          })
          prospectoConvertidoAutomaticamente = true
        }
      }
    }

    const oportunidadeAtualizada = await prisma.oportunidade.findFirst({
      where: { id: params.id, userId },
      include: {
        cliente: {
          select: {
            nome: true,
          },
        },

      },
    })

    return NextResponse.json({ ...oportunidadeAtualizada, statusAutoAtualizado, prospectoConvertidoAutomaticamente })
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
        { error: 'Cliente não encontrado' },
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
