import { prisma } from '@/lib/prisma'
import type { MotivoPerdaCreateInput } from '@/lib/validations/motivos-perda'

const DEFAULT_MOTIVOS = [
  'Prazo de entrega',
  'Preco',
  'Forma de pagamento',
  'Concorrente',
  'Desistencia',
]

export const MAX_CUSTOM_MOTIVOS = 3

function uniqueMotivos(items: string[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function listMotivos(userId: string) {
  const customMotivos = await prisma.motivoPerda.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: { nome: true },
  })

  const customList = customMotivos.map((m) => m.nome)
  const motivos = uniqueMotivos([...DEFAULT_MOTIVOS, ...customList])

  return {
    motivos,
    customCount: customList.length,
    maxCustom: MAX_CUSTOM_MOTIVOS,
  }
}

export async function createMotivo(userId: string, data: MotivoPerdaCreateInput) {
  const nomeRaw = data.nome

  const nomeLower = nomeRaw.toLowerCase()
  const matchesDefault = DEFAULT_MOTIVOS.some(
    (motivo) => motivo.toLowerCase() === nomeLower
  )

  if (matchesDefault) {
    const motivo = DEFAULT_MOTIVOS.find((m) => m.toLowerCase() === nomeLower) ?? nomeRaw
    const customCount = await prisma.motivoPerda.count({ where: { userId } })
    return {
      motivo,
      created: false,
      customCount,
      maxCustom: MAX_CUSTOM_MOTIVOS,
    }
  }

  const existing = await prisma.motivoPerda.findFirst({
    where: {
      userId,
      nome: { equals: nomeRaw, mode: 'insensitive' },
    },
  })

  if (existing) {
    const customCount = await prisma.motivoPerda.count({ where: { userId } })
    return {
      motivo: existing.nome,
      created: false,
      customCount,
      maxCustom: MAX_CUSTOM_MOTIVOS,
    }
  }

  const customCount = await prisma.motivoPerda.count({ where: { userId } })
  if (customCount >= MAX_CUSTOM_MOTIVOS) {
    throw new Error('MOTIVO_LIMITE_ATINGIDO')
  }

  const created = await prisma.motivoPerda.create({
    data: { userId, nome: nomeRaw },
  })

  return {
    motivo: created.nome,
    created: true,
    customCount: customCount + 1,
    maxCustom: MAX_CUSTOM_MOTIVOS,
  }
}
