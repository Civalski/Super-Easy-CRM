import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/api/route-helpers'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Informe sua senha para excluir a conta.'),
})

/**
 * DELETE /api/users/me/account
 * Remove a conta do usuario autenticado.
 * As entidades relacionadas sao removidas por cascade no banco.
 */
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const body = await request.json().catch(() => ({}))
      const parsed = deleteAccountSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Informe sua senha para confirmar a exclusao.' }, { status: 400 })
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      })

      if (!user) {
        return NextResponse.json({ error: 'Usuario nao encontrado.' }, { status: 404 })
      }

      const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash)
      if (!passwordMatches) {
        return NextResponse.json({ error: 'Senha incorreta. Conta nao excluida.' }, { status: 400 })
      }

      await prisma.user.delete({
        where: { id: userId },
      })

      return NextResponse.json({
        success: true,
        message: 'Conta excluida com sucesso.',
      })
    } catch (error) {
      console.error('Erro ao excluir conta do usuario:', error)
      return NextResponse.json(
        { error: 'Erro ao excluir conta. Tente novamente.' },
        { status: 500 }
      )
    }
  })
}
