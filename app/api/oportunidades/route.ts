import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { MockOportunidade } from '@/lib/mockData'

export async function GET() {
  try {
    // Simula delay de API
    await new Promise((resolve) => setTimeout(resolve, 200))
    
    const oportunidades = store.getOportunidades()
    const oportunidadesOrdenadas = oportunidades.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )

    return NextResponse.json(oportunidadesOrdenadas)
  } catch (error) {
    console.error('Erro ao buscar oportunidades:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar oportunidades' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { titulo, descricao, valor, status, probabilidade, clienteId, dataFechamento } = body

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

    // Simula delay de API
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Busca o cliente para obter o nome
    const cliente = store.getClienteById(clienteId)
    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    const oportunidades = store.getOportunidades()
    const novaOportunidade: MockOportunidade = {
      id: String(oportunidades.length + 1),
      titulo: titulo.trim(),
      descricao: descricao && descricao.trim() !== '' ? descricao.trim() : null,
      valor: valor ? parseFloat(valor) : null,
      status: status || 'prospeccao',
      probabilidade: probabilidade || 0,
      dataFechamento: dataFechamento ? new Date(dataFechamento) : null,
      clienteId,
      cliente: {
        nome: cliente.nome,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    store.addOportunidade(novaOportunidade)

    return NextResponse.json(novaOportunidade, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar oportunidade:', error)
    return NextResponse.json(
      { error: 'Erro ao criar oportunidade' },
      { status: 500 }
    )
  }
}

