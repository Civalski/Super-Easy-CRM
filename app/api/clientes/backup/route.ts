import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/route-helpers'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/clientes/backup
 * Exporta todos os clientes do usuário em um arquivo JSON para backup.
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const clientes = await prisma.cliente.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          numero: true,
          nome: true,
          email: true,
          telefone: true,
          empresa: true,
          endereco: true,
          cidade: true,
          estado: true,
          cep: true,
          cargo: true,
          documento: true,
          website: true,
          dataNascimento: true,
          observacoes: true,
          camposPersonalizados: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      const backup = {
        _meta: {
          exportedAt: new Date().toISOString(),
          total: clientes.length,
        },
        clientes,
      }

      const json = JSON.stringify(backup, null, 2)
      const filename = `backup-clientes-${new Date().toISOString().slice(0, 10)}.json`

      return new NextResponse(json, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    } catch (error) {
      console.error('Erro ao gerar backup de clientes:', error)
      return NextResponse.json(
        { error: 'Erro ao gerar backup de clientes' },
        { status: 500 }
      )
    }
  })
}
