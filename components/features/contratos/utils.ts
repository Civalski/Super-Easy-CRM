import type { Clausula } from './types'

export interface PropostaComercialFields {
  precoProjeto: string
  taxasExtras: string
  formaPagamento: string
  opcionais: string
  validadeProposta: string
  observacoesComplementares: string
}

const EMPTY_PROPOSTA_COMERCIAL_FIELDS: PropostaComercialFields = {
  precoProjeto: '',
  taxasExtras: '',
  formaPagamento: '',
  opcionais: '',
  validadeProposta: '',
  observacoesComplementares: '',
}

function sanitizeMultilineText(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function normalizeSearchKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

type PropostaFieldKey = Exclude<keyof PropostaComercialFields, 'observacoesComplementares'>

function mapPropostaFieldKey(label: string): PropostaFieldKey | null {
  const key = normalizeSearchKey(label)

  if (
    key.includes('valor do projeto') ||
    key.includes('investimento') ||
    key.includes('preco') ||
    key === 'valor'
  ) {
    return 'precoProjeto'
  }
  if (key.includes('taxa') || key.includes('acrescimo')) return 'taxasExtras'
  if (key.includes('opcion')) return 'opcionais'
  if (
    key.includes('forma de pagamento') ||
    key.includes('condicoes de pagamento') ||
    key.includes('condicoes comerciais')
  ) {
    return 'formaPagamento'
  }
  if (key.includes('validade')) return 'validadeProposta'

  return null
}

function cleanFieldValue(value: string): string {
  return sanitizeMultilineText(value)
}

export function parsePropostaComercialFields(text: string | null | undefined): PropostaComercialFields {
  const normalized = sanitizeMultilineText(text)
  if (!normalized) return { ...EMPTY_PROPOSTA_COMERCIAL_FIELDS }

  const next: PropostaComercialFields = { ...EMPTY_PROPOSTA_COMERCIAL_FIELDS }
  const extraLines: string[] = []

  for (const rawLine of normalized.split('\n')) {
    const line = rawLine.trim()
    if (!line) {
      extraLines.push('')
      continue
    }

    if (/^#{1,3}\s+/.test(line)) {
      extraLines.push(line)
      continue
    }

    const separatorIndex = line.indexOf(':')
    if (separatorIndex > 0) {
      const label = line.slice(0, separatorIndex)
      const value = line.slice(separatorIndex + 1).trim()
      const mappedField = mapPropostaFieldKey(label)
      if (mappedField) {
        next[mappedField] = cleanFieldValue(value)
        continue
      }
    }

    extraLines.push(line)
  }

  next.observacoesComplementares = sanitizeMultilineText(extraLines.join('\n'))
  return next
}

export function formatPropostaValidadeFromDate(isoDate: string | null | undefined): string {
  if (!isoDate) return ''
  const raw = String(isoDate).trim()
  if (!raw) return ''

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) return `${match[3]}/${match[2]}/${match[1]}`

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return ''

  const day = String(parsed.getDate()).padStart(2, '0')
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const year = String(parsed.getFullYear())
  return `${day}/${month}/${year}`
}

export function buildPropostaComercialText(fields: PropostaComercialFields): string {
  const linhas: string[] = []

  if (fields.precoProjeto.trim()) linhas.push(`Valor do projeto: ${fields.precoProjeto.trim()}`)
  if (fields.taxasExtras.trim()) linhas.push(`Taxa extra: ${fields.taxasExtras.trim()}`)
  if (fields.opcionais.trim()) linhas.push(`Opcionais: ${fields.opcionais.trim()}`)
  if (fields.formaPagamento.trim()) linhas.push(`Forma de pagamento: ${fields.formaPagamento.trim()}`)
  if (fields.validadeProposta.trim()) linhas.push(`Validade da proposta: ${fields.validadeProposta.trim()}`)

  const extras = sanitizeMultilineText(fields.observacoesComplementares)
  const extrasBlock = extras
    ? /^#{1,3}\s+/m.test(extras)
      ? extras
      : `## Informacoes complementares\n${extras}`
    : ''

  return [linhas.join('\n'), extrasBlock].filter(Boolean).join('\n\n').trim()
}

/**
 * Converte texto colado em clausulas.
 * Reconhece: "1. Titulo\nConteudo", "Clausula 1.", "§ 1", ou paragrafos separados por linha em branco.
 */
export function parseClausulasFromText(text: string): Clausula[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  const lines = trimmed.split(/\r?\n/)
  const clauses: Clausula[] = []
  let currentTitle = ''
  let currentContent: string[] = []

  const flushCurrent = () => {
    const conteudo = currentContent.join('\n').trim()
    if (currentTitle || conteudo) {
      clauses.push({
        titulo: currentTitle.trim(),
        conteudo,
      })
    }
    currentTitle = ''
    currentContent = []
  }

  const startNewClause = (titulo: string, restOfLine = '') => {
    flushCurrent()
    currentTitle = titulo.trim()
    currentContent = restOfLine.trim() ? [restOfLine.trim()] : []
  }

  for (const line of lines) {
    const trimmedLine = line.trim()

    const numDot = trimmedLine.match(/^(\d+)[.)]\s*([\s\S]+)?$/)
    if (numDot) {
      const titulo = numDot[2]?.trim() || `Clausula ${numDot[1]}`
      startNewClause(titulo)
      continue
    }

    const numParen = trimmedLine.match(/^(\d+)\)\s*([\s\S]+)?$/)
    if (numParen) {
      const titulo = numParen[2]?.trim() || `Clausula ${numParen[1]}`
      startNewClause(titulo)
      continue
    }

    const clausulaMatch = trimmedLine.match(/^Clausula\s+(.+)/i)
    if (clausulaMatch) {
      startNewClause(clausulaMatch[1].trim())
      continue
    }

    const paragMatch = trimmedLine.match(/^§\s*(\d+)?\.?\s*(.+)?$/i)
    if (paragMatch) {
      const titulo = paragMatch[2]?.trim() || (paragMatch[1] ? `§ ${paragMatch[1]}` : 'Clausula')
      startNewClause(titulo)
      continue
    }

    if (trimmedLine === '') {
      flushCurrent()
      continue
    }

    if (currentTitle || currentContent.length > 0) {
      currentContent.push(trimmedLine)
    } else {
      startNewClause(trimmedLine)
    }
  }

  flushCurrent()
  return clauses
}

