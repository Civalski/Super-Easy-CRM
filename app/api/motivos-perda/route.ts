import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/app/api/metas/helpers'

export const dynamic = 'force-dynamic'

const DEFAULT_MOTIVOS = [
  'Prazo de entrega',
  'Preco',
  'Forma de pagamento',
  'Concorrente',
  'Desistencia',
]

const MAX_CUSTOM = 3

const normalize = (value: string) => value.trim()

const uniqueMotivos = (items: string[]) => {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customMotivos = await prisma.motivoPerda.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { nome: true },
    })

    const customList = customMotivos.map((item) => item.nome)
    const motivos = uniqueMotivos([...DEFAULT_MOTIVOS, ...customList])

    return NextResponse.json({
      motivos,
      customCount: customList.length,
      maxCustom: MAX_CUSTOM,
    })
  } catch (error) {
    console.error('Erro ao buscar motivos de perda:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar motivos de perda' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const nomeRaw = typeof body.nome === 'string' ? normalize(body.nome) : ''
    if (!nomeRaw) {
      return NextResponse.json({ error: 'Informe um motivo valido' }, { status: 400 })
    }

    const nomeLower = nomeRaw.toLowerCase()
    const matchesDefault = DEFAULT_MOTIVOS.some(
      (motivo) => motivo.toLowerCase() === nomeLower
    )
    if (matchesDefault) {
      return NextResponse.json({
        motivo: DEFAULT_MOTIVOS.find((motivo) => motivo.toLowerCase() === nomeLower) ?? nomeRaw,
        created: false,
        customCount: await prisma.motivoPerda.count({ where: { userId } }),
        maxCustom: MAX_CUSTOM,
      })
    }

    const existing = await prisma.motivoPerda.findFirst({
      where: {
        userId,
        nome: {
          equals: nomeRaw,
          mode: 'insensitive',
        },
      },
    })

    if (existing) {
      return NextResponse.json({
        motivo: existing.nome,
        created: false,
        customCount: await prisma.motivoPerda.count({ where: { userId } }),
        maxCustom: MAX_CUSTOM,
      })
    }

    const customCount = await prisma.motivoPerda.count({ where: { userId } })
    if (customCount >= MAX_CUSTOM) {
      return NextResponse.json(
        { error: 'Limite de 3 motivos personalizados atingido' },
        { status: 400 }
      )
    }

    const created = await prisma.motivoPerda.create({
      data: {
        userId,
        nome: nomeRaw,
      },
    })

    return NextResponse.json(
      {
        motivo: created.nome,
        created: true,
        customCount: customCount + 1,
        maxCustom: MAX_CUSTOM,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar motivo de perda:', error)
    return NextResponse.json(
      { error: 'Erro ao criar motivo de perda' },
      { status: 500 }
    )
  }
}
