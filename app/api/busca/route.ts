import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim() || ''

    if (!query || query.length < 2) {
      return NextResponse.json({
        clientes: [],
        oportunidades: [],
      })
    }

    const queryLower = query.toLowerCase()

    // Busca clientes (SQLite não suporta mode: 'insensitive', então buscamos todos e filtramos)
    const todosClientes = await prisma.cliente.findMany({
      include: {
        _count: {
          select: {
            oportunidades: true,
            contatos: true,
          },
        },
      },
    })

    const clientes = todosClientes
      .filter((cliente) => {
        const nomeMatch = cliente.nome.toLowerCase().includes(queryLower)
        const emailMatch = cliente.email?.toLowerCase().includes(queryLower)
        const empresaMatch = cliente.empresa?.toLowerCase().includes(queryLower)
        const telefoneMatch = cliente.telefone?.includes(query)
        return nomeMatch || emailMatch || empresaMatch || telefoneMatch
      })
      .slice(0, 10)

    // Busca oportunidades
    const todasOportunidades = await prisma.oportunidade.findMany({
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

    const oportunidades = todasOportunidades
      .filter((oportunidade) => {
        const tituloMatch = oportunidade.titulo.toLowerCase().includes(queryLower)
        const descricaoMatch = oportunidade.descricao?.toLowerCase().includes(queryLower)
        const clienteMatch = oportunidade.cliente.nome.toLowerCase().includes(queryLower)
        return tituloMatch || descricaoMatch || clienteMatch
      })
      .slice(0, 10)

    return NextResponse.json({
      clientes,
      oportunidades,
    })
  } catch (error) {
    console.error('Erro ao buscar:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar' },
      { status: 500 }
    )
  }
}

