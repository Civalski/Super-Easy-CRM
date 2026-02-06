import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cliente = await prisma.cliente.findFirst({
      where: { id: params.id, userId },
      include: {
        _count: {
          select: {
            oportunidades: true,
            contatos: true,
          },
        },
        prospecto: true,
      },
    });

    if (cliente) {
      return NextResponse.json(cliente);
    }

    // Se não encontrar cliente, procura por prospecto
    const prospecto = await prisma.prospecto.findFirst({
      where: { id: params.id, userId },
    });

    // Se encontrar prospecto, retorna formatado como cliente "virtual"
    if (prospecto) {
      const enderecoCompleto = prospecto.logradouro
        ? `${prospecto.tipoLogradouro || ''} ${prospecto.logradouro}, ${prospecto.numero || ''} ${prospecto.complemento || ''}`.trim()
        : null;

      const virtualCliente = {
        id: prospecto.id,
        nome: prospecto.nomeFantasia || prospecto.razaoSocial,
        email: prospecto.email,
        telefone: prospecto.telefone1,
        empresa: prospecto.razaoSocial,
        endereco: enderecoCompleto,
        cidade: prospecto.municipio,
        estado: prospecto.uf,
        cep: prospecto.cep,
        createdAt: prospecto.createdAt,
        updatedAt: prospecto.updatedAt,
        _count: {
          oportunidades: 0,
          contatos: 0,
        },
        prospecto: prospecto, // Mantém os dados originais do prospecto
        isVirtual: true, // Flag para indicar que é um prospecto visualizado como cliente
      };

      return NextResponse.json(virtualCliente);
    }

    return NextResponse.json(
      { error: 'Cliente ou Prospecto não encontrado' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar cliente' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { nome, email, telefone, empresa, endereco, cidade, estado, cep } = body

    // Verifica se o cliente existe
    const clienteExistente = await prisma.cliente.findFirst({
      where: { id: params.id, userId },
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
          userId,
        },
      })
      if (emailEmUso) {
        return NextResponse.json(
          { error: 'Já existe um cliente com este email' },
          { status: 400 }
        )
      }
    }

    const updateData = {
      ...(nome !== undefined && { nome: nome.trim() }),
      ...(email !== undefined && { email: email && email.trim() !== '' ? email.trim() : null }),
      ...(telefone !== undefined && { telefone: telefone && telefone.trim() !== '' ? telefone.trim() : null }),
      ...(empresa !== undefined && { empresa: empresa && empresa.trim() !== '' ? empresa.trim() : null }),
      ...(endereco !== undefined && { endereco: endereco && endereco.trim() !== '' ? endereco.trim() : null }),
      ...(cidade !== undefined && { cidade: cidade && cidade.trim() !== '' ? cidade.trim() : null }),
      ...(estado !== undefined && { estado: estado && estado.trim() !== '' ? estado.trim().toUpperCase() : null }),
      ...(cep !== undefined && { cep: cep && cep.trim() !== '' ? cep.trim() : null }),
    }

    const updated = await prisma.cliente.updateMany({
      where: { id: params.id, userId },
      data: updateData,
    })

    if (updated.count === 0) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    const clienteAtualizado = await prisma.cliente.findFirst({
      where: { id: params.id, userId },
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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await prisma.cliente.deleteMany({
      where: { id: params.id, userId },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

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
