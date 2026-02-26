import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensureDatabaseInitialized } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized()

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') // ex: "proposta,negociacao" ou "fechada,perdida"

    const where: any = { userId }
    if (statusFilter) {
      const statuses = statusFilter.split(',').map(s => s.trim())
      where.status = { in: statuses }
    }

    const oportunidades = await prisma.oportunidade.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        cliente: {
          select: {
            nome: true,
          },
        },

      },
    })

    return NextResponse.json(oportunidades)
  } catch (error) {
    console.error('Erro ao buscar oportunidades:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar oportunidades' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized()

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      titulo,
      descricao,
      valor,
      status,
      probabilidade,
      clienteId,
      dataFechamento,
      motivoPerda,
      prospectoId,
    } = body

    // Validação básica
    if (!titulo || titulo.trim() === '') {
      return NextResponse.json(
        { error: 'Título é obrigatório' },
        { status: 400 }
      )
    }

    if (!clienteId || clienteId.trim() === '') {
      return NextResponse.json(
        { error: 'Cliente é obrigatório' },
        { status: 400 }
      )
    }

    // Verifica se o cliente existe
    const cliente = await prisma.cliente.findFirst({
      where: { id: clienteId, userId },
    })
    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }



    if (status === 'perdida' && (!motivoPerda || String(motivoPerda).trim() === '')) {
      return NextResponse.json(
        { error: 'Informe o motivo da perda' },
        { status: 400 }
      )
    }

    // ===== LÓGICA DE AUTO-CLASSIFICAÇÃO =====
    let finalStatus = status || 'proposta'
    let statusAutoAtualizado = false

    // 1. Verificar se o cliente já tem oportunidades com status 'proposta'
    const oportunidadesExistentes = await prisma.oportunidade.findMany({
      where: {
        clienteId,
        userId,
        status: 'proposta',
      },
    })

    if (oportunidadesExistentes.length > 0) {
      // Se já tem proposta, a nova vai como 'negociação'
      finalStatus = 'negociacao'
      statusAutoAtualizado = true
    }

    // 2. Atualizar oportunidades existentes em prospecção/qualificação para proposta
    const oportunidadesParaAtualizar = await prisma.oportunidade.findMany({
      where: {
        clienteId,
        userId,
        status: { in: ['prospeccao', 'qualificacao'] },
      },
    })

    if (oportunidadesParaAtualizar.length > 0) {
      await prisma.oportunidade.updateMany({
        where: {
          clienteId,
          userId,
          status: { in: ['prospeccao', 'qualificacao'] },
        },
        data: {
          status: 'proposta',
        },
      })
    }

    // Se o status não foi sobrescrito para negociação, manter como proposta
    if (!statusAutoAtualizado && (status === 'proposta' || !status)) {
      finalStatus = 'proposta'
    }

    const novaOportunidade = await prisma.oportunidade.create({
      data: {
        userId,
        titulo: titulo.trim(),
        descricao: descricao && descricao.trim() !== '' ? descricao.trim() : null,
        valor: valor ? parseFloat(String(valor)) : null,
        status: finalStatus,
        probabilidade: probabilidade ? parseInt(String(probabilidade)) : 0,
        dataFechamento: dataFechamento ? new Date(dataFechamento) : null,
        motivoPerda: motivoPerda ? String(motivoPerda).trim() : null,
        clienteId,

      },
      include: {
        cliente: {
          select: {
            nome: true,
          },
        },

      },
    })

    return NextResponse.json(
      { ...novaOportunidade, statusAutoAtualizado },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Erro ao criar oportunidade:', error)
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao criar oportunidade' },
      { status: 500 }
    )
  }
}
