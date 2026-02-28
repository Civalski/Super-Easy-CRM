import { Prisma, PrismaClient } from '@prisma/client'
import { roundMoney, sumMoney } from '@/lib/money'

export function calculateItemSubtotal(params: {
  quantidade: number
  precoUnitario: number
  desconto: number
}) {
  const precoUnitario = roundMoney(params.precoUnitario)
  const desconto = roundMoney(params.desconto)
  const bruto = roundMoney(params.quantidade * precoUnitario)
  const subtotal = roundMoney(Math.max(0, bruto - desconto))
  return {
    bruto,
    subtotal,
  }
}

export async function recalculatePedidoTotals(
  tx: Prisma.TransactionClient | PrismaClient,
  userId: string,
  pedidoId: string
) {
  const itens = await tx.pedidoItem.findMany({
    where: { userId, pedidoId },
    select: {
      quantidade: true,
      precoUnitario: true,
      desconto: true,
      subtotal: true,
    },
  })

  const totalBruto = sumMoney(
    itens.map((item) => roundMoney(item.quantidade * item.precoUnitario))
  )
  const totalDesconto = sumMoney(itens.map((item) => roundMoney(item.desconto)))
  const totalLiquido = sumMoney(itens.map((item) => roundMoney(item.subtotal)))

  await tx.pedido.updateMany({
    where: { id: pedidoId, userId },
    data: {
      totalBruto,
      totalDesconto,
      totalLiquido,
    },
  })

  return {
    totalBruto,
    totalDesconto,
    totalLiquido,
  }
}
