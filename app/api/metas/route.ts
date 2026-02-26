import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GoalMetricType, GoalPeriodType } from '@prisma/client'
import {
  computeGoalProgress,
  getUserId,
  parseDateInput,
  parseWeekDays,
  recordGoalSnapshot,
} from './helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    const goalsWithProgress = await Promise.all(
      goals.map(async (goal) => {
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

        return {
          ...goal,
          current: progressResult.current,
          progress: Math.min(progress, 100),
          periodStart: progressResult.periodStart,
          periodEnd: progressResult.periodEnd,
          active: progressResult.active,
        }
      })
    )

    return NextResponse.json(goalsWithProgress)
  } catch (error) {
    console.error('Erro ao buscar metas:', error)
    return NextResponse.json({ error: 'Erro ao buscar metas' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const rawTitle = typeof body.title === 'string' ? body.title.trim() : ''
    const title = rawTitle ? rawTitle : null
    const target = Number(body.target)
    const metricType = body.metricType as GoalMetricType
    const periodType = body.periodType as GoalPeriodType
    const startDate = parseDateInput(body.startDate, false)
    const endDate = parseDateInput(body.endDate, true)
    const rawWeekDays = parseWeekDays(body.weekDays)

    if (!Object.values(GoalMetricType).includes(metricType)) {
      return NextResponse.json({ error: 'Tipo de meta invalido' }, { status: 400 })
    }

    if (!Object.values(GoalPeriodType).includes(periodType)) {
      return NextResponse.json({ error: 'Periodo invalido' }, { status: 400 })
    }

    const weekDays = periodType === GoalPeriodType.WEEKLY ? rawWeekDays : []

    if (!Number.isFinite(target) || target <= 0 || !Number.isInteger(target)) {
      return NextResponse.json({ error: 'Meta deve ser um numero inteiro maior que zero' }, { status: 400 })
    }

    const hasAnyDate = Boolean(startDate) || Boolean(endDate)
    if (periodType === GoalPeriodType.CUSTOM) {
      if (!startDate || !endDate) {
        return NextResponse.json({ error: 'Datas invalidas' }, { status: 400 })
      }
    } else if (hasAnyDate && (!startDate || !endDate)) {
      return NextResponse.json({ error: 'Informe inicio e fim ou deixe ambos vazios' }, { status: 400 })
    }

    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        { error: 'Data inicial deve ser menor ou igual a final' },
        { status: 400 }
      )
    }

    const finalStartDate = periodType === GoalPeriodType.CUSTOM || hasAnyDate ? startDate : null
    const finalEndDate = periodType === GoalPeriodType.CUSTOM || hasAnyDate ? endDate : null

    const goal = await prisma.goal.create({
      data: {
        userId,
        title,
        metricType,
        periodType,
        target,
        startDate: finalStartDate,
        endDate: finalEndDate,
        weekDays,
      },
    })

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar meta:', error)
    return NextResponse.json({ error: 'Erro ao criar meta' }, { status: 500 })
  }
}
