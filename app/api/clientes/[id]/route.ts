import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            oportunidades: true,
            contatos: true,
          },
        },
      },
    })

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(cliente)
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar cliente' },
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
    const { nome, email, telefone, empresa, endereco, cidade, estado, cep } = body

    // Verifica se o cliente existe
    const clienteExistente = await prisma.cliente.findUnique({
      where: { id: params.id },
    })

    if (!clienteExistente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    // Verifica se o email já está em uso por outro cliente
    if (email && email.trim() !== '') {
      const emailEmUso = await prisma.cliente.findFirst({
        where: {
          email: email.trim(),
          id: { not: params.id },
        },
      })
      if (emailEmUso) {
        return NextResponse.json(
          { error: 'Já existe um cliente com este email' },
          { status: 400 }
        )
      }
    }

    const clienteAtualizado = await prisma.cliente.update({
      where: { id: params.id },
      data: {
        ...(nome !== undefined && { nome: nome.trim() }),
        ...(email !== undefined && { email: email && email.trim() !== '' ? email.trim() : null }),
        ...(telefone !== undefined && { telefone: telefone && telefone.trim() !== '' ? telefone.trim() : null }),
        ...(empresa !== undefined && { empresa: empresa && empresa.trim() !== '' ? empresa.trim() : null }),
        ...(endereco !== undefined && { endereco: endereco && endereco.trim() !== '' ? endereco.trim() : null }),
        ...(cidade !== undefined && { cidade: cidade && cidade.trim() !== '' ? cidade.trim() : null }),
        ...(estado !== undefined && { estado: estado && estado.trim() !== '' ? estado.trim().toUpperCase() : null }),
        ...(cep !== undefined && { cep: cep && cep.trim() !== '' ? cep.trim() : null }),
      },
      include: {
        _count: {
          select: {
            oportunidades: true,
            contatos: true,
          },
        },
      },
    })

    return NextResponse.json(clienteAtualizado)
  } catch (error: any) {
    console.error('Erro ao atualizar cliente:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Já existe um cliente com este email' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar cliente' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.cliente.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao deletar cliente:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao deletar cliente' },
      { status: 500 }
    )
  }
}

