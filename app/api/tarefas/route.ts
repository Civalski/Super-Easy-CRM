import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { MockTarefa } from '@/lib/mockData'

export async function GET() {
  try {
    // Simula delay de API
    await new Promise((resolve) => setTimeout(resolve, 200))
    
    const tarefas = store.getTarefas()
    const tarefasOrdenadas = tarefas.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )

    return NextResponse.json(tarefasOrdenadas)
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar tarefas' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
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

    // Simula delay de API
    await new Promise((resolve) => setTimeout(resolve, 200))

    const tarefas = store.getTarefas()

    const novaTarefa: MockTarefa = {
      id: String(tarefas.length + 1),
      titulo: titulo.trim(),
      descricao: descricao && descricao.trim() !== '' ? descricao.trim() : null,
      status: status || 'pendente',
      prioridade: prioridade || 'media',
      dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
      clienteId: clienteId && clienteId.trim() !== '' ? clienteId : null,
      oportunidadeId:
        oportunidadeId && oportunidadeId.trim() !== '' ? oportunidadeId : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    store.addTarefa(novaTarefa)

    return NextResponse.json(novaTarefa, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar tarefa:', error)
    return NextResponse.json(
      { error: 'Erro ao criar tarefa' },
      { status: 500 }
    )
  }
}

