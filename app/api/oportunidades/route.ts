import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensureDatabaseInitialized } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized()

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const ambienteId = searchParams.get('ambienteId')
    const where = {
      userId,
      ...(ambienteId ? { ambienteId } : {}),
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
        ambiente: {
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
      ambienteId,
      dataFechamento,
      motivoPerda,
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

    if (!ambienteId || ambienteId.trim() === '') {
      return NextResponse.json(
        { error: 'Ambiente é obrigatório' },
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

    // Verifica se o ambiente existe
    const ambiente = await prisma.ambiente.findFirst({
      where: { id: ambienteId, userId },
    })
    if (!ambiente) {
      return NextResponse.json(
        { error: 'Ambiente não encontrado' },
        { status: 404 }
      )
    }

    if (status === 'perdida' && (!motivoPerda || String(motivoPerda).trim() === '')) {
      return NextResponse.json(
        { error: 'Informe o motivo da perda' },
        { status: 400 }
      )
    }

    const novaOportunidade = await prisma.oportunidade.create({
      data: {
        userId,
        titulo: titulo.trim(),
        descricao: descricao && descricao.trim() !== '' ? descricao.trim() : null,
        valor: valor ? parseFloat(String(valor)) : null,
        status: status || 'prospeccao',
        probabilidade: probabilidade ? parseInt(String(probabilidade)) : 0,
        dataFechamento: dataFechamento ? new Date(dataFechamento) : null,
        motivoPerda: motivoPerda ? String(motivoPerda).trim() : null,
        clienteId,
        ambienteId,
      },
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

    return NextResponse.json(novaOportunidade, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar oportunidade:', error)
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cliente ou ambiente não encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao criar oportunidade' },
      { status: 500 }
    )
  }
}

