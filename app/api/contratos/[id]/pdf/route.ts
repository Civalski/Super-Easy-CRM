import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFImage } from 'pdf-lib'
import { prisma, ensureDatabaseInitialized } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import {
  buildPdfCacheControl,
  buildPdfCacheKey,
  createPdfEtag,
  getCachedPdfBuffer,
  setCachedPdfBuffer,
} from '@/lib/api/pdf-cache'

export const dynamic = 'force-dynamic'
const PDF_RENDER_VERSION = 'proposal-v7'

const PAGE = {
  width: 595.28,
  height: 841.89,
  marginX: 50,
  marginTop: 50,
  marginBottom: 60,
}

const CONTENT_WIDTH = PAGE.width - PAGE.marginX * 2

const FS = {
  title: 14,
  section: 10.5,
  label: 9,
  text: 9.5,
  small: 8.5,
}

function hexToRgb(hex: string | null | undefined, fallback: ReturnType<typeof rgb>) {
  if (!hex) return fallback
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return fallback
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  if (isNaN(r) || isNaN(g) || isNaN(b)) return fallback
  return rgb(r, g, b)
}

function lerpColor(
  c1: ReturnType<typeof rgb>,
  c2: ReturnType<typeof rgb>,
  t: number
): ReturnType<typeof rgb> {
  return rgb(
    Math.min(1, Math.max(0, c1.red + (c2.red - c1.red) * t)),
    Math.min(1, Math.max(0, c1.green + (c2.green - c1.green) * t)),
    Math.min(1, Math.max(0, c1.blue + (c2.blue - c1.blue) * t))
  )
}

