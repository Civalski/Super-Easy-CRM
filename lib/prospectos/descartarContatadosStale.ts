import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const DIAS_PARA_AVISO = 7
const DIAS_PARA_DESCARTE = 8

/**
 * Descartar leads em "contatado" (em_contato) que não foram movimentados
 * para em potencial, aguardando orçamento ou virar cliente em 8 dias.
 * Aviso é exibido aos 7 dias; descarte automático aos 8.
 */
export { DIAS_PARA_AVISO, DIAS_PARA_DESCARTE }

export async function descartarContatadosStale(
  userId: string,
  dias = DIAS_PARA_DESCARTE
): Promise<number> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - dias)

  const where: Prisma.ProspectoWhereInput = {
    userId,
    status: 'em_contato',
    OR: [
      { ultimoContato: { lt: cutoff } },
      { ultimoContato: null, updatedAt: { lt: cutoff } },
    ],
  }

  const result = await prisma.prospecto.updateMany({
    where,
    data: { status: 'descartado' },
  })

  return result.count
}
