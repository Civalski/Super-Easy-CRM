import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { MockAmbiente } from '@/lib/mockData'

export async function GET() {
  try {
    // Simula delay de API
    await new Promise((resolve) => setTimeout(resolve, 200))
    
    const ambientes = store.getAmbientes()
    const ambientesOrdenados = ambientes.sort(
      (a, b) => a.nome.localeCompare(b.nome)
    )

    return NextResponse.json(ambientesOrdenados)
  } catch (error) {
    console.error('Erro ao buscar ambientes:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar ambientes' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nome, descricao } = body

    // Validação básica
    if (!nome || nome.trim() === '') {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    // Simula delay de API
    await new Promise((resolve) => setTimeout(resolve, 200))

    const ambientes = store.getAmbientes()
    const novoAmbiente: MockAmbiente = {
      id: String(ambientes.length + 1),
      nome: nome.trim(),
      descricao: descricao && descricao.trim() !== '' ? descricao.trim() : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    store.addAmbiente(novoAmbiente)

    return NextResponse.json(novoAmbiente, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar ambiente:', error)
    return NextResponse.json(
      { error: 'Erro ao criar ambiente' },
      { status: 500 }
    )
  }
}

