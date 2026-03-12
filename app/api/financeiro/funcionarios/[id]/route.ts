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
      const funcionario = await prisma.funcionario.findFirst({
        where: { id, userId },
      })
      if (!funcionario) {
        return NextResponse.json({ error: 'Funcionario nao encontrado' }, { status: 404 })
      }
      return NextResponse.json(funcionario)
    } catch (error) {
      console.error('Erro ao buscar funcionario:', error)
      return NextResponse.json({ error: 'Erro ao buscar funcionario' }, { status: 500 })
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
      const funcionario = await prisma.funcionario.findFirst({
        where: { id, userId },
      })
      if (!funcionario) {
        return NextResponse.json({ error: 'Funcionario nao encontrado' }, { status: 404 })
      }

      const body = await request.json().catch(() => null)
      if (!body || typeof body !== 'object') {
        return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
      }

      const nome = typeof body.nome === 'string' ? body.nome.trim() : funcionario.nome
      if (!nome) {
        return NextResponse.json({ error: 'Nome e obrigatorio' }, { status: 400 })
      }

      const updated = await prisma.funcionario.update({
        where: { id },
        data: {
          nome,
          email: typeof body.email === 'string' ? body.email.trim() || null : funcionario.email,
          telefone: typeof body.telefone === 'string' ? body.telefone.trim() || null : funcionario.telefone,
          documento: typeof body.documento === 'string' ? body.documento.trim() || null : funcionario.documento,
          cargo: typeof body.cargo === 'string' ? body.cargo.trim() || null : funcionario.cargo,
          departamento: typeof body.departamento === 'string' ? body.departamento.trim() || null : funcionario.departamento,
          observacoes: typeof body.observacoes === 'string' ? body.observacoes.trim() || null : funcionario.observacoes,
        },
      })
      return NextResponse.json(updated)
    } catch (error) {
      console.error('Erro ao atualizar funcionario:', error)
      return NextResponse.json({ error: 'Erro ao atualizar funcionario' }, { status: 500 })
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
      const funcionario = await prisma.funcionario.findFirst({
        where: { id, userId },
      })
      if (!funcionario) {
        return NextResponse.json({ error: 'Funcionario nao encontrado' }, { status: 404 })
      }

      await prisma.funcionario.delete({ where: { id } })
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Erro ao excluir funcionario:', error)
      return NextResponse.json({ error: 'Erro ao excluir funcionario' }, { status: 500 })
    }
  })
}
