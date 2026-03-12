/**
 * POST /api/users/me/import
 *
 * Importa dados de um backup JSON (exceto clientes).
 * Clientes devem ser importados manualmente na aba de clientes.
 * O mapeamento de FKs usa o campo numero (cliente, oportunidade, pedido).
 */
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/route-helpers'
import { enforceApiRateLimit } from '@/lib/security/api-rate-limit'
import { importBackupData } from '@/lib/services/import-data'

export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 10 * 1024 * 1024 // 10MB
const importRateLimitConfig = {
  windowMs: 60 * 1000,
  maxAttempts: 5,
  blockDurationMs: 60 * 1000,
} as const

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    const rateLimitResponse = enforceApiRateLimit({
      key: `api:users:import:user:${userId}`,
      config: importRateLimitConfig,
      error: 'Muitas importações em pouco tempo. Aguarde um minuto.',
    })
    if (rateLimitResponse) return rateLimitResponse

    const contentLength = Number(request.headers.get('content-length') ?? '0')
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: 'Arquivo muito grande (máximo 10MB)' },
        { status: 413 }
      )
    }

    try {
      const body = await request.json()
      if (!body || typeof body !== 'object') {
        return NextResponse.json(
          { error: 'JSON inválido. Use o arquivo exportado pelo CRM.' },
          { status: 400 }
        )
      }

      const result = await importBackupData(userId, body)

      const total =
        result.produtosServicos +
        result.contatos +
        result.tarefas +
        result.orcamentos +
        result.pedidos +
        result.pedidoItens +
        result.metas +
        result.goalSnapshots +
        result.contasReceber +
        result.movimentosFinanceiros +
        result.prospectos

      const skipped =
        result.skipped.orcamentos + result.skipped.pedidos + result.skipped.contatos

      let message = `Importação concluída. ${total} registro(s) inserido(s).`
      if (skipped > 0) {
        message += ` ${skipped} registro(s) ignorado(s) (clientes não encontrados - importe clientes primeiro na aba Clientes).`
      }

      return NextResponse.json({
        success: true,
        message,
        result,
      })
    } catch (error) {
      console.error('Erro ao importar dados:', error)
      const msg = error instanceof Error ? error.message : 'Erro ao importar dados.'
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  })
}
