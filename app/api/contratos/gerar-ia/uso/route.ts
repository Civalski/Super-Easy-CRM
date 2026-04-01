import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensureDatabaseInitialized } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import { MODELOS_IA_CONTRATO } from '@/lib/contratos-ia'

export const dynamic = 'force-dynamic'
const ADMIN_UNLIMITED_VALUE = 999999

function getDataHojeBR(): string {
  const now = new Date()
  const br = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  return br.toISOString().slice(0, 10)
}

function isPrivilegedRole(role: string | null | undefined) {
  const normalized = (role ?? '').trim().toLowerCase()
  return normalized === 'admin' || normalized === 'owner' || normalized === 'superadmin'
}

export async function GET(request: NextRequest) {
  return withAuth(request,
    async (userId) => {
      try {
        await ensureDatabaseInitialized()
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        })
        const dataHoje = getDataHojeBR()

        const registros = await prisma.iaGeracaoContrato.findMany({
          where: { userId, data: dataHoje },
          select: { model: true },
        })
        const usoPorModelo: Record<string, number> = {}
        for (const r of registros) {
          usoPorModelo[r.model] = (usoPorModelo[r.model] ?? 0) + 1
        }

        const privileged = isPrivilegedRole(user?.role)
        const resultado = MODELOS_IA_CONTRATO.map((m) => {
          const usado = usoPorModelo[m.id] ?? 0
          if (privileged) {
            return {
              model: m.id,
              usado,
              limite: ADMIN_UNLIMITED_VALUE,
              restante: ADMIN_UNLIMITED_VALUE,
            }
          }

          return {
            model: m.id,
            usado,
            limite: m.limiteDiario,
            restante: Math.max(0, m.limiteDiario - usado),
          }
        })

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
