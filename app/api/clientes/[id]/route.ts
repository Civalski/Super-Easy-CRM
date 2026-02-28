import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

type CampoPersonalizado = {
  label: string
  value: string
}

const normalizeOptionalString = (
  value: unknown,
  options: { maxLength?: number; upperCase?: boolean } = {}
) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const normalized = options.upperCase ? trimmed.toUpperCase() : trimmed
  if (options.maxLength && normalized.length > options.maxLength) {
    return normalized.slice(0, options.maxLength)
  }
  return normalized
}

const sanitizeCamposPersonalizados = (value: unknown): CampoPersonalizado[] | null => {
  if (!Array.isArray(value)) return null

  const campos = value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const field = item as { label?: unknown; value?: unknown }
      const label = normalizeOptionalString(field.label, { maxLength: 80 })
      if (!label) return null
      const fieldValue = normalizeOptionalString(field.value, { maxLength: 500 }) ?? ''
      return { label, value: fieldValue }
    })
    .filter((item): item is CampoPersonalizado => item !== null)
    .slice(0, 20)

  return campos.length > 0 ? campos : null
}

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
    })

    if (cliente) {
      return NextResponse.json(cliente)
    }

    const prospecto = await prisma.prospecto.findFirst({
      where: { id: params.id, userId },
    })

    if (prospecto) {
      const enderecoCompleto = prospecto.logradouro
        ? `${prospecto.tipoLogradouro || ''} ${prospecto.logradouro}, ${prospecto.numero || ''} ${prospecto.complemento || ''}`.trim()
        : null

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
        cargo: null,
        documento: null,
        website: null,
        dataNascimento: null,
        observacoes: null,
        camposPersonalizados: null,
        createdAt: prospecto.createdAt,
        updatedAt: prospecto.updatedAt,
        _count: {
          oportunidades: 0,
          contatos: 0,
        },
        prospecto,
        isVirtual: true,
      }

      return NextResponse.json(virtualCliente)
    }

    return NextResponse.json(
      { error: 'Cliente ou Prospecto nao encontrado' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar cliente' },
      { status: 500 }
    )
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
    const {
      nome,
      email,
      telefone,
      empresa,
      endereco,
      cidade,
      estado,
      cep,
      cargo,
      documento,
      website,
      dataNascimento,
      observacoes,
      camposPersonalizados,
    } = body

    const clienteExistente = await prisma.cliente.findFirst({
      where: { id: params.id, userId },
    })

    if (!clienteExistente) {
      return NextResponse.json(
        { error: 'Cliente nao encontrado' },
        { status: 404 }
      )
    }

    const nomeNormalizado = nome !== undefined ? normalizeOptionalString(nome, { maxLength: 120 }) : undefined
    if (nome !== undefined && !nomeNormalizado) {
      return NextResponse.json(
        { error: 'Nome e obrigatorio' },
        { status: 400 }
      )
    }

    const emailNormalizado = email !== undefined
      ? normalizeOptionalString(email, { maxLength: 120 })
      : undefined

    if (emailNormalizado) {
      const emailEmUso = await prisma.cliente.findFirst({
        where: {
          email: emailNormalizado,
          id: { not: params.id },
          userId,
        },
      })
      if (emailEmUso) {
        return NextResponse.json(
          { error: 'Ja existe um cliente com este email' },
          { status: 400 }
        )
      }
    }

    const updateData = {
      ...(nome !== undefined && { nome: nomeNormalizado as string }),
      ...(email !== undefined && { email: emailNormalizado ?? null }),
      ...(telefone !== undefined && { telefone: normalizeOptionalString(telefone, { maxLength: 30 }) }),
      ...(empresa !== undefined && { empresa: normalizeOptionalString(empresa, { maxLength: 120 }) }),
      ...(endereco !== undefined && { endereco: normalizeOptionalString(endereco, { maxLength: 200 }) }),
      ...(cidade !== undefined && { cidade: normalizeOptionalString(cidade, { maxLength: 80 }) }),
      ...(estado !== undefined && { estado: normalizeOptionalString(estado, { maxLength: 2, upperCase: true }) }),
      ...(cep !== undefined && { cep: normalizeOptionalString(cep, { maxLength: 12 }) }),
      ...(cargo !== undefined && { cargo: normalizeOptionalString(cargo, { maxLength: 100 }) }),
      ...(documento !== undefined && { documento: normalizeOptionalString(documento, { maxLength: 30 }) }),
      ...(website !== undefined && { website: normalizeOptionalString(website, { maxLength: 200 }) }),
      ...(dataNascimento !== undefined && { dataNascimento: normalizeOptionalString(dataNascimento, { maxLength: 20 }) }),
      ...(observacoes !== undefined && { observacoes: normalizeOptionalString(observacoes, { maxLength: 2000 }) }),
      ...(camposPersonalizados !== undefined && {
        camposPersonalizados:
          sanitizeCamposPersonalizados(camposPersonalizados) ?? Prisma.DbNull,
      }),
    }

    const updated = await prisma.cliente.updateMany({
      where: { id: params.id, userId },
      data: updateData,
    })

    if (updated.count === 0) {
      return NextResponse.json(
        { error: 'Cliente nao encontrado' },
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
  } catch (error: unknown) {
    console.error('Erro ao atualizar cliente:', error)
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        { error: 'Cliente nao encontrado' },
        { status: 404 }
      )
    }
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ja existe um cliente com este email' },
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
        { error: 'Cliente nao encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Erro ao deletar cliente:', error)
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        { error: 'Cliente nao encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao deletar cliente' },
      { status: 500 }
    )
  }
}
