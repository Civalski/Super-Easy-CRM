import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { MockCliente } from '@/lib/mockData'

export async function GET() {
  try {
    // Simula delay de API
    await new Promise((resolve) => setTimeout(resolve, 200))
    
    const clientes = store.getClientes()
    const clientesOrdenados = clientes.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )

    return NextResponse.json(clientesOrdenados)
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar clientes' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nome, email, telefone, empresa, endereco, cidade, estado, cep } = body

    // Validação básica
    if (!nome || nome.trim() === '') {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    // Simula delay de API
    await new Promise((resolve) => setTimeout(resolve, 200))

    const clientes = store.getClientes()
    
    // Verifica se já existe cliente com o mesmo email (se fornecido)
    if (email && email.trim() !== '') {
      const clienteExistente = clientes.find(
        (c) => c.email && c.email.toLowerCase() === email.toLowerCase()
      )
      if (clienteExistente) {
        return NextResponse.json(
          { error: 'Já existe um cliente com este email' },
          { status: 400 }
        )
      }
    }

    const novoCliente: MockCliente = {
      id: String(clientes.length + 1),
      nome: nome.trim(),
      email: email && email.trim() !== '' ? email.trim() : null,
      telefone: telefone && telefone.trim() !== '' ? telefone.trim() : null,
      empresa: empresa && empresa.trim() !== '' ? empresa.trim() : null,
      endereco: endereco && endereco.trim() !== '' ? endereco.trim() : null,
      cidade: cidade && cidade.trim() !== '' ? cidade.trim() : null,
      estado: estado && estado.trim() !== '' ? estado.trim().toUpperCase() : null,
      cep: cep && cep.trim() !== '' ? cep.trim() : null,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: {
        oportunidades: 0,
        contatos: 0,
      },
    }

    store.addCliente(novoCliente)

    return NextResponse.json(novoCliente, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao criar cliente' },
      { status: 500 }
    )
  }
}

