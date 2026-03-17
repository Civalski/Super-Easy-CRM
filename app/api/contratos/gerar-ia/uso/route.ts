import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensureDatabaseInitialized } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import { MODELOS_IA_CONTRATO } from '@/lib/contratos-ia'

export const dynamic = 'force-dynamic'

function getDataHojeBR(): string {
  const now = new Date()
  const br = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  return br.toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  return withAuth(request,
    async (userId) => {
      try {
        await ensureDatabaseInitialized()
        const dataHoje = getDataHojeBR()

        const registros = await prisma.iaGeracaoContrato.findMany({
          where: { userId, data: dataHoje },
          select: { model: true },
        })
        const usoPorModelo: Record<string, number> = {}
        for (const r of registros) {
          usoPorModelo[r.model] = (usoPorModelo[r.model] ?? 0) + 1
        }

        const resultado = MODELOS_IA_CONTRATO.map((m) => ({
          model: m.id,
          usado: usoPorModelo[m.id] ?? 0,
          limite: m.limiteDiario,
          restante: Math.max(0, m.limiteDiario - (usoPorModelo[m.id] ?? 0)),
        }))

        return NextResponse.json({ uso: resultado })
      } catch (error) {
        console.error('[contratos/gerar-ia/uso] Error:', error)
        return NextResponse.json(
          { error: 'Erro ao obter uso' },
          { status: 500 }
        )
      }
    }
  )
}
