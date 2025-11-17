import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const oportunidade = await prisma.oportunidade.findUnique({
      where: { id: params.id },
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
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, titulo, descricao, valor, probabilidade, clienteId, ambienteId, dataFechamento } = body

    const updateData: any = {}
    
    if (status !== undefined) updateData.status = status
    if (titulo !== undefined) updateData.titulo = titulo.trim()
    if (descricao !== undefined) updateData.descricao = descricao && descricao.trim() !== '' ? descricao.trim() : null
    if (valor !== undefined) updateData.valor = valor ? parseFloat(String(valor)) : null
    if (probabilidade !== undefined) updateData.probabilidade = parseInt(String(probabilidade))
    if (clienteId !== undefined) updateData.clienteId = clienteId
    if (ambienteId !== undefined) updateData.ambienteId = ambienteId
    if (dataFechamento !== undefined) updateData.dataFechamento = dataFechamento ? new Date(dataFechamento) : null

    const oportunidadeAtualizada = await prisma.oportunidade.update({
      where: { id: params.id },
      data: updateData,
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
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.oportunidade.delete({
      where: { id: params.id },
    })

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

