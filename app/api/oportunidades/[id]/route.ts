import { NextResponse } from 'next/server'
import { store } from '@/lib/store'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body

    // Simula delay de API
    await new Promise((resolve) => setTimeout(resolve, 200))

    const oportunidadeAtualizada = store.updateOportunidade(params.id, { status })
    
    if (!oportunidadeAtualizada) {
      return NextResponse.json(
        { error: 'Oportunidade não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(oportunidadeAtualizada)
  } catch (error) {
    console.error('Erro ao atualizar oportunidade:', error)
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
    // Simula delay de API
    await new Promise((resolve) => setTimeout(resolve, 200))

    const deletado = store.deleteOportunidade(params.id)
    
    if (!deletado) {
      return NextResponse.json(
        { error: 'Oportunidade não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar oportunidade:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar oportunidade' },
      { status: 500 }
    )
  }
}

