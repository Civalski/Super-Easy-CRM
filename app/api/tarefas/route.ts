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
    
    const tarefas = await prisma.tarefa.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(tarefas)
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar tarefas' },
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
      status,
      prioridade,
      dataVencimento,
      clienteId,
      oportunidadeId,
    } = body

    // Validação básica
    if (!titulo || titulo.trim() === '') {
      return NextResponse.json(
        { error: 'Título é obrigatório' },
        { status: 400 }
      )
    }

    // Valida se cliente existe (se fornecido)
    if (clienteId && clienteId.trim() !== '') {
      const cliente = await prisma.cliente.findFirst({
        where: { id: clienteId, userId },
      })
      if (!cliente) {
        return NextResponse.json(
          { error: 'Cliente não encontrado' },
          { status: 404 }
        )
      }
    }

    // Valida se oportunidade existe (se fornecido)
    if (oportunidadeId && oportunidadeId.trim() !== '') {
      const oportunidade = await prisma.oportunidade.findFirst({
        where: { id: oportunidadeId, userId },
      })
      if (!oportunidade) {
        return NextResponse.json(
          { error: 'Oportunidade não encontrada' },
          { status: 404 }
        )
      }
    }

    const novaTarefa = await prisma.tarefa.create({
      data: {
        userId,
        titulo: titulo.trim(),
        descricao: descricao && descricao.trim() !== '' ? descricao.trim() : null,
        status: status || 'pendente',
        prioridade: prioridade || 'media',
        dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
        clienteId: clienteId && clienteId.trim() !== '' ? clienteId : null,
        oportunidadeId: oportunidadeId && oportunidadeId.trim() !== '' ? oportunidadeId : null,
      },
    })

    return NextResponse.json(novaTarefa, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar tarefa:', error)
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cliente ou oportunidade não encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao criar tarefa' },
      { status: 500 }
    )
  }
}

