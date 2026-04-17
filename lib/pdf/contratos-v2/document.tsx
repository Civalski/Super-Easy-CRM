import React from 'react'
import { Document, Image, Page, Text, View } from '@react-pdf/renderer'
import type { PropostaComercialFields } from '@/components/features/contratos/utils'
import { parseProposalSections } from './mapper'
import { createDocumentStyles } from './styles'
import type { ContractPdfTheme } from './theme'
import type { ContractPdfViewModel, PdfTextBlock, PdfTopicSection } from './types'

const PAGE_SIZE: [number, number] = [595.28, 841.89]

type DocumentStyles = ReturnType<typeof createDocumentStyles>

interface ProposalPriceRow {
  label: string
  value: string
}

interface ProposalDescriptionSection {
  title: string
  paragraphs: string[]
}

interface ProposalLayoutData {
  descriptionSections: ProposalDescriptionSection[]
  priceRows: ProposalPriceRow[]
  priceHighlight: string
  additionalInfoLines: string[]
  validityLabel: string
}

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

function normalizeMultiline(value: string | null | undefined): string {
  if (!value) return ''
  return normalizeMojibake(value)
    .replace(/\\\\[nN]/g, '\n')
    .replace(/\\[nN]/g, '\n')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function normalizeInline(value: string | null | undefined): string {
  return normalizeMultiline(value)
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanMarkdownTitle(value: string): string {
  return value
    .replace(/^#{1,6}\s*/g, '')
    .replace(/\s+#{1,6}\s*/g, ' ')
    .trim()
}

function cleanDisplayText(value: string | null | undefined): string {
  return cleanMarkdownTitle(normalizeInline(value))
}

function containsKeyword(value: string, keywords: string[]): boolean {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  return keywords.some((keyword) => normalized.includes(keyword))
}

function isPricingLabel(label: string): boolean {
  return containsKeyword(label, [
    'valor',
    'investimento',
    'preco',
    'precos',
    'taxa',
    'pagamento',
    'mensal',
    'anual',
    'honorario',
    'meios',
  ])
}

function isAdditionalInfoLabel(label: string): boolean {
  return containsKeyword(label, [
    'opcional',
    'opcionais',
    'extra',
    'adicional',
    'validade',
    'garantia',
    'suporte',
    'prazo',
    'cronograma',
    'inicio',
    'entrega',
    'meios',
    'formas',
  ])
}

/** Secoes narrativas da proposta (apenas escopo / preambulo no PDF). */
function proposalDescriptionSectionsSource(model: ContractPdfViewModel): PdfTopicSection[] {
  if (model.proposalSections.length > 0) return model.proposalSections
  const fallback = model.contractSections.preambulo
  if (fallback.length === 0) return []
  return [{ title: 'Resumo da proposta', blocks: fallback }]
}

function hasProposalScalarCommercial(c: PropostaComercialFields): boolean {
  return Boolean(
    c.precoProjeto.trim() ||
      c.taxasExtras.trim() ||
      c.opcionais.trim() ||
      c.formaPagamento.trim() ||
      c.validadeProposta.trim(),
  )
}

function complementaresToAdditionalLines(extras: string): string[] {
  const t = normalizeMultiline(extras)
  if (!t) return []
  return t
    .split('\n')
    .map((l) => cleanDisplayText(l))
    .filter(Boolean)
    .slice(0, 24)
}

function sectionLines(section: PdfTopicSection): string[] {
  return section.blocks
    .map((block) => cleanDisplayText(block.text))
    .filter(Boolean)
}

function extractKeyValues(line: string): Array<{ label: string; value: string }> {
  const entries: Array<{ label: string; value: string }> = []
  const regex = /([^\n:]{3,50}):\s*([^:]+?)(?=(?:\s+[^\n:]{3,50}:)|$)/g
  let match: RegExpExecArray | null = regex.exec(line)
  while (match) {
    const label = cleanDisplayText(match[1] || '')
    const value = cleanDisplayText(match[2] || '')
    if (label && value) entries.push({ label, value })
    match = regex.exec(line)
  }
  return entries
}

function dedupeRows<T extends { label: string }>(rows: T[]): T[] {
  const seen = new Set<string>()
  return rows.filter((row) => {
    const key = row.label.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function keepMonetaryValue(value: string): string {
  const text = cleanDisplayText(value)
  if (!text) return ''

  const currencyMatch = text.match(/(?:R\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}|(?:R\$\s*)?\d+,\d{2}/)
  if (!currencyMatch) return text

  const normalized = currencyMatch[0].replace(/\s+/g, ' ').trim()
  return normalized.startsWith('R$') ? normalized : `R$ ${normalized}`
}

function buildDescriptionSectionsFromSections(sections: PdfTopicSection[]): ProposalDescriptionSection[] {
  const seenDescriptionSections = new Set<string>()

  return sections
    .map((section) => {
      const title = cleanDisplayText(section.title)
      const paragraphs = section.blocks
        .map((block) => {
          const text = cleanDisplayText(block.text)
          if (!text) return ''

          const keyValueEntries = extractKeyValues(text)
          if (
            keyValueEntries.length > 0 &&
            keyValueEntries.every((entry) => isPricingLabel(entry.label) || isAdditionalInfoLabel(entry.label))
          ) {
            return ''
          }

          return block.kind === 'bullet' ? `- ${text}` : text
        })
        .filter(Boolean)

      if (!title || paragraphs.length === 0) return null

      const dedupeKey = `${title.toLowerCase()}|${paragraphs.join(' ').toLowerCase()}`
      if (seenDescriptionSections.has(dedupeKey)) return null
      seenDescriptionSections.add(dedupeKey)

      return { title, paragraphs }
    })
    .filter((item): item is ProposalDescriptionSection => Boolean(item))
}

type CommercialLayoutSlice = Pick<
  ProposalLayoutData,
  'priceRows' | 'priceHighlight' | 'additionalInfoLines' | 'validityLabel'
>

function buildHeuristicCommercialFromSections(sections: PdfTopicSection[]): CommercialLayoutSlice {
  const allLines = sections.flatMap((section) => sectionLines(section))
  const keyValues = allLines.flatMap((line) => extractKeyValues(line))

  const priceRows = dedupeRows(
    keyValues
      .filter((entry) => isPricingLabel(entry.label) && !isAdditionalInfoLabel(entry.label))
      .map((entry) => ({ label: entry.label, value: keepMonetaryValue(entry.value) })),
  )

  const additionalInfoFromKeyValue = keyValues
    .filter((entry) => isAdditionalInfoLabel(entry.label))
    .map((entry) => `${entry.label}: ${entry.value}`)

  const additionalInfoFromSections = sections
    .filter((section) => isAdditionalInfoLabel(cleanDisplayText(section.title)))
    .flatMap((section) => sectionLines(section))

  const additionalInfoLines = [...additionalInfoFromKeyValue, ...additionalInfoFromSections]
    .map((item) => cleanDisplayText(item))
    .filter(Boolean)
    .slice(0, 12)
  const validityLabel =
    additionalInfoLines.find((line) => containsKeyword(line, ['validade da proposta', 'validade'])) || '-'

  const priceHighlight =
    priceRows.find((row) => containsKeyword(row.label, ['valor do projeto', 'investimento', 'total']))?.value ||
    priceRows[0]?.value ||
    ''

  return {
    priceRows,
    priceHighlight,
    additionalInfoLines,
    validityLabel,
  }
}

function buildStructuredCommercialFromFields(fields: PropostaComercialFields): CommercialLayoutSlice {
  const priceRows: ProposalPriceRow[] = []
  const preco = fields.precoProjeto.trim()
  if (preco) {
    const display = keepMonetaryValue(preco) || cleanDisplayText(preco)
    priceRows.push({ label: 'Valor do projeto', value: display })
  }
  if (fields.taxasExtras.trim()) {
    priceRows.push({ label: 'Taxa extra', value: cleanDisplayText(fields.taxasExtras) })
  }
  if (fields.opcionais.trim()) {
    priceRows.push({ label: 'Opcionais', value: cleanDisplayText(fields.opcionais) })
  }
  if (fields.formaPagamento.trim()) {
    priceRows.push({ label: 'Forma de pagamento', value: cleanDisplayText(fields.formaPagamento) })
  }

  const priceHighlight =
    (preco ? keepMonetaryValue(preco) || cleanDisplayText(preco) : '') ||
    priceRows.find((row) => row.label === 'Valor do projeto')?.value ||
    ''

  const additionalInfoLines = complementaresToAdditionalLines(fields.observacoesComplementares)

  let validityLabel = cleanDisplayText(fields.validadeProposta)
  if (!validityLabel) {
    validityLabel =
      additionalInfoLines.find((line) => containsKeyword(line, ['validade da proposta', 'validade'])) || '-'
  }
  if (!validityLabel) validityLabel = '-'

  return {
    priceRows,
    priceHighlight,
    additionalInfoLines,
    validityLabel,
  }
}

function buildProposalLayoutData(model: ContractPdfViewModel): ProposalLayoutData {
  const descriptionSections = buildDescriptionSectionsFromSections(proposalDescriptionSectionsSource(model))
  const commercial = model.proposalCommercial

  const useStructured =
    commercial &&
    (hasProposalScalarCommercial(commercial) || commercial.observacoesComplementares.trim())

  const commercialSlice: CommercialLayoutSlice =
    useStructured && commercial
      ? buildStructuredCommercialFromFields(commercial)
      : buildHeuristicCommercialFromSections([
          ...model.proposalSections,
          ...parseProposalSections(model.proposalObservacoesRaw ?? ''),
        ])

  return {
    descriptionSections,
    ...commercialSlice,
  }
}

function renderTextBlocks(blocks: PdfTextBlock[], styles: DocumentStyles) {
  return blocks.map((block, index) => {
    const text = cleanDisplayText(block.text)
    if (!text) return null

    if (block.kind === 'heading') {
      return (
        <Text key={`heading-${index}`} style={styles.heading}>
          {text}
        </Text>
      )
    }

    if (block.kind === 'bullet') {
      const isNumbered = /^\d+[.)]\s+/.test(text)
      return (
        <View key={`bullet-${index}`} style={styles.bulletLine}>
          <Text style={styles.bulletDot}>{isNumbered ? '' : '*'}</Text>
          <Text style={styles.bulletText}>{text}</Text>
        </View>
      )
    }

    return (
      <Text key={`paragraph-${index}`} style={styles.paragraph} orphans={3} widows={2}>
        {text}
      </Text>
    )
  })
}

function ProposalHeader({
  styles,
  model,
}: {
  styles: DocumentStyles
  model: ContractPdfViewModel
}) {
  const headerRight = cleanDisplayText(model.clientLabel)
  const headerRightText = headerRight ? `${headerRight} - ${model.numberLabel}` : model.numberLabel

  return (
    <View>
      <View style={styles.proposalTopBand}>
        <View style={styles.proposalTopBandLeft}>
          {model.logoSrc ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={model.logoSrc} style={styles.proposalHeaderLogo} />
          ) : null}
        </View>
        <Text style={styles.proposalTopRight}>{headerRightText}</Text>
      </View>
      <View style={styles.proposalTopAccent} />
    </View>
  )
}

function ProposalFooter({
  styles,
  footerMetaText,
}: {
  styles: DocumentStyles
  footerMetaText: string
}) {
  return (
    <View fixed>
      <View style={styles.proposalFooterAccent} />
      <View style={styles.proposalFooterBar}>
        <Text style={styles.proposalFooterLeft}>{footerMetaText}</Text>
        <Text
          style={styles.proposalFooterRight}
          render={({ pageNumber, totalPages }) => `Pag. ${pageNumber} / ${totalPages}`}
        />
      </View>
    </View>
  )
}

function ProposalDocument({
  model,
  styles,
}: {
  model: ContractPdfViewModel
  styles: DocumentStyles
}) {
  const data = buildProposalLayoutData(model)
  const hasCommercialDetails = data.priceRows.length > 0 || data.additionalInfoLines.length > 0
  const clientLabel = cleanDisplayText(model.clientLabel)
  const rawCompanyName = cleanDisplayText(model.companyName)
  const displayCompanyName =
    rawCompanyName && !containsKeyword(rawCompanyName, ['proposta', 'contrato']) ? rawCompanyName : '-'
  const footerMetaText = [
    `Emissao: ${cleanDisplayText(model.createdAtLabel) || '-'}`,
    `Validade: ${data.validityLabel}`,
    `Empresa: ${displayCompanyName}`,
    `Email: ${cleanDisplayText(model.contactEmail) || '-'}`,
    `Telefone: ${cleanDisplayText(model.contactPhone) || '-'}`,
  ].join(' | ')

  return (
    <>
      <Page size={PAGE_SIZE} style={styles.proposalPage}>
        <ProposalHeader styles={styles} model={model} />
        <View style={styles.proposalBody}>
          <View style={styles.coverTitleWrap}>
            {displayCompanyName !== '-' ? <Text style={styles.coverCompany}>{displayCompanyName}</Text> : null}
            <Text style={styles.coverMainTitle}>{model.title}</Text>
            {clientLabel ? <Text style={styles.coverSubtitle}>{clientLabel}</Text> : null}
          </View>

          {data.descriptionSections.length > 0 ? (
            <View style={styles.summaryBox}>
              {data.descriptionSections.map((section, sectionIndex) => (
                <View key={`description-section-${sectionIndex}`} style={styles.proposalTopicSection}>
                  <Text style={styles.proposalTopicTitle}>{section.title}</Text>
                  {section.paragraphs.map((paragraph, paragraphIndex) => (
                    <Text key={`description-${sectionIndex}-${paragraphIndex}`} style={styles.proposalParagraph}>
                      {paragraph}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          ) : null}
        </View>
        <ProposalFooter styles={styles} footerMetaText={footerMetaText} />
      </Page>

      {hasCommercialDetails ? (
        <Page size={PAGE_SIZE} style={styles.proposalPage}>
          <ProposalHeader styles={styles} model={model} />
          <View style={styles.proposalBody}>
            {data.priceHighlight ? (
              <View style={styles.priceHighlightBox}>
                <Text style={styles.priceHighlightLabel}>Valor principal</Text>
                <Text style={styles.priceHighlightValue}>{data.priceHighlight}</Text>
              </View>
            ) : null}

            {data.priceRows.length > 0 ? (
              <View style={styles.priceTable}>
                <View style={styles.priceTableHeader}>
                  <Text style={styles.priceTableHeaderColA}>Item</Text>
                  <Text style={styles.priceTableHeaderColB}>Valor</Text>
                </View>
                {data.priceRows.map((row, index) => (
                  <View key={`price-row-${index}`} style={styles.priceTableRow}>
                    <Text style={styles.priceTableColA}>{row.label}</Text>
                    <Text style={styles.priceTableColB}>{row.value}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {data.additionalInfoLines.length > 0 ? (
              <View style={styles.scopeCard}>
                <Text style={styles.sectionBoxTitle}>Informacoes adicionais</Text>
                {data.additionalInfoLines.map((line, index) => (
                  <View key={`additional-info-${index}`} style={styles.proposalBulletLine}>
                    <Text style={styles.proposalBulletDot}>*</Text>
                    <Text style={styles.proposalBulletText}>{line}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
          <ProposalFooter styles={styles} footerMetaText={footerMetaText} />
        </Page>
      ) : null}
    </>
  )
}

function ContractContent({ model, styles }: { model: ContractPdfViewModel; styles: DocumentStyles }) {
  return (
    <>
      {model.contractSections.preambulo.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preambulo</Text>
          <View style={styles.cardBody}>{renderTextBlocks(model.contractSections.preambulo, styles)}</View>
        </View>
      )}

      {model.contractSections.parties.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dados das partes</Text>
          <View style={styles.cardBody}>
            {model.contractSections.parties.map((party, index) => (
              <View key={`party-${index}`} style={{ marginBottom: 6 }} minPresenceAhead={38}>
                <Text style={styles.partyTitle}>{party.label}</Text>
                {party.lines.map((line, lineIndex) => (
                  <Text key={`party-line-${index}-${lineIndex}`} style={styles.paragraph}>
                    {cleanDisplayText(line)}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </View>
      )}

      {model.contractSections.clauses.map((clause, index) => (
        <View key={`clause-${index}`} style={styles.card} minPresenceAhead={80}>
          <Text style={styles.cardTitle}>{`${index + 1}. ${cleanDisplayText(clause.titulo) || 'Clausula'}`}</Text>
          <View style={styles.cardBody}>
            {renderTextBlocks([{ kind: 'paragraph', text: cleanDisplayText(clause.conteudo) }], styles)}
          </View>
        </View>
      ))}

      {model.contractSections.observacoes.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Observacoes</Text>
          <View style={styles.cardBody}>{renderTextBlocks(model.contractSections.observacoes, styles)}</View>
        </View>
      )}

      <View style={styles.card} wrap={false}>
        <Text style={styles.cardTitle}>Assinaturas</Text>
        <View style={styles.cardBody}>
          <Text>{cleanDisplayText(model.localAndDateLabel)}</Text>
          <View style={styles.signRow}>
            <View style={styles.signCol}>
              <Text style={styles.signLine}>{model.signatureLine}</Text>
            </View>
            <View style={styles.signCol}>
              <Text style={styles.signLine}>{model.signatureLine}</Text>
            </View>
          </View>
        </View>
      </View>
    </>
  )
}

export function ContractPdfDocument({ model, theme }: { model: ContractPdfViewModel; theme: ContractPdfTheme }) {
  const styles = createDocumentStyles(theme)
  const clientLabel = cleanDisplayText(model.clientLabel)
  const contractFooterMeta = [
    `Emissao: ${cleanDisplayText(model.createdAtLabel) || '-'}`,
    ...model.issuerMeta.map((meta) => cleanDisplayText(meta)).filter(Boolean),
    cleanDisplayText(model.footerText),
  ]
    .filter(Boolean)
    .join(' | ')

  if (model.kind === 'proposta') {
    return (
      <Document>
        <ProposalDocument model={model} styles={styles} />
      </Document>
    )
  }

  return (
    <Document>
      <Page size={PAGE_SIZE} style={styles.page} wrap>
        <View style={styles.headerWrap} fixed>
          <View>
            {model.logoSrc ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={model.logoSrc} style={styles.brandLogo} />
            ) : (
              <Text style={styles.brandName}>{cleanDisplayText(model.companyName)}</Text>
            )}
          </View>
          <View>
            <Text style={styles.documentType}>{cleanDisplayText(model.documentLabel)}</Text>
            <Text style={styles.documentNumber}>{cleanDisplayText(model.numberLabel)}</Text>
          </View>
        </View>
        <View style={styles.headerContentGap} fixed />

        <View style={styles.card} wrap={false}>
          <Text style={styles.cardTitle}>Resumo do documento</Text>
          <View style={styles.cardBody}>
            <Text style={styles.docTitle}>{cleanDisplayText(model.title)}</Text>
          </View>
        </View>

        <ContractContent model={model} styles={styles} />

        <View style={styles.footerWrap} fixed>
          <Text style={styles.footerLeft}>
            {contractFooterMeta || cleanDisplayText(model.footerText || 'Documento emitido pelo Arker CRM')}
          </Text>
          <Text
            style={styles.footerRight}
            render={({ pageNumber, totalPages }) => `Pag. ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
