import type {
  ContractDocKind,
  ContractPdfConfigInput,
  ContractPdfInput,
  ContractPdfUserInput,
  ContractPdfViewModel,
  PdfTextBlock,
  PdfTopicSection,
} from './types'

const PRIMARY_DEFAULT = '#123066'

function normalizeMojibake(value: string): string {
  return value
    .replace(/\u00C3\u00A2\u00E2\u201A\u00AC\u00C2\u00A2|\u00E2\u20AC\u00A2/g, '\u2022')
    .replace(/\u00C3\u00A1/g, '\u00E1')
    .replace(/\u00C3\u00A0/g, '\u00E0')
    .replace(/\u00C3\u00A2/g, '\u00E2')
    .replace(/\u00C3\u00A3/g, '\u00E3')
    .replace(/\u00C3\u00A9/g, '\u00E9')
    .replace(/\u00C3\u00AA/g, '\u00EA')
    .replace(/\u00C3\u00AD/g, '\u00ED')
    .replace(/\u00C3\u00B3/g, '\u00F3')
    .replace(/\u00C3\u00B4/g, '\u00F4')
    .replace(/\u00C3\u00B5/g, '\u00F5')
    .replace(/\u00C3\u00BA/g, '\u00FA')
    .replace(/\u00C3\u00A7/g, '\u00E7')
    .replace(/\u00C3\u0089/g, '\u00C9')
    .replace(/\u00C3\u0093/g, '\u00D3')
    .replace(/\u00C3\u0087/g, '\u00C7')
    .replace(/\u00C2\u00BA/g, '\u00BA')
    .replace(/\u00C2\u00AA/g, '\u00AA')
    .replace(/\u00C2/g, '')
}

function sanitizeInlineText(value: string | null | undefined): string {
  if (!value) return ''
  return normalizeMojibake(value)
    .normalize('NFKC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sanitizeMultilineText(value: string | null | undefined): string {
  if (!value) return ''
  return normalizeMojibake(value)
    .normalize('NFKC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    .replace(/\\\\[nN]/g, '\n')
    .replace(/\\[nN]/g, '\n')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]*##\s*/g, '\n## ')
    .replace(/[ \t]*#\s*/g, '\n# ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function hasVisibleText(value: string | null | undefined): boolean {
  const text = sanitizeInlineText(value)
  if (!text) return false

  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\[\]()]/g, '')
    .trim()

  if (!normalized) return false
  return !['-', '--', 'n/a', 'na', 'preencher', 'a preencher', 'pendente'].includes(normalized)
}

function parseTextBlocks(text: string | null | undefined): PdfTextBlock[] {
  const normalized = sanitizeMultilineText(text)
  if (!normalized) return []

  const lines = normalized.split('\n')
  const blocks: PdfTextBlock[] = []
  let paragraphBuffer: string[] = []

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return
    blocks.push({ kind: 'paragraph', text: paragraphBuffer.join(' ') })
    paragraphBuffer = []
  }

  for (const rawLine of lines) {
    const line = sanitizeInlineText(rawLine)
    if (!line) {
      flushParagraph()
      continue
    }

    const markdownHeading = line.match(/^#{1,3}\s+(.+)$/)
    if (markdownHeading) {
      flushParagraph()
      blocks.push({ kind: 'heading', text: markdownHeading[1].trim() })
      continue
    }

    const bullet = line.match(/^[-*\u2022]\s+(.+)$/)
    if (bullet) {
      flushParagraph()
      blocks.push({ kind: 'bullet', text: bullet[1].trim() })
      continue
    }

    const numbered = line.match(/^(\d+[.)])\s+(.+)$/)
    if (numbered) {
      flushParagraph()
      blocks.push({ kind: 'bullet', text: `${numbered[1]} ${numbered[2].trim()}` })
      continue
    }

    if (/^[^:]{2,80}:$/.test(line)) {
      flushParagraph()
      blocks.push({ kind: 'heading', text: line.replace(/:$/, '').trim() })
      continue
    }

    paragraphBuffer.push(line)
  }

  flushParagraph()

  return blocks.filter((block) => hasVisibleText(block.text))
}

