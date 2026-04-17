export const dynamic = 'force-dynamic'

/**
 * Importa leads (prospectos) e converte automaticamente em clientes.
 * Fluxo: CSV -> prospectos -> clientes (conversao automatica).
 * Estrutura flexivel para B2B/B2C via modelo Prospecto e logica de conversao.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import { enforceApiRateLimit } from '@/lib/security/api-rate-limit'
import { heavyRoutesDisabledResponse, isHeavyRoutesDisabled } from '@/lib/security/heavy-routes'
import { logBusinessEvent } from '@/lib/observability/audit'
import type { EmpresaParquet } from '@/types/leads'

const MAX_IMPORT = 500
const MAX_BODY_BYTES = 2 * 1024 * 1024
const importRateLimitConfig = {
  windowMs: 60 * 1000,
  maxAttempts: 5,
  blockDurationMs: 60 * 1000,
} as const

const COLUNAS_PERMITIDAS: Record<string, string> = {
  cnpj: 'CNPJ',
  'matriz/filial': 'MATRIZ/FILIAL',
  'razao social': 'RAZAO SOCIAL / NOME EMPRESARIAL',
  'razao social / nome empresarial': 'RAZAO SOCIAL / NOME EMPRESARIAL',
  'nome fantasia': 'NOME FANTASIA',
  'capital social': 'CAPITAL SOCIAL',
  'porte da empresa': 'PORTE DA EMPRESA',
  'qualificacao do profissional': 'QUALIFICACAO DO PROFISSIONAL',
  'natureza juridica': 'NATUREZA JURIDICA',
  'situação cadastral': 'SITUAÇÃO CADASTRAL',
  'situacao cadastral': 'SITUAÇÃO CADASTRAL',
  'data da situação cadastral': 'DATA DA SITUAÇÃO CADASTRAL',
  'data da situacao cadastral': 'DATA DA SITUAÇÃO CADASTRAL',
  'motivo da situação cadastral': 'MOTIVO DA SITUAÇÃO CADASTRAL',
  'motivo da situacao cadastral': 'MOTIVO DA SITUAÇÃO CADASTRAL',
  'data de início de atividade': 'DATA DE INÍCIO DE ATIVIDADE',
  'data de inicio de atividade': 'DATA DE INÍCIO DE ATIVIDADE',
  'atividade principal': 'ATIVIDADE PRINCIPAL',
  'cod atividade principal': 'COD ATIVIDADE PRINCIPAL',
  'cod atividades secundarias': 'COD ATIVIDADES SECUNDARIAS',
  logradouro: 'LOGRADOURO',
  numero: 'NUMERO',
  complemento: 'COMPLEMENTO',
  bairro: 'BAIRRO',
  cep: 'CEP',
  uf: 'UF',
  municipio: 'MUNICIPIO',
  'telefone 1': 'TELEFONE 1',
  telefone: 'TELEFONE 1',
  'telefone 2': 'TELEFONE 2',
  'correio eletronico': 'CORREIO ELETRONICO',
  email: 'CORREIO ELETRONICO',
  'mei?': 'MEI?',
  mei: 'MEI?',
  'data entrada mei': 'DATA ENTRADA MEI',
  'simples?': 'SIMPLES?',
  simples: 'SIMPLES?',
}

function normalizarRow(row: Record<string, unknown>): EmpresaParquet {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    const keyNorm = String(key).trim().toLowerCase().replace(/\s+/g, ' ')
    const mapped = COLUNAS_PERMITIDAS[keyNorm]
    if (mapped) out[mapped] = value
  }
  return out as unknown as EmpresaParquet
}

function montarCNPJ(empresa: EmpresaParquet): string {
  const cnpjVal = empresa.CNPJ
  if (cnpjVal && String(cnpjVal).replace(/\D/g, '').length >= 14) {
    return String(cnpjVal).replace(/\D/g, '').padStart(14, '0')
  }
  const basico = String(empresa['CNPJ BASICO'] ?? '').trim()
  const ordem = String(empresa['CNPJ ORDEM'] ?? '').trim()
  const dv = String(empresa['CNPJ DV'] ?? '').trim()
  if (basico || ordem || dv) {
    return `${basico.padStart(8, '0')}${ordem.padStart(4, '0')}${dv.padStart(2, '0')}`
  }
  return ''
}

function mapearEmpresaParaProspecto(empresa: EmpresaParquet, cnpj: string) {
  return {
    cnpj,
    cnpjBasico: empresa['CNPJ BASICO'] || cnpj.substring(0, 8),
    cnpjOrdem: empresa['CNPJ ORDEM'] || cnpj.substring(8, 12),
    cnpjDv: empresa['CNPJ DV'] || cnpj.substring(12, 14),
    razaoSocial: empresa['RAZAO SOCIAL / NOME EMPRESARIAL'] || 'Nao informado',
    nomeFantasia: empresa['NOME FANTASIA'] || null,
    capitalSocial: empresa['CAPITAL SOCIAL'] || null,
    porte: empresa['PORTE DA EMPRESA'] || null,
    naturezaJuridica: empresa['NATUREZA JURIDICA'] || null,
    situacaoCadastral: empresa['SITUAÇÃO CADASTRAL'] || null,
    dataAbertura: empresa['DATA DE INÍCIO DE ATIVIDADE'] || null,
    matrizFilial: empresa['MATRIZ/FILIAL'] || null,
    cnaePrincipal: empresa['COD ATIVIDADE PRINCIPAL'] || null,
    cnaePrincipalDesc: empresa['ATIVIDADE PRINCIPAL'] || null,
    cnaesSecundarios: empresa['COD ATIVIDADES SECUNDARIAS'] || null,
    tipoLogradouro: empresa['TIPO DE LOGRADOURO'] || null,
    logradouro: empresa.LOGRADOURO || null,
    numero: empresa.NUMERO || null,
    complemento: empresa.COMPLEMENTO || null,
    bairro: empresa.BAIRRO || null,
    cep: empresa.CEP || null,
    municipio: empresa.MUNICIPIO || 'Nao informado',
    uf: empresa.UF || 'XX',
    telefone1: empresa['TELEFONE 1'] || null,
    telefone2: empresa['TELEFONE 2'] || null,
    fax: empresa.FAX || null,
    email: empresa['CORREIO ELETRONICO'] || null,
    status: 'lead_frio',
    prioridade: 0,
  }
}

export async function POST(request: NextRequest) {
  if (isHeavyRoutesDisabled()) {
    return heavyRoutesDisabledResponse()
  }

  return withAuth(request, async (userId) => {
    const rateLimitResponse = await enforceApiRateLimit({
      key: `api:clientes:import-via-leads:user:${userId}`,
      config: importRateLimitConfig,
      error: 'Muitas importacoes em pouco tempo. Aguarde um minuto.',
    })
    if (rateLimitResponse) return rateLimitResponse

    const contentLength = Number(request.headers.get('content-length') ?? '0')
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: 'Arquivo muito grande (maximo 2MB)' },
        { status: 413 }
      )
    }

    try {
      const body = await request.json()
      const empresas: EmpresaParquet[] = Array.isArray(body.empresas) ? body.empresas : []

      if (empresas.length === 0) {
        return NextResponse.json(
          { error: 'Nenhuma empresa para importar' },
          { status: 400 }
        )
      }

      if (empresas.length > MAX_IMPORT) {
        return NextResponse.json(
          { error: `Limite de ${MAX_IMPORT} empresas por importacao` },
          { status: 400 }
        )
      }

      const importId = Date.now()
      const cnpjSet = new Set<string>()
      let importados = 0
      let duplicados = 0
      const erros: string[] = []

      for (let i = 0; i < empresas.length; i++) {
        try {
          const row = empresas[i] as unknown as Record<string, unknown>
          const empresa = normalizarRow(row)
          let cnpj = montarCNPJ(empresa)

          if (!cnpj || cnpj === '00000000000000') {
            cnpj = `IMPORT-${importId}-${i}`
          }

          if (cnpjSet.has(cnpj)) {
            duplicados++
            continue
          }
          cnpjSet.add(cnpj)

          const dadosProspecto = mapearEmpresaParaProspecto(empresa, cnpj)

          const prospecto = await prisma.prospecto.create({
            data: {
              ...dadosProspecto,
              userId,
              lote: null,
            },
          })

          let emailParaUsar = prospecto.email
          if (emailParaUsar) {
            const clienteExistente = await prisma.cliente.findFirst({
              where: { email: emailParaUsar, userId },
            })
            if (clienteExistente) {
              emailParaUsar = null
            }
          }

          const cliente = await prisma.cliente.create({
            data: {
              userId,
              nome: prospecto.nomeFantasia || prospecto.razaoSocial,
              email: emailParaUsar,
              telefone: prospecto.telefone1,
              empresa: prospecto.razaoSocial,
              documento: prospecto.cnpj,
              endereco: [
                prospecto.tipoLogradouro,
                prospecto.logradouro,
                prospecto.numero,
                prospecto.complemento,
              ]
                .filter(Boolean)
                .join(' '),
              cidade: prospecto.municipio,
              estado: prospecto.uf,
              cep: prospecto.cep,
              cnpj: prospecto.cnpj,
              matrizFilial: prospecto.matrizFilial,
              razaoSocial: prospecto.razaoSocial,
              nomeFantasia: prospecto.nomeFantasia,
              capitalSocial: prospecto.capitalSocial,
              porte: prospecto.porte,
              naturezaJuridica: prospecto.naturezaJuridica,
              situacaoCadastral: prospecto.situacaoCadastral,
              dataAbertura: prospecto.dataAbertura,
              tipoLogradouro: prospecto.tipoLogradouro,
              logradouro: prospecto.logradouro,
              numeroEndereco: prospecto.numero,
              complemento: prospecto.complemento,
              bairro: prospecto.bairro,
              telefone2: prospecto.telefone2,
              fax: prospecto.fax,
              cnaePrincipal: prospecto.cnaePrincipal,
              cnaePrincipalDesc: prospecto.cnaePrincipalDesc,
              cnaesSecundarios: prospecto.cnaesSecundarios,
            },
          })

          await prisma.prospecto.update({
            where: { id: prospecto.id },
            data: {
              status: 'convertido',
              clienteId: cliente.id,
            },
          })

          logBusinessEvent({
            event: 'prospecto.convertido',
            userId,
            entity: 'prospecto',
            entityId: prospecto.id,
            from: prospecto.status,
            to: 'convertido',
            metadata: { clienteId: cliente.id },
          })

          importados++
        } catch (err) {
          const code = (err as { code?: string }).code
          const msg = err instanceof Error ? err.message : String(err)
          if (code === 'P2002') {
            duplicados++
          } else {
            erros.push(`Linha ${i + 2}: ${msg}`)
          }
        }
      }

      return NextResponse.json({
        success: true,
        importados,
        duplicados,
        erros,
        mensagem: `${importados} cliente(s) importado(s), ${duplicados} duplicado(s) ignorado(s)${erros.length ? `, ${erros.length} erro(s)` : ''}`,
      })
    } catch (error) {
      console.error('[api/clientes/import-via-leads] Erro:', error)
      return NextResponse.json(
        { error: 'Erro ao importar clientes' },
        { status: 500 }
      )
    }
  })
}
