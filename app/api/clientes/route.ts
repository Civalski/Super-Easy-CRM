import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensureDatabaseInitialized } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Garantir que o banco está inicializado
    await ensureDatabaseInitialized()

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const clientes = await prisma.cliente.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            oportunidades: true,
            contatos: true,
          },
        },
        prospecto: {
          select: {
            cnaePrincipalDesc: true,
            capitalSocial: true,
          },
        },
      },
    })

    return NextResponse.json(clientes)
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar clientes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Garantir que o banco está inicializado
    await ensureDatabaseInitialized()

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { nome, email, telefone, empresa, endereco, cidade, estado, cep } = body

    // Validação básica
    if (!nome || nome.trim() === '') {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    // Verifica se já existe cliente com o mesmo email (se fornecido)
    if (email && email.trim() !== '') {
      const clienteExistente = await prisma.cliente.findFirst({
        where: { email: email.trim(), userId },
      })
      if (clienteExistente) {
        return NextResponse.json(
          { error: 'Já existe um cliente com este email' },
          { status: 400 }
        )
      }
    }

    const novoCliente = await prisma.cliente.create({
      data: {
        userId,
        nome: nome.trim(),
        email: email && email.trim() !== '' ? email.trim() : null,
        telefone: telefone && telefone.trim() !== '' ? telefone.trim() : null,
        empresa: empresa && empresa.trim() !== '' ? empresa.trim() : null,
        endereco: endereco && endereco.trim() !== '' ? endereco.trim() : null,
        cidade: cidade && cidade.trim() !== '' ? cidade.trim() : null,
        estado: estado && estado.trim() !== '' ? estado.trim().toUpperCase() : null,
        cep: cep && cep.trim() !== '' ? cep.trim() : null,
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

    return NextResponse.json(novoCliente, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar cliente:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Já existe um cliente com este email' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao criar cliente' },
      { status: 500 }
    )
  }
}

