import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/route-helpers'
import { createCliente } from '@/lib/services/clientes'
import { enforceApiRateLimit } from '@/lib/security/api-rate-limit'
import { clienteCreateSchema } from '@/lib/validations/clientes'

export const dynamic = 'force-dynamic'

const MAX_IMPORT_ROWS = 500
const MAX_BODY_BYTES = 2 * 1024 * 1024
const importRateLimitConfig = {
  windowMs: 60 * 1000,
  maxAttempts: 5,
  blockDurationMs: 60 * 1000,
} as const

type ImportRow = Record<string, string>

function getRow(row: ImportRow, ...candidates: string[]): string | undefined {
  for (const c of candidates) {
    const entry = Object.entries(row).find(([rk]) => rk.trim().toLowerCase() === c.trim().toLowerCase())
    const v = entry ? entry[1] : row[c]
    const str = typeof v === 'string' ? v : v != null ? String(v) : ''
    if (str.trim()) return str.trim()
  }
  return undefined
}

function rowToPayload(row: ImportRow) {
  const nome = getRow(row, 'nome') || getRow(row, 'empresa') || getRow(row, 'razaoSocial', 'razao_social') || getRow(row, 'nomeFantasia', 'nome_fantasia')
  if (!nome) return null

  let camposPersonalizados: Array<{ label: string; value: string }> | undefined
  const cpRaw = getRow(row, 'camposPersonalizados', 'campos_personalizados')
  if (cpRaw) {
    try {
      const parsed = JSON.parse(cpRaw)
      if (Array.isArray(parsed) && parsed.every((p) => p && typeof p.label === 'string')) {
        camposPersonalizados = parsed.map((p) => ({ label: String(p.label), value: String(p.value ?? '') }))
      }
    } catch {
      /* ignorar */
    }
  }

  const perfil = getRow(row, 'perfil')?.toLowerCase()
  const isB2B =
    perfil === 'b2b' ||
    !!(
      getRow(row, 'cnpj') ||
      getRow(row, 'razaoSocial', 'razao_social') ||
      (getRow(row, 'empresa') && getRow(row, 'empresa') !== nome)
    )

  const empresaNome = getRow(row, 'empresa') || getRow(row, 'razaoSocial', 'razao_social') || getRow(row, 'nomeFantasia', 'nome_fantasia')
  const nomeFinal = isB2B && empresaNome ? empresaNome : nome
  const nomeContato = getRow(row, 'nome') || nome

  const parsed = clienteCreateSchema.safeParse({
    nome: isB2B ? (nomeContato || nomeFinal) : nomeFinal,
    email: getRow(row, 'email'),
    telefone: getRow(row, 'telefone'),
    empresa: isB2B ? nomeFinal : getRow(row, 'empresa'),
    endereco: getRow(row, 'endereco') ||
      [getRow(row, 'tipoLogradouro', 'tipo_logradouro'), getRow(row, 'logradouro'), getRow(row, 'numeroEndereco', 'numero_endereco'), getRow(row, 'complemento')]
        .filter(Boolean)
        .join(' ').trim() || undefined,
    cidade: getRow(row, 'cidade') || getRow(row, 'municipio'),
    estado: getRow(row, 'estado') || getRow(row, 'uf')?.slice(0, 2)?.toUpperCase(),
    cep: getRow(row, 'cep'),
    observacoes: getRow(row, 'observacoes'),
    documento: getRow(row, 'documento') || getRow(row, 'cnpj'),
    cargo: getRow(row, 'cargo'),
    website: getRow(row, 'website'),
    dataNascimento: getRow(row, 'dataNascimento', 'data_nascimento'),
    camposPersonalizados,
    cnpj: getRow(row, 'cnpj'),
    matrizFilial: getRow(row, 'matrizFilial', 'matriz_filial'),
    razaoSocial: getRow(row, 'razaoSocial', 'razao_social'),
    nomeFantasia: getRow(row, 'nomeFantasia', 'nome_fantasia'),
    capitalSocial: getRow(row, 'capitalSocial', 'capital_social'),
    porte: getRow(row, 'porte'),
    qualificacaoProfissional: getRow(row, 'qualificacaoProfissional', 'qualificacao_profissional'),
    naturezaJuridica: getRow(row, 'naturezaJuridica', 'natureza_juridica'),
    situacaoCadastral: getRow(row, 'situacaoCadastral', 'situacao_cadastral'),
    dataSituacaoCadastral: getRow(row, 'dataSituacaoCadastral', 'data_situacao_cadastral'),
    motivoSituacaoCadastral: getRow(row, 'motivoSituacaoCadastral', 'motivo_situacao_cadastral'),
    dataAbertura: getRow(row, 'dataAbertura', 'data_abertura'),
    tipoLogradouro: getRow(row, 'tipoLogradouro', 'tipo_logradouro'),
    logradouro: getRow(row, 'logradouro'),
    numeroEndereco: getRow(row, 'numeroEndereco', 'numero_endereco'),
    complemento: getRow(row, 'complemento'),
    bairro: getRow(row, 'bairro'),
    telefone2: getRow(row, 'telefone2', 'telefone_2'),
    fax: getRow(row, 'fax'),
    cnaePrincipal: getRow(row, 'cnaePrincipal', 'cnae_principal'),
    cnaePrincipalDesc: getRow(row, 'cnaePrincipalDesc', 'cnae_principal_desc'),
    cnaesSecundarios: getRow(row, 'cnaesSecundarios', 'cnaes_secundarios'),
    mei: getRow(row, 'mei'),
    dataEntradaMei: getRow(row, 'dataEntradaMei', 'data_entrada_mei'),
    simples: getRow(row, 'simples'),
  })
  return parsed.success ? parsed.data : null
}

