import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/route-helpers'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type BackupCliente = {
  nome?: string
  email?: string | null
  telefone?: string | null
  empresa?: string | null
  endereco?: string | null
  cidade?: string | null
  estado?: string | null
  cep?: string | null
  cargo?: string | null
  documento?: string | null
  website?: string | null
  dataNascimento?: string | null
  observacoes?: string | null
  camposPersonalizados?: unknown
}

function str(v: unknown, maxLen = 500): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s === '' ? null : s.slice(0, maxLen)
}

function normalizeEstado(v: string | null | undefined): string | null {
  const s = str(v, 2)
  if (!s || s.length !== 2) return null
  return s.toUpperCase()
}

function sanitizeCamposPersonalizados(arr: unknown): unknown {
  if (!Array.isArray(arr)) return null
  const valid = arr
    .filter((x): x is Record<string, unknown> => x != null && typeof x === 'object')
    .map((x) => ({
      label: typeof x.label === 'string' ? x.label.trim().slice(0, 80) : '',
      value: typeof x.value === 'string' ? x.value.trim().slice(0, 500) : '',
    }))
    .filter((x) => x.label.length > 0)
    .slice(0, 20)
  return valid.length > 0 ? valid : null
}

function toCreateData(item: BackupCliente, userId: string) {
  const nome = (item.nome ?? '').trim() || 'Cliente sem nome'
  const email = str(item.email, 120)
  const estado = normalizeEstado(item.estado)
  const camposPersonalizados = sanitizeCamposPersonalizados(item.camposPersonalizados)

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return null
  }

  return {
    userId,
    nome: nome.slice(0, 120),
    email,
    telefone: str(item.telefone, 30),
    empresa: str(item.empresa, 120),
    endereco: str(item.endereco, 200),
    cidade: str(item.cidade, 80),
    estado: estado && estado.length === 2 ? estado : null,
    cep: str(item.cep, 12),
    cargo: str(item.cargo, 100),
    documento: str(item.documento, 30),
    website: str(item.website, 200),
    dataNascimento: str(item.dataNascimento, 20),
    observacoes: str(item.observacoes, 2000),
    camposPersonalizados,
  }
}

/**
 * POST /api/clientes/backup/restore
 * Restaura clientes a partir de um arquivo de backup JSON.
 */
async function parseRequestBody(request: NextRequest): Promise<{ clientes: unknown[] } | null> {
  const contentType = request.headers.get('content-type') ?? ''
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const file = formData.get('backup') ?? formData.get('file')
    if (!(file instanceof File) && !(file instanceof Blob)) return null
    const text = (await (file as Blob).text()).replace(/^\uFEFF/, '')
    try {
      const body = JSON.parse(text) as { clientes?: unknown[] }
      return Array.isArray(body?.clientes) ? { clientes: body.clientes } : null
    } catch {
      return null
    }
  }
  const body = (await request.json()) as { clientes?: unknown[] }
  return Array.isArray(body?.clientes) ? { clientes: body.clientes } : null
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const parsed = await parseRequestBody(request)
      const rawClientes = parsed?.clientes ?? []

      if (rawClientes.length === 0) {
        return NextResponse.json(
          { error: 'Arquivo de backup inválido ou sem clientes' },
          { status: 400 }
        )
      }

      let created = 0
      let skipped = 0
      const errors: string[] = []
      const skippedReasons: string[] = []

      for (const item of rawClientes) {
        const data = toCreateData(item, userId)
        if (!data) {
          errors.push(`"${item.nome ?? '?'}": dados inválidos (ex: email inválido)`)
          skippedReasons.push(`"${item.nome ?? '?'}": rejeitado por validação`)
          skipped++
          continue
        }

        if (data.email) {
          const existente = await prisma.cliente.findFirst({
            where: { userId, email: data.email },
          })
          if (existente) {
            skippedReasons.push(`"${data.nome}": email já existe`)
            skipped++
            continue
          }
        }

        try {
          const { camposPersonalizados: cp, ...rest } = data
          await prisma.cliente.create({
            data: {
              ...rest,
              ...(cp != null && { camposPersonalizados: cp }),
            },
          })
          created++
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Erro ao criar'
          errors.push(`"${data.nome}": ${msg}`)
          skippedReasons.push(`"${data.nome}": ${msg}`)
          skipped++
        }
      }

      return NextResponse.json({
        created,
        skipped,
        total: rawClientes.length,
        skippedReasons: skippedReasons.slice(0, 10),
        ...(errors.length > 0 && { errors: errors.slice(0, 10) }),
      })
    } catch (error) {
      console.error('Erro ao restaurar backup:', error)
      return NextResponse.json(
        { error: 'Erro ao restaurar backup. Verifique se o arquivo é um backup válido.' },
        { status: 500 }
      )
    }
  })
}
