import { NextResponse } from 'next/server'
import { store } from '@/lib/store'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ambiente = store.getAmbienteById(params.id)
    
    if (!ambiente) {
      return NextResponse.json(
        { error: 'Ambiente não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(ambiente)
  } catch (error) {
    console.error('Erro ao buscar ambiente:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar ambiente' },
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
    const { nome, descricao } = body

    const updates: { nome?: string; descricao?: string | null } = {}
    
    if (nome !== undefined) {
      if (!nome || nome.trim() === '') {
        return NextResponse.json(
          { error: 'Nome não pode ser vazio' },
          { status: 400 }
        )
      }
      updates.nome = nome.trim()
    }

    if (descricao !== undefined) {
      updates.descricao = descricao && descricao.trim() !== '' ? descricao.trim() : null
    }

    const ambienteAtualizado = store.updateAmbiente(params.id, updates)

    if (!ambienteAtualizado) {
      return NextResponse.json(
        { error: 'Ambiente não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(ambienteAtualizado)
  } catch (error) {
    console.error('Erro ao atualizar ambiente:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar ambiente' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sucesso = store.deleteAmbiente(params.id)

    if (!sucesso) {
      return NextResponse.json(
        { error: 'Ambiente não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Ambiente deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar ambiente:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar ambiente' },
      { status: 500 }
    )
  }
}

