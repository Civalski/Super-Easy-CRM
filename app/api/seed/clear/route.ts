import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthIdentityFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function canRunDestructiveSeed(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return {
      allowed: false,
      reason: 'Operacao indisponivel em producao',
    }
  }

  const requiredToken = process.env.SEED_ADMIN_TOKEN?.trim()
  if (!requiredToken) {
    return { allowed: true as const }
  }

  const providedToken = request.headers.get('x-seed-token')?.trim()
  if (providedToken !== requiredToken) {
    return {
      allowed: false,
      reason: 'Token de seed invalido',
    }
  }

  return { allowed: true as const }
}

export async function DELETE(request: NextRequest) {
  try {
    const seedPermission = canRunDestructiveSeed(request)
    if (!seedPermission.allowed) {
      return NextResponse.json(
        { error: seedPermission.reason },
        { status: 403 }
      )
    }

    const { userId, role } = await getAuthIdentityFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resumo = await prisma.$transaction(async (tx) => {
      const goalIds = await tx.goal.findMany({
        where: { userId },
        select: { id: true },
      })
      const goalIdList = goalIds.map((goal) => goal.id)

      const goalSnapshots = goalIdList.length
        ? await tx.goalSnapshot.deleteMany({ where: { goalId: { in: goalIdList } } })
        : { count: 0 }

      const tarefas = await tx.tarefa.deleteMany({ where: { userId } })
      const oportunidades = await tx.oportunidade.deleteMany({ where: { userId } })
      const contatos = await tx.contato.deleteMany({ where: { userId } })
      const prospectos = await tx.prospecto.deleteMany({ where: { userId } })
      const goals = await tx.goal.deleteMany({ where: { userId } })
      const motivosPerda = await tx.motivoPerda.deleteMany({ where: { userId } })
      const clientes = await tx.cliente.deleteMany({ where: { userId } })

      return {
        tarefas: tarefas.count,
        oportunidades: oportunidades.count,
        contatos: contatos.count,
        prospectos: prospectos.count,
        metas: goals.count,
        metasSnapshots: goalSnapshots.count,
        motivosPerda: motivosPerda.count,
        clientes: clientes.count,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Dados excluidos com sucesso!',
      resumo,
    })
  } catch (error) {
    console.error('Erro ao excluir dados:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao excluir dados',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
