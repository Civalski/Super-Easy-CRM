import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, zodErrorResponse } from '@/lib/api/route-helpers'
import { prisma } from '@/lib/prisma'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe sua senha atual'),
    newPassword: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string().min(8, 'Confirme a nova senha'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas nao conferem',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'A nova senha deve ser diferente da senha atual',
    path: ['newPassword'],
  })

async function updateSupabasePasswordByEmail(email: string, password: string) {
  const supabaseAdmin = createSupabaseAdminClient()
  if (!supabaseAdmin) {
    return { ok: true as const }
  }

  const normalizedEmail = email.trim().toLowerCase()
  let page = 1

  while (page <= 10) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 200,
    })

    if (error) {
      return { ok: false as const, error: error.message }
    }

    const user = data.users.find(
      (item) => item.email?.trim().toLowerCase() === normalizedEmail
    )

    if (user) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { password }
      )

      if (updateError) {
        return { ok: false as const, error: updateError.message }
      }

      return { ok: true as const }
    }

    if (data.users.length < 200) {
      break
    }

    page += 1
  }

  return { ok: true as const }
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const body = await request.json()
      const parsed = changePasswordSchema.safeParse(body)

      if (!parsed.success) {
        return zodErrorResponse(parsed.error)
      }

      const { currentPassword, newPassword } = parsed.data

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          passwordHash: true,
        },
      })

      if (!user) {
        return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 })
      }

      const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash)
      if (!passwordMatches) {
        return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
      }

      if (user.email) {
        const syncResult = await updateSupabasePasswordByEmail(user.email, newPassword)
        if (!syncResult.ok) {
          console.error('Erro ao sincronizar senha no Supabase:', syncResult.error)
          return NextResponse.json(
            { error: 'Nao foi possivel sincronizar a senha. Tente novamente.' },
            { status: 502 }
          )
        }
      }

      const passwordHash = await bcrypt.hash(newPassword, 12)

      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Erro ao alterar senha do usuario autenticado:', error)
      return NextResponse.json(
        { error: 'Nao foi possivel alterar a senha.' },
        { status: 500 }
      )
    }
  })
}