export async function POST(request: NextRequest) {
  console.info('[api/clientes/import] POST recebido')
  return withAuth(request, async (userId) => {
    console.info('[api/clientes/import] Usuario autenticado', { userId })

    const rateLimitResponse = await enforceApiRateLimit({
      key: `api:clientes:import:user:${userId}`,
      config: importRateLimitConfig,
      error: 'Muitas importacoes em pouco tempo. Aguarde um minuto.',
    })
    if (rateLimitResponse) {
      console.warn('[api/clientes/import] Rate limit atingido')
      return rateLimitResponse
    }

    const contentLength = Number(request.headers.get('content-length') ?? '0')
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: 'Arquivo muito grande (maximo 2MB)' },
        { status: 413 }
      )
    }

    try {
      const body = await request.json()
      const clientes: ImportRow[] = Array.isArray(body.clientes) ? body.clientes : []
      console.info('[api/clientes/import] Body recebido', {
        hasClientes: 'clientes' in body,
        clientesLength: clientes.length,
        primeiraLinha: clientes[0],
      })

      if (clientes.length === 0) {
        console.warn('[api/clientes/import] Nenhum cliente no body')
        return NextResponse.json(
          { error: 'Nenhum cliente para importar' },
          { status: 400 }
        )
      }

      if (clientes.length > MAX_IMPORT_ROWS) {
        return NextResponse.json(
          { error: `Limite de ${MAX_IMPORT_ROWS} clientes por importacao` },
          { status: 400 }
        )
      }

      let importados = 0
      let duplicados = 0
      const erros: string[] = []

      for (let i = 0; i < clientes.length; i++) {
        const payload = rowToPayload(clientes[i])
        if (!payload) {
          erros.push(`Linha ${i + 2}: nome ou empresa obrigatorio`)
          console.warn('[api/clientes/import] Linha ignorada (sem nome)', { i: i + 2, row: clientes[i] })
          continue
        }

        try {
          await createCliente(userId, payload)
          importados++
        } catch (err) {
          const rawMsg = err instanceof Error ? err.message : String(err)
          const code = (err as { code?: string }).code
          if (rawMsg === 'CLIENTE_EMAIL_DUPLICADO' || code === 'P2002') {
            duplicados++
          } else {
            const safeMsg = code?.startsWith('P') ? 'Erro de validacao no banco de dados' : 'Erro ao processar registro'
            erros.push(`Linha ${i + 2}: ${safeMsg}`)
            console.error('[api/clientes/import] Erro ao criar cliente', { linha: i + 2, payload, err })
          }
        }
      }

      const response = {
        success: true,
        importados,
        duplicados,
        erros,
        mensagem: `${importados} cliente(s) importado(s), ${duplicados} duplicado(s) ignorado(s)${erros.length ? `, ${erros.length} erro(s)` : ''}`,
      }
      console.info('[api/clientes/import] Resultado', response)
      return NextResponse.json(response)
    } catch (error) {
      console.error('[api/clientes/import] Erro geral', error)
      return NextResponse.json(
        { error: 'Erro ao importar clientes' },
        { status: 500 }
      )
    }
  })
}