function dateBr(v?: Date | string | null) {
  if (!v) return '-'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function sanitizePdfInlineText(text: string | null | undefined): string {
  if (!text) return ''

  return text
    .normalize('NFKC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncateToWidth(text: string, f: PDFFont, size: number, maxW: number): string {
  if (f.widthOfTextAtSize(text, size) <= maxW) return text
  let t = text
  while (t.length > 0 && f.widthOfTextAtSize(t + '...', size) > maxW) t = t.slice(0, -1)
  return `${t}...`
}

async function embedLogo(pdfDoc: PDFDocument, logoBase64: string): Promise<PDFImage | null> {
  try {
    const base64Data = logoBase64.replace(/^data:image\/[\w+]+;base64,/, '')
    const bytes = Buffer.from(base64Data, 'base64')
    if (logoBase64.includes('data:image/png')) return await pdfDoc.embedPng(bytes)
    return await pdfDoc.embedJpg(bytes)
  } catch {
    return null
  }
}

function sanitizePdfMultilineText(text: string | null | undefined): string {
  if (!text) return ''

  return text
    .normalize('NFKC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
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

function splitSingleLineIntoBlocks(text: string): string[] {
  if (!text.includes(' - ') && !text.includes(' • ') && !/\d+[.)]\s+[A-Z]/.test(text)) {
    return [text]
  }

  return text
    .replace(/\s+•\s+/g, '\n• ')
    .replace(/\s+-\s+(?=[A-Z0-9])/g, '\n- ')
    .replace(/\s+(\d+[.)]\s+)/g, '\n$1')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

type TextBlock = {
  kind: 'heading' | 'paragraph' | 'bullet'
  text: string
}

type TopicSection = {
  title: string
  blocks: TextBlock[]
}

function parseTextBlocks(text: string | null | undefined): TextBlock[] {
  const normalized = sanitizePdfMultilineText(text)
  if (!normalized) return []

  const rawLines = normalized.includes('\n') ? normalized.split('\n') : splitSingleLineIntoBlocks(normalized)
  const blocks: TextBlock[] = []
  let paragraphBuffer: string[] = []

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return
    blocks.push({ kind: 'paragraph', text: paragraphBuffer.join(' ') })
    paragraphBuffer = []
  }

  for (const rawLine of rawLines) {
    const line = sanitizePdfInlineText(rawLine)
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

    if (/^[A-Z0-9][A-Z0-9\s]{3,}:$/.test(line)) {
      flushParagraph()
      blocks.push({ kind: 'heading', text: line.replace(/:$/, '').trim() })
      continue
    }

    if (/^[^:]{2,80}:$/.test(line)) {
      flushParagraph()
      blocks.push({ kind: 'heading', text: line.replace(/:$/, '').trim() })
      continue
    }

    const bullet = line.match(/^[-*•]\s+(.+)$/)
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

    paragraphBuffer.push(line)
  }

  flushParagraph()
  return blocks
}

function parseProposalSections(text: string | null | undefined): TopicSection[] {
  const normalized = sanitizePdfMultilineText(text)
  if (!normalized) return []

  const sections: TopicSection[] = []
  const lines = normalized.split('\n')
  let currentTitle = ''
  let currentBuffer: string[] = []

  const flushCurrent = () => {
    const title = sanitizePdfInlineText(currentTitle)
    if (!title) {
      currentBuffer = []
      return
    }

    const contentText = sanitizePdfMultilineText(currentBuffer.join('\n'))
    if (!contentText) {
      currentBuffer = []
      return
    }

    const contentBlocks = parseTextBlocks(contentText).filter(
      (block) => block.kind !== 'heading' && hasVisibleText(block.text)
    )
    if (!hasRenderableBlocks(contentBlocks)) {
      currentBuffer = []
      return
    }

    sections.push({
      title,
      blocks: contentBlocks,
    })
    currentBuffer = []
  }

  for (const rawLine of lines) {
    const line = sanitizePdfInlineText(rawLine)
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

function hasVisibleText(value: string | null | undefined): boolean {
  const text = sanitizePdfInlineText(value)
  if (!text) return false

  const normalized = normalizeSearchKey(text)
    .replace(/[\[\]()]/g, '')
    .trim()

  if (!normalized) return false
  if (['-', '--', 'n/a', 'na', 'preencher', 'a preencher', 'pendente'].includes(normalized)) {
    return false
  }
  if (normalized.startsWith('preencher')) return false
  if (normalized.startsWith('a definir')) return false
  if (normalized.includes('nao informado')) return false
  if (normalized.includes('nao se aplica')) return false
  return true
}

function hasRenderableBlocks(blocks: TextBlock[]): boolean {
  return blocks.some((block) => block.kind !== 'heading' && hasVisibleText(block.text))
}

function filterRenderableSections(sections: TopicSection[]): TopicSection[] {
  return sections
    .map((section) => ({
      title: sanitizePdfInlineText(section.title),
      blocks: section.blocks.filter((block) => hasVisibleText(block.text)),
    }))
    .filter((section) => section.title && hasRenderableBlocks(section.blocks))
}

function wrapText(text: string, f: PDFFont, size: number, maxW: number): string[] {
  const safeText = sanitizePdfInlineText(text)
  if (!safeText) return []
  const words = safeText.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (f.widthOfTextAtSize(next, size) > maxW && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines
}

function getTextBlocksHeight(blocks: TextBlock[], maxW: number, font: PDFFont, fontBold: PDFFont): number {
  let totalHeight = 0

  for (const block of blocks) {
    if (block.kind === 'heading') {
      const headingLines = wrapText(block.text.toUpperCase(), fontBold, FS.text, maxW)
      totalHeight += headingLines.length * 12 + 4
      continue
    }

    if (block.kind === 'bullet') {
      const bulletIndent = 12
      const bulletLines = wrapText(block.text, font, FS.text, maxW - bulletIndent)
      totalHeight += bulletLines.length * 12 + 2
      continue
    }

    const lines = wrapText(block.text, font, FS.text, maxW)
    totalHeight += lines.length * 12 + 4
  }

  return totalHeight
}

async function embedFonts(pdfDoc: PDFDocument) {
  return {
    font: await pdfDoc.embedFont(StandardFonts.Helvetica),
    fontBold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  }
}

interface Clausula {
  titulo: string
  conteudo: string
}

interface DadosParte {
  nome?: string
  rg?: string
  documento?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  email?: string
  telefone?: string
  [key: string]: string | undefined
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contratoId } = await params
  const { searchParams } = new URL(request.url)
  const preview = searchParams.get('preview') === '1'

  return withAuth(request, async (userId) => {
    try {
      await ensureDatabaseInitialized()

      const [contrato, user, pdfConfig] = await Promise.all([
        prisma.contrato.findFirst({
          where: { id: contratoId, userId },
          include: {
            cliente: {
              select: {
                nome: true,
                documento: true,
                email: true,
                telefone: true,
                endereco: true,
                cidade: true,
                estado: true,
                cep: true,
                empresa: true,
              },
            },
          },
        }),
        prisma.user.findUnique({ where: { id: userId }, select: { name: true, username: true } }),
        prisma.pdfConfig.findUnique({ where: { userId } }),
      ])

      if (!contrato) {
        return NextResponse.json({ error: 'Contrato nao encontrado' }, { status: 404 })
      }

      const isProposta = contrato.tipo === 'proposta'
      const documentLabel = isProposta ? 'Proposta' : 'Contrato'
      const docNum = String(contrato.numero).padStart(5, '0')
      const dayKey = new Date().toISOString().slice(0, 10)
      const cacheKey = buildPdfCacheKey([
        'contrato-pdf',
        PDF_RENDER_VERSION,
        userId,
        contrato.id,
        contrato.updatedAt?.getTime(),
        pdfConfig?.updatedAt?.getTime(),
        dayKey,
      ])
      const etag = createPdfEtag(cacheKey)
      const cacheControl = buildPdfCacheControl()
      const ifNoneMatch = request.headers.get('if-none-match')
      const disposition = preview ? 'inline' : 'attachment'

      const cached = getCachedPdfBuffer(cacheKey)
      if (cached) {
        if (ifNoneMatch === cached.etag) {
          return new NextResponse(null, {
            status: 304,
            headers: {
              ETag: cached.etag,
              'Cache-Control': cacheControl,
            },
          })
        }

        return new NextResponse(cached.blob, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `${disposition}; filename="${documentLabel} ${docNum}.pdf"`,
            'Cache-Control': cacheControl,
            ETag: cached.etag,
          },
        })
      }

      const pdfDoc = await PDFDocument.create()
      const { font, fontBold } = await embedFonts(pdfDoc)

      const PRIMARY_DEFAULT = rgb(0.07, 0.18, 0.4)
      const primary = hexToRgb(pdfConfig?.corPrimaria, PRIMARY_DEFAULT)

      const C = {
        primary,
        headerEnd: lerpColor(primary, rgb(1, 1, 1), 0.22),
        sectionBg: lerpColor(primary, rgb(1, 1, 1), 0.92),
        cardBg: lerpColor(primary, rgb(1, 1, 1), 0.95),
        textDark: rgb(0.1, 0.1, 0.15),
        textMuted: rgb(0.4, 0.4, 0.5),
        border: rgb(0.75, 0.78, 0.85),
        footerBg: rgb(0.94, 0.95, 0.97),
        white: rgb(1, 1, 1),
      }
      const logoImage = pdfConfig?.logoBase64 ? await embedLogo(pdfDoc, pdfConfig.logoBase64) : null

      const clausulas = (contrato.clausulas as unknown as Clausula[]) ?? []
      const dadosPartes = (contrato.dadosPartes as Record<string, DadosParte>) ?? {}

      let page = pdfDoc.addPage([PAGE.width, PAGE.height])
      let y = PAGE.height - PAGE.marginTop

      const newPage = () => {
        page = pdfDoc.addPage([PAGE.width, PAGE.height])
        y = PAGE.height - PAGE.marginTop
      }
      const ensure = (h: number) => {
        if (y - h < PAGE.marginBottom) newPage()
      }
      const drawSectionLabel = (label: string) => {
        const labelH = 16
        ensure(labelH + 8)
        page.drawRectangle({
          x: PAGE.marginX,
          y: y - labelH,
          width: CONTENT_WIDTH,
          height: labelH,
          color: C.sectionBg,
          borderColor: C.border,
          borderWidth: 0.5,
        })
        page.drawText(label, {
          x: PAGE.marginX + 8,
          y: y - 12,
          size: FS.label,
          font: fontBold,
          color: C.primary,
        })
        y -= labelH + 8
      }

      const drawTextBlocks = (blocks: TextBlock[], x: number, maxW: number) => {
        for (const block of blocks) {
          if (block.kind === 'heading') {
            const headingLines = wrapText(block.text.toUpperCase(), fontBold, FS.text, maxW)
            ensure(headingLines.length * 12 + 6)
            for (const line of headingLines) {
              if (y < PAGE.marginBottom + 14) newPage()
              page.drawText(line, { x, y, size: FS.text, font: fontBold, color: C.textDark })
              y -= 12
            }
            y -= 4
            continue
          }

          if (block.kind === 'bullet') {
            const isNumbered = /^\d+[.)]\s+/.test(block.text)
            const bulletIndent = 12
            const bulletLines = wrapText(block.text, font, FS.text, maxW - bulletIndent)
            if (bulletLines.length === 0) continue
            ensure(bulletLines.length * 12 + 4)

            if (!isNumbered) {
              page.drawText('•', { x, y, size: FS.text, font: fontBold, color: C.textDark })
            }

            for (let index = 0; index < bulletLines.length; index += 1) {
              if (y < PAGE.marginBottom + 14) newPage()
              const lineX = isNumbered ? x : x + bulletIndent
              page.drawText(bulletLines[index], { x: lineX, y, size: FS.text, font, color: C.textDark })
              y -= 12
            }
            y -= 2
            continue
          }

          const lines = wrapText(block.text, font, FS.text, maxW)
          if (lines.length === 0) continue
          ensure(lines.length * 12 + 6)
          for (const line of lines) {
            if (y < PAGE.marginBottom + 14) newPage()
            page.drawText(line, { x, y, size: FS.text, font, color: C.textDark })
            y -= 12
          }
          y -= 4
        }
      }

      const drawTopicCard = (title: string, blocks: TextBlock[]) => {
        if (blocks.length === 0) return

        const innerPaddingX = 10
        const headerPaddingTop = 8
        const headerPaddingBottom = 8
        const bodyStartGap = 10
        const bottomPadding = 12
        const cardInnerW = CONTENT_WIDTH - innerPaddingX * 2
        const titleLines = wrapText(title.toUpperCase(), fontBold, FS.label, cardInnerW)
        const titleAreaH = headerPaddingTop + headerPaddingBottom + titleLines.length * 12
        const bodyHeight = getTextBlocksHeight(blocks, cardInnerW, font, fontBold)
        const cardH = titleAreaH + bodyStartGap + bodyHeight + bottomPadding
        const maxCardH = PAGE.height - PAGE.marginTop - PAGE.marginBottom - 10

        if (cardH > maxCardH) {
          drawSectionLabel(title.toUpperCase())
          drawTextBlocks(blocks, PAGE.marginX, CONTENT_WIDTH)
          y -= 6
          return
        }

        ensure(cardH + 6)
        const cardTopY = y
        page.drawRectangle({
          x: PAGE.marginX,
          y: cardTopY - cardH,
          width: CONTENT_WIDTH,
          height: cardH,
          color: C.cardBg,
          borderColor: C.border,
          borderWidth: 0.6,
        })
        page.drawRectangle({
          x: PAGE.marginX,
          y: cardTopY - titleAreaH,
          width: CONTENT_WIDTH,
          height: titleAreaH,
          color: C.sectionBg,
          borderColor: C.border,
          borderWidth: 0.5,
        })

        let titleY = cardTopY - headerPaddingTop - 9
        for (const line of titleLines) {
          const lineWidth = fontBold.widthOfTextAtSize(line, FS.label)
          const minTitleX = PAGE.marginX + innerPaddingX
          const maxTitleX = PAGE.marginX + CONTENT_WIDTH - innerPaddingX - lineWidth
          const centeredTitleX = PAGE.marginX + (CONTENT_WIDTH - lineWidth) / 2
          const titleX = Math.max(minTitleX, Math.min(maxTitleX, centeredTitleX))
          page.drawText(line, {
            x: titleX,
            y: titleY,
            size: FS.label,
            font: fontBold,
            color: C.primary,
          })
          titleY -= 12
        }

        y = cardTopY - titleAreaH - bodyStartGap
        drawTextBlocks(blocks, PAGE.marginX + innerPaddingX, cardInnerW)
        y = cardTopY - cardH - 8
      }

      const HEADER_H = 82
      const GRAD_STEPS = 36
      for (let index = 0; index < GRAD_STEPS; index += 1) {
        const t = index / (GRAD_STEPS - 1)
        const stepColor = lerpColor(C.primary, C.headerEnd, t)
        page.drawRectangle({
          x: (index / GRAD_STEPS) * PAGE.width,
          y: PAGE.height - HEADER_H,
          width: PAGE.width / GRAD_STEPS + 1,
          height: HEADER_H,
          color: stepColor,
        })
      }

      let headerLeftLimit = PAGE.marginX
      if (logoImage) {
        const maxLogoHeight = HEADER_H - 20
        const maxLogoWidth = 120
        const dims = logoImage.size()
        const scale = Math.min(maxLogoHeight / dims.height, maxLogoWidth / dims.width)
        const logoWidth = dims.width * scale
        const logoHeight = dims.height * scale
        const logoX = PAGE.marginX
        const logoY = PAGE.height - HEADER_H + (HEADER_H - logoHeight) / 2
        page.drawImage(logoImage, { x: logoX, y: logoY, width: logoWidth, height: logoHeight })
        headerLeftLimit = logoX + logoWidth + 16
      }

      const maxHeaderTextWidth = Math.max(120, PAGE.width - PAGE.marginX - headerLeftLimit)
      const documentKindLabel = isProposta ? 'PROPOSTA' : 'CONTRATO'
      const documentNumberLabel = `#${docNum}`
      const kindSize = FS.label + 1
      const numberSize = FS.title + 6
      const documentKindSafe = truncateToWidth(documentKindLabel, fontBold, kindSize, maxHeaderTextWidth)
      const kindWidth = fontBold.widthOfTextAtSize(documentKindSafe, kindSize)
      const numberWidth = fontBold.widthOfTextAtSize(documentNumberLabel, numberSize)
      page.drawText(documentKindSafe, {
        x: PAGE.width - PAGE.marginX - kindWidth,
        y: PAGE.height - 36,
        size: kindSize,
        font: fontBold,
        color: C.white,
      })
      page.drawText(documentNumberLabel, {
        x: PAGE.width - PAGE.marginX - numberWidth,
        y: PAGE.height - 60,
        size: numberSize,
        font: fontBold,
        color: C.white,
      })

      const emitente = sanitizePdfInlineText(pdfConfig?.nomeVendedor) || sanitizePdfInlineText(user?.name || user?.username)
      const metaParts: string[] = []
      metaParts.push(`Emissao: ${dateBr(contrato.createdAt)}`)
      if (emitente) metaParts.push(`Emitido por: ${emitente}`)
      if (pdfConfig?.telefone) metaParts.push(pdfConfig.telefone)
      if (pdfConfig?.email) metaParts.push(pdfConfig.email)
      if (pdfConfig?.site) metaParts.push(pdfConfig.site)
      const contractMetaText = !isProposta && metaParts.length > 0 ? metaParts.join('   •   ') : ''

      y = PAGE.height - HEADER_H - 22

      const titleText = sanitizePdfInlineText(contrato.titulo) || documentLabel.toUpperCase()
      const titleLines = wrapText(titleText.toUpperCase(), fontBold, FS.section + 0.5, CONTENT_WIDTH - 16)
      const titleBoxH = 10 + titleLines.length * 12 + 8
      ensure(titleBoxH + 4)
      page.drawRectangle({
        x: PAGE.marginX,
        y: y - titleBoxH,
        width: CONTENT_WIDTH,
        height: titleBoxH,
        color: C.cardBg,
        borderColor: C.border,
        borderWidth: 0.5,
      })
      let titleY = y - 16
      for (const line of titleLines) {
        page.drawText(line, {
          x: PAGE.marginX + 8,
          y: titleY,
          size: FS.section + 0.5,
          font: fontBold,
          color: C.textDark,
        })
        titleY -= 12
      }
      y = y - titleBoxH - 12

      if (isProposta) {
        const proposalSections = filterRenderableSections([
          ...parseProposalSections(contrato.preambulo),
          ...parseProposalSections(contrato.observacoes),
        ])

        if (proposalSections.length > 0) {
          for (const section of proposalSections) {
            drawTopicCard(section.title, section.blocks)
          }
          y -= 8
        } else {
          const fallbackBlocks = parseTextBlocks([contrato.preambulo, contrato.observacoes].filter(Boolean).join('\n\n')).filter(
            (block) => block.kind !== 'heading' && hasVisibleText(block.text)
          )
          if (hasRenderableBlocks(fallbackBlocks)) {
            drawTextBlocks(fallbackBlocks, PAGE.marginX, CONTENT_WIDTH)
            y -= 6
          }
        }
      } else if (contrato.preambulo) {
        const preambuloBlocks = parseTextBlocks(contrato.preambulo)
        if (hasRenderableBlocks(preambuloBlocks)) {
          drawSectionLabel('PREAMBULO')
          drawTextBlocks(preambuloBlocks, PAGE.marginX, CONTENT_WIDTH)
          y -= 6
        }
      }

      const partesKeys = Object.keys(dadosPartes).filter((k) => dadosPartes[k]?.nome)
      if (!isProposta && partesKeys.length > 0) {
        ensure(60)
        drawSectionLabel('DADOS DAS PARTES')

        for (const key of partesKeys) {
          const parte = dadosPartes[key] as DadosParte
          const label = key === 'contratante' ? 'CONTRATANTE' : key === 'contratado' ? 'CONTRATADO' : key.toUpperCase()
          ensure(16)
          page.drawText(`${label}:`, {
            x: PAGE.marginX,
            y,
            size: FS.label,
            font: fontBold,
            color: C.textMuted,
          })
          y -= 11

          const FIXED_FIELDS = ['nome', 'rg', 'documento', 'endereco', 'cidade', 'estado', 'cep', 'email', 'telefone']
          const fields: { label: string; value?: string }[] = [
            { label: 'Nome', value: parte.nome },
            { label: 'RG', value: parte.rg },
            { label: 'Documento', value: parte.documento },
            { label: 'Endereco', value: parte.endereco },
            { label: 'Cidade/UF', value: [parte.cidade, parte.estado].filter(Boolean).join(' / ') },
            { label: 'CEP', value: parte.cep },
            { label: 'E-mail', value: parte.email },
            { label: 'Telefone', value: parte.telefone },
          ]

          for (const [k, v] of Object.entries(parte)) {
            if (FIXED_FIELDS.includes(k) || !v || typeof v !== 'string') continue
            fields.push({ label: k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '), value: v })
          }

          for (const { label: fieldLabel, value } of fields) {
            if (!value) continue
            const line = `${fieldLabel}: ${value}`
            const lines = wrapText(line, font, FS.small, CONTENT_WIDTH - 10)
            ensure(lines.length * 10 + 2)
            for (const ln of lines) {
              if (y < PAGE.marginBottom + 14) newPage()
              page.drawText(ln, { x: PAGE.marginX + 8, y, size: FS.small, font, color: C.textDark })
              y -= 10
            }
          }
          y -= 6
        }
        y -= 4
      }

      if (!isProposta && clausulas.length > 0) {
        drawSectionLabel('CLAUSULAS')

        for (let i = 0; i < clausulas.length; i++) {
          const clausula = clausulas[i]
          const tituloClausula = `${i + 1}. ${sanitizePdfInlineText(clausula.titulo)}`
          const tituloLines = wrapText(tituloClausula, fontBold, FS.text, CONTENT_WIDTH)
          ensure(tituloLines.length * 12 + 4)
          for (const line of tituloLines) {
            if (y < PAGE.marginBottom + 14) newPage()
            page.drawText(line, { x: PAGE.marginX, y, size: FS.text, font: fontBold, color: C.textDark })
            y -= 12
          }

          const conteudoBlocks = parseTextBlocks(clausula.conteudo)
          drawTextBlocks(conteudoBlocks, PAGE.marginX, CONTENT_WIDTH)
          y -= 4
        }
      }

      if (!isProposta && contrato.observacoes) {
        drawSectionLabel('OBSERVACOES')
        drawTextBlocks(parseTextBlocks(contrato.observacoes), PAGE.marginX, CONTENT_WIDTH)
        y -= 6
      }

      if (!isProposta) {
        y -= 12
        ensure(80)

        page.drawRectangle({
          x: PAGE.marginX,
          y: y - 70,
          width: CONTENT_WIDTH,
          height: 70,
          borderColor: C.border,
          borderWidth: 0.5,
        })

        const localStr = sanitizePdfInlineText(contrato.localAssinatura) || 'Local e data a definir'
        const dataStr = contrato.dataAssinatura ? dateBr(contrato.dataAssinatura) : dateBr(new Date())

        page.drawText('Assinaturas:', {
          x: PAGE.marginX + 8,
          y: y - 14,
          size: FS.label,
          font: fontBold,
          color: C.textMuted,
        })
        page.drawText(sanitizePdfInlineText(`${localStr}, ${dataStr}.`), {
          x: PAGE.marginX + 8,
          y: y - 28,
          size: FS.small,
          font,
          color: C.textDark,
        })

        const assinatura1Y = y - 48
        page.drawLine({
          start: { x: PAGE.marginX + 8, y: assinatura1Y },
          end: { x: PAGE.marginX + 180, y: assinatura1Y },
          thickness: 0.5,
          color: C.border,
        })
        page.drawText('_________________________', {
          x: PAGE.marginX + 8,
          y: assinatura1Y - 14,
          size: FS.small,
          font,
          color: C.textMuted,
        })

        const assinatura2X = PAGE.marginX + CONTENT_WIDTH / 2 + 20
        page.drawLine({
          start: { x: assinatura2X, y: assinatura1Y },
          end: { x: PAGE.width - PAGE.marginX - 8, y: assinatura1Y },
          thickness: 0.5,
          color: C.border,
        })
        page.drawText('_________________________', {
          x: assinatura2X,
          y: assinatura1Y - 14,
          size: FS.small,
          font,
          color: C.textMuted,
        })
      }

      const totalPages = pdfDoc.getPageCount()
      for (let i = 0; i < totalPages; i++) {
        const pg = pdfDoc.getPage(i)
        pg.drawRectangle({
          x: 0,
          y: 0,
          width: PAGE.width,
          height: PAGE.marginBottom - 16,
          color: C.footerBg,
        })
        pg.drawLine({
          start: { x: 0, y: PAGE.marginBottom - 16 },
          end: { x: PAGE.width, y: PAGE.marginBottom - 16 },
          thickness: 0.5,
          color: C.border,
        })

        const pgLabel = `Pag. ${i + 1} / ${totalPages}`
        const pgLabelWidth = font.widthOfTextAtSize(pgLabel, FS.small)
        const footerText = sanitizePdfInlineText(pdfConfig?.rodape)
        const mergedFooterText = [contractMetaText, footerText].filter(Boolean).join('   •   ')
        if (mergedFooterText) {
          const maxFooterTextWidth = Math.max(120, CONTENT_WIDTH - pgLabelWidth - 14)
          pg.drawText(truncateToWidth(mergedFooterText, font, FS.small, maxFooterTextWidth), {
            x: PAGE.marginX,
            y: PAGE.marginBottom - 32,
            size: FS.small,
            font,
            color: C.textMuted,
          })
        }
        pg.drawText(pgLabel, {
          x: PAGE.width - PAGE.marginX - pgLabelWidth,
          y: PAGE.marginBottom - 32,
          size: FS.small,
          font,
          color: C.textMuted,
        })
      }

      const pdfBytes = await pdfDoc.save()
      const emissaoDate = new Date().toLocaleDateString('pt-BR').replace(/\//g, '.')
      const fileName = `${documentLabel} ${docNum} - ${contrato.titulo.slice(0, 30)} - ${emissaoDate}.pdf`
      const encodedFileName = encodeURIComponent(fileName)
      const pdfArrayBuffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength
      ) as ArrayBuffer
      const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' })

      setCachedPdfBuffer(cacheKey, pdfBlob, etag)

      return new NextResponse(pdfBlob, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `${disposition}; filename="${documentLabel} ${docNum}.pdf"; filename*=UTF-8''${encodedFileName}`,
          'Cache-Control': cacheControl,
          ETag: etag,
        },
      })
    } catch (error) {
      console.error('Erro ao gerar PDF do contrato:', error)
      return NextResponse.json({ error: 'Erro ao gerar PDF do contrato' }, { status: 500 })
    }
  })
}
