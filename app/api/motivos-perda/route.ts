import { NextRequest, NextResponse } from 'next/server'
import { withAuth, zodErrorResponse } from '@/lib/api/route-helpers'
import { listMotivos, createMotivo } from '@/lib/services/motivos-perda'
import { motivoPerdaCreateSchema } from '@/lib/validations/motivos-perda'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  return withAuth(req, async (userId) => {
    try {
      const result = await listMotivos(userId)
      return NextResponse.json(result)
    } catch (error) {
      console.error('Erro ao buscar motivos de perda:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar motivos de perda' },
        { status: 500 }
      )
    }
  })
}

export async function POST(req: NextRequest) {
  return withAuth(req, async (userId) => {
    try {
      const body = await req.json()
      const parsed = motivoPerdaCreateSchema.safeParse(body)

      if (!parsed.success) {
        return zodErrorResponse(parsed.error)
      }

      const result = await createMotivo(userId, parsed.data)

      return NextResponse.json(result, result.created ? { status: 201 } : undefined)
    } catch (error: unknown) {
      console.error('Erro ao criar motivo de perda:', error)

      if (error instanceof Error && error.message === 'MOTIVO_LIMITE_ATINGIDO') {
        return NextResponse.json(
          { error: 'Limite de 3 motivos personalizados atingido' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Erro ao criar motivo de perda' },
        { status: 500 }
      )
    }
  })
}