function parseProposalSections(text: string | null | undefined): PdfTopicSection[] {
  const normalized = sanitizeMultilineText(text)
  if (!normalized) return []

  const lines = normalized.split('\n')
  const sections: PdfTopicSection[] = []

  let currentTitle = ''
  let currentBuffer: string[] = []

  const flushCurrent = () => {
    const title = sanitizeInlineText(currentTitle)
    if (!title) {
      currentBuffer = []
      return
    }

    const blocks = parseTextBlocks(currentBuffer.join('\n')).filter((block) => block.kind !== 'heading')
    if (blocks.length === 0) {
      currentBuffer = []
      return
    }

    sections.push({ title, blocks })
    currentBuffer = []
  }

  for (const rawLine of lines) {
    const line = sanitizeInlineText(rawLine)
    const headingMatch = line.match(/^##\s+(.+)$/)
    if (headingMatch) {
      flushCurrent()
      currentTitle = headingMatch[1].trim()
      continue
    }

    if (!currentTitle) continue
    currentBuffer.push(rawLine)
  }

  flushCurrent()
  return sections
}

function dateBr(value?: Date | string | null) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function resolveKind(tipo: string): ContractDocKind {
  return tipo === 'proposta' ? 'proposta' : 'contrato'
}

function normalizeColor(value?: string | null): string {
  const raw = sanitizeInlineText(value)
  if (!raw) return PRIMARY_DEFAULT
  const hex = raw.startsWith('#') ? raw : `#${raw}`
  if (!/^#[\da-fA-F]{6}$/.test(hex)) return PRIMARY_DEFAULT
  return hex.toUpperCase()
}

export function buildContractPdfViewModel(input: {
  contrato: ContractPdfInput
  user: ContractPdfUserInput
  pdfConfig?: ContractPdfConfigInput | null
}): ContractPdfViewModel {
  const { contrato, user, pdfConfig } = input
  const kind = resolveKind(contrato.tipo)
  const documentLabel = kind === 'proposta' ? 'Proposta' : 'Contrato'
  const numberLabel = `#${String(contrato.numero).padStart(5, '0')}`

  const title = sanitizeInlineText(contrato.titulo) || documentLabel.toUpperCase()
  const createdAtLabel = dateBr(contrato.createdAt)
  const clientName = sanitizeInlineText(contrato.cliente?.nome)
  const clientLabel = clientName
  const companyName = sanitizeInlineText(pdfConfig?.nomeEmpresa) || documentLabel.toUpperCase()
  const contactPhone = hasVisibleText(pdfConfig?.telefone) ? sanitizeInlineText(pdfConfig?.telefone) : undefined
  const contactEmail = hasVisibleText(pdfConfig?.email) ? sanitizeInlineText(pdfConfig?.email) : undefined

  const issuerName =
    sanitizeInlineText(pdfConfig?.nomeVendedor) ||
    sanitizeInlineText(user.name) ||
    sanitizeInlineText(user.username)

  const issuerMeta: string[] = []
  if (issuerName) issuerMeta.push(`Emitido por: ${issuerName}`)
  if (contactPhone) issuerMeta.push(contactPhone)
  if (contactEmail) issuerMeta.push(contactEmail)
  if (hasVisibleText(pdfConfig?.site)) issuerMeta.push(sanitizeInlineText(pdfConfig?.site))

  const signatureLocal = sanitizeInlineText(contrato.localAssinatura) || 'Local e data a definir'
  const signatureDate = contrato.dataAssinatura ? dateBr(contrato.dataAssinatura) : dateBr(new Date())

  const parties = Object.entries(contrato.dadosPartes || {})
    .filter(([, party]) => hasVisibleText(party?.nome))
    .map(([key, party]) => {
      const label = key === 'contratante' ? 'CONTRATANTE' : key === 'contratado' ? 'CONTRATADO' : key.toUpperCase()
      const fixedEntries = [
        ['Nome', party.nome],
        ['RG', party.rg],
        ['Documento', party.documento],
        ['Endereco', party.endereco],
        ['Cidade/UF', [party.cidade, party.estado].filter(Boolean).join(' / ')],
        ['CEP', party.cep],
        ['E-mail', party.email],
        ['Telefone', party.telefone],
      ]

      const fixedKeys = new Set(['nome', 'rg', 'documento', 'endereco', 'cidade', 'estado', 'cep', 'email', 'telefone'])
      const customEntries = Object.entries(party)
        .filter(([field, value]) => !fixedKeys.has(field) && hasVisibleText(value))
        .map(([field, value]) => [field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' '), value] as const)

      const lines = [...fixedEntries, ...customEntries]
        .filter(([, value]) => hasVisibleText(value))
        .map(([labelValue, value]) => `${labelValue}: ${sanitizeInlineText(value)}`)

      return { label, lines }
    })

  let proposalSections = [
    ...parseProposalSections(contrato.preambulo),
    ...parseProposalSections(contrato.observacoes),
  ]

  if (proposalSections.length === 0 && kind === 'proposta') {
    const fallback = parseTextBlocks([contrato.preambulo, contrato.observacoes].filter(Boolean).join('\n\n'))
    if (fallback.length > 0) {
      proposalSections = [{
        title: 'Resumo comercial',
        blocks: fallback,
      }]
    }
  }

  return {
    kind,
    documentLabel,
    numberLabel,
    title,
    createdAtLabel,
    clientLabel,
    companyName,
    contactEmail,
    contactPhone,
    issuerMeta,
    footerText: hasVisibleText(pdfConfig?.rodape) ? sanitizeInlineText(pdfConfig?.rodape) : undefined,
    signatureLine: '_________________________',
    localAndDateLabel: `${signatureLocal}, ${signatureDate}.`,
    logoSrc: hasVisibleText(pdfConfig?.logoBase64) ? sanitizeInlineText(pdfConfig?.logoBase64) : undefined,
    primaryHex: normalizeColor(pdfConfig?.corPrimaria),
    contractSections: {
      preambulo: parseTextBlocks(contrato.preambulo),
      parties,
      clauses: Array.isArray(contrato.clausulas)
        ? contrato.clausulas
            .filter((clause) => hasVisibleText(clause.titulo) || hasVisibleText(clause.conteudo))
            .map((clause) => ({
              titulo: sanitizeInlineText(clause.titulo) || 'Clausula',
              conteudo: sanitizeMultilineText(clause.conteudo),
            }))
        : [],
      observacoes: parseTextBlocks(contrato.observacoes),
    },
    proposalSections,
  }
}
