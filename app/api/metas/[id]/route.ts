import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GoalMetricType, GoalPeriodType } from '@prisma/client'
import {
  computeGoalProgress,
  getUserId,
  parseDateInput,
  parseWeekDays,
  recordGoalSnapshot,
} from '../helpers'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const goal = await prisma.goal.findFirst({
      where: { id: params.id, userId },
    })

    if (!goal) {
      return NextResponse.json({ error: 'Meta nao encontrada' }, { status: 404 })
    }

    const progressResult = await computeGoalProgress({
      metricType: goal.metricType,
      startDate: goal.startDate,
      endDate: goal.endDate,
      weekDays: goal.weekDays ?? [],
      periodType: goal.periodType,
      userId,
    })
    const progress = goal.target > 0 ? Math.round((progressResult.current / goal.target) * 100) : 0

    await recordGoalSnapshot({
      goalId: goal.id,
      target: goal.target,
      current: progressResult.current,
      progress: Math.min(progress, 100),
      periodStart: progressResult.periodStart,
      periodEnd: progressResult.periodEnd,
      active: progressResult.active,
    })

    return NextResponse.json({
      ...goal,
      current: progressResult.current,
      progress: Math.min(progress, 100),
      periodStart: progressResult.periodStart,
      periodEnd: progressResult.periodEnd,
      active: progressResult.active,
    })
  } catch (error) {
    console.error('Erro ao buscar meta:', error)
    return NextResponse.json({ error: 'Erro ao buscar meta' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.goal.findFirst({
      where: { id: params.id, userId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Meta nao encontrada' }, { status: 404 })
    }

    const body = await req.json()
    const updateData: {
      title?: string | null
      metricType?: GoalMetricType
      periodType?: GoalPeriodType
      target?: number
      startDate?: Date | null
      endDate?: Date | null
      weekDays?: number[]
    } = {}

    if (body.title !== undefined) {
      if (body.title === null || body.title === '') {
        updateData.title = null
      } else {
        const title = typeof body.title === 'string' ? body.title.trim() : ''
        updateData.title = title || null
      }
    }

    if (body.metricType !== undefined) {
      const metricType = body.metricType as GoalMetricType
      if (!Object.values(GoalMetricType).includes(metricType)) {
        return NextResponse.json({ error: 'Tipo de meta invalido' }, { status: 400 })
      }
      updateData.metricType = metricType
    }

    if (body.periodType !== undefined) {
      const periodType = body.periodType as GoalPeriodType
      if (!Object.values(GoalPeriodType).includes(periodType)) {
        return NextResponse.json({ error: 'Periodo invalido' }, { status: 400 })
      }
      updateData.periodType = periodType
    }

    if (body.target !== undefined) {
      const target = Number(body.target)
      if (!Number.isFinite(target) || target <= 0 || !Number.isInteger(target)) {
        return NextResponse.json({ error: 'Meta deve ser um numero inteiro maior que zero' }, { status: 400 })
      }
      updateData.target = target
    }

    if (body.startDate !== undefined) {
      if (body.startDate === null || body.startDate === '') {
        updateData.startDate = null
      } else {
        const startDate = parseDateInput(body.startDate, false)
        if (!startDate) {
          return NextResponse.json({ error: 'Data inicial invalida' }, { status: 400 })
        }
        updateData.startDate = startDate
      }
    }

    if (body.endDate !== undefined) {
      if (body.endDate === null || body.endDate === '') {
        updateData.endDate = null
      } else {
        const endDate = parseDateInput(body.endDate, true)
        if (!endDate) {
          return NextResponse.json({ error: 'Data final invalida' }, { status: 400 })
        }
        updateData.endDate = endDate
      }
    }

    if (body.weekDays !== undefined) {
      updateData.weekDays = parseWeekDays(body.weekDays)
    }

    const finalPeriodType = updateData.periodType ?? existing.periodType
    if (finalPeriodType !== GoalPeriodType.WEEKLY) {
      updateData.weekDays = []
    }

    const finalStart = updateData.startDate !== undefined ? updateData.startDate : existing.startDate
    const finalEnd = updateData.endDate !== undefined ? updateData.endDate : existing.endDate

    if (finalPeriodType === GoalPeriodType.CUSTOM) {
      if (!finalStart || !finalEnd) {
        return NextResponse.json({ error: 'Datas invalidas' }, { status: 400 })
      }
    } else if ((finalStart && !finalEnd) || (!finalStart && finalEnd)) {
      return NextResponse.json(
        { error: 'Informe inicio e fim ou deixe ambos vazios' },
        { status: 400 }
      )
    }

    if (finalStart && finalEnd && finalStart > finalEnd) {
      return NextResponse.json(
        { error: 'Data inicial deve ser menor ou igual a final' },
        { status: 400 }
      )
    }

    const updated = await prisma.goal.update({
      where: { id: existing.id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erro ao atualizar meta:', error)
    return NextResponse.json({ error: 'Erro ao atualizar meta' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await prisma.goal.deleteMany({
      where: { id: params.id, userId },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Meta nao encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar meta:', error)
    return NextResponse.json({ error: 'Erro ao deletar meta' }, { status: 500 })
  }
}
