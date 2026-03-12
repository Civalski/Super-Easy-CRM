import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'

export const dynamic = 'force-dynamic'

async function ensurePremiumAccess(userId: string) {
  void userId
  return null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (userId) => {
    try {
      const premiumDenied = await ensurePremiumAccess(userId)
      if (premiumDenied) return premiumDenied

      const { id } = await params
      const fornecedor = await prisma.fornecedor.findFirst({
        where: { id, userId },
      })
      if (!fornecedor) {
        return NextResponse.json({ error: 'Fornecedor nao encontrado' }, { status: 404 })
      }
      return NextResponse.json(fornecedor)
    } catch (error) {
      console.error('Erro ao buscar fornecedor:', error)
      return NextResponse.json({ error: 'Erro ao buscar fornecedor' }, { status: 500 })
    }
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (userId) => {
    try {
      const premiumDenied = await ensurePremiumAccess(userId)
      if (premiumDenied) return premiumDenied

      const { id } = await params
      const fornecedor = await prisma.fornecedor.findFirst({
        where: { id, userId },
      })
      if (!fornecedor) {
        return NextResponse.json({ error: 'Fornecedor nao encontrado' }, { status: 404 })
      }

      const body = await request.json().catch(() => null)
      if (!body || typeof body !== 'object') {
        return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
      }

      const nome = typeof body.nome === 'string' ? body.nome.trim() : fornecedor.nome
      if (!nome) {
        return NextResponse.json({ error: 'Nome e obrigatorio' }, { status: 400 })
      }

      const updated = await prisma.fornecedor.update({
        where: { id },
        data: {
          nome,
          email: typeof body.email === 'string' ? body.email.trim() || null : fornecedor.email,
          telefone: typeof body.telefone === 'string' ? body.telefone.trim() || null : fornecedor.telefone,
          documento: typeof body.documento === 'string' ? body.documento.trim() || null : fornecedor.documento,
          empresa: typeof body.empresa === 'string' ? body.empresa.trim() || null : fornecedor.empresa,
          endereco: typeof body.endereco === 'string' ? body.endereco.trim() || null : fornecedor.endereco,
          cidade: typeof body.cidade === 'string' ? body.cidade.trim() || null : fornecedor.cidade,
          estado: typeof body.estado === 'string' ? body.estado.trim() || null : fornecedor.estado,
          cep: typeof body.cep === 'string' ? body.cep.trim() || null : fornecedor.cep,
          observacoes: typeof body.observacoes === 'string' ? body.observacoes.trim() || null : fornecedor.observacoes,
        },
      })
      return NextResponse.json(updated)
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error)
      return NextResponse.json({ error: 'Erro ao atualizar fornecedor' }, { status: 500 })
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (userId) => {
    try {
      const premiumDenied = await ensurePremiumAccess(userId)
      if (premiumDenied) return premiumDenied

      const { id } = await params
      const fornecedor = await prisma.fornecedor.findFirst({
        where: { id, userId },
      })
      if (!fornecedor) {
        return NextResponse.json({ error: 'Fornecedor nao encontrado' }, { status: 404 })
      }

      await prisma.fornecedor.delete({ where: { id } })
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error)
      return NextResponse.json({ error: 'Erro ao excluir fornecedor' }, { status: 500 })
    }
  })
}
