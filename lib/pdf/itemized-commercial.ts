import { PDFDocument, PDFFont, PDFImage, StandardFonts, rgb } from 'pdf-lib'

type PdfColor = ReturnType<typeof rgb>

export type ItemizedDocType = 'orcamento' | 'pedido'

export type ItemizedLineItem = {
  descricao: string
  quantidade: number
  precoUnitario: number
  desconto: number
  subtotal: number
}

export type ItemizedCompanyData = {
  nomeEmpresa?: string | null
  nomeVendedor?: string | null
  telefone?: string | null
  email?: string | null
  site?: string | null
  rodape?: string | null
  corPrimaria?: string | null
  logoBase64?: string | null
  logoPosicao?: string | null
}

export type ItemizedCustomerData = {
  nome: string
  documento?: string | null
  empresa?: string | null
  email?: string | null
  telefone?: string | null
  endereco?: string | null
  cidade?: string | null
  estado?: string | null
}

export type BuildItemizedCommercialPdfInput = {
  docType: ItemizedDocType
  docNumber: string
  issueDate: Date
  secondaryLabelTitle?: string | null
  secondaryLabelValue?: string | null
  paymentLabel?: string | null
  statusLabel?: string | null
  title?: string | null
  notes?: string | null
  items: ItemizedLineItem[]
  totals: {
    bruto: number
    desconto: number
    liquido: number
  }
  customer: ItemizedCustomerData
  company: ItemizedCompanyData
}

const PAGE = {
  width: 595.28,
  height: 841.89,
  marginX: 36,
  marginTop: 24,
  marginBottom: 30,
}

const CONTENT_WIDTH = PAGE.width - PAGE.marginX * 2
const HEADER_HEIGHT = 78
const FOOTER_HEIGHT = 22
const BODY_MIN_Y = PAGE.marginBottom + FOOTER_HEIGHT + 10

const TABLE_COL = {
  idx: 26,
  desc: 220,
  qty: 55,
  unit: 80,
  discount: 68,
  subtotal: 74,
}

const TABLE_X = {
  idx: PAGE.marginX,
  desc: PAGE.marginX + TABLE_COL.idx,
  qty: PAGE.marginX + TABLE_COL.idx + TABLE_COL.desc,
  unit: PAGE.marginX + TABLE_COL.idx + TABLE_COL.desc + TABLE_COL.qty,
  discount: PAGE.marginX + TABLE_COL.idx + TABLE_COL.desc + TABLE_COL.qty + TABLE_COL.unit,
  subtotal:
    PAGE.marginX +
    TABLE_COL.idx +
    TABLE_COL.desc +
    TABLE_COL.qty +
    TABLE_COL.unit +
    TABLE_COL.discount,
}

function currency(value: number | null | undefined) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

function dateBr(value: Date | string | null | undefined) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR')
}

function sanitize(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

function formatQuantity(value: number) {
  if (!Number.isFinite(value)) return '0'
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(2).replace('.', ',')
}

function truncate(text: string, font: PDFFont, size: number, width: number) {
  if (font.widthOfTextAtSize(text, size) <= width) return text
  let output = text
  while (output.length > 0 && font.widthOfTextAtSize(`${output}...`, size) > width) {
    output = output.slice(0, -1)
  }
  return output ? `${output}...` : ''
}

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const normalized = sanitize(text)
  if (!normalized) return []
  const words = normalized.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(next, size) > width && current) {
      lines.push(current)
      current = word
      continue
    }
    current = next
  }

  if (current) lines.push(current)
  return lines
}

function parseHexColor(hex: string | null | undefined, fallback: PdfColor): PdfColor {
  if (!hex) return fallback
  const clean = hex.replace('#', '').trim()
  if (clean.length !== 6) return fallback
  const r = Number.parseInt(clean.slice(0, 2), 16) / 255
  const g = Number.parseInt(clean.slice(2, 4), 16) / 255
  const b = Number.parseInt(clean.slice(4, 6), 16) / 255
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return fallback
  return rgb(r, g, b)
}

async function maybeEmbedLogo(pdfDoc: PDFDocument, logoBase64: string | null | undefined): Promise<PDFImage | null> {
  if (!logoBase64) return null
  try {
    const raw = logoBase64.replace(/^data:image\/[\w+.-]+;base64,/, '')
    const bytes = Buffer.from(raw, 'base64')
    if (logoBase64.includes('data:image/png')) return await pdfDoc.embedPng(bytes)
    return await pdfDoc.embedJpg(bytes)
  } catch {
    return null
  }
}

export async function buildItemizedCommercialPdf(input: BuildItemizedCommercialPdfInput) {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const primary = parseHexColor(input.company.corPrimaria, rgb(0.08, 0.22, 0.55))
  const dark = rgb(0.12, 0.14, 0.20)
  const textMuted = rgb(0.44, 0.47, 0.54)
  const line = rgb(0.82, 0.84, 0.90)
  const bgSoft = rgb(0.97, 0.98, 0.99)
  const white = rgb(1, 1, 1)
  const logoImage = await maybeEmbedLogo(pdfDoc, input.company.logoBase64)

  const docLabel = input.docType === 'pedido' ? 'PEDIDO' : 'ORCAMENTO'
  const companyName = sanitize(input.company.nomeEmpresa)
  const sellerName = sanitize(input.company.nomeVendedor)
  const docTitle = sanitize(input.title) || (input.docType === 'pedido' ? 'Pedido de venda' : 'Orcamento comercial')
  const issueDateLabel = dateBr(input.issueDate)
  const secondaryLabelTitle = sanitize(input.secondaryLabelTitle) || (input.docType === 'pedido' ? 'Entrega' : 'Validade')
  const secondaryLabelValue = sanitize(input.secondaryLabelValue) || '-'
  const paymentLabel = sanitize(input.paymentLabel) || '-'
  const statusLabel = sanitize(input.statusLabel) || '-'

  const items = input.items.length > 0
    ? input.items
    : [{ descricao: docTitle, quantidade: 1, precoUnitario: input.totals.bruto, desconto: input.totals.desconto, subtotal: input.totals.liquido }]

  const pages: ReturnType<PDFDocument['addPage']>[] = []
  let page = pdfDoc.addPage([PAGE.width, PAGE.height])
  pages.push(page)
  let y = PAGE.height - PAGE.marginTop

  const drawHeader = (target: typeof page, continuation = false) => {
    target.drawRectangle({
      x: 0,
      y: PAGE.height - HEADER_HEIGHT,
      width: PAGE.width,
      height: HEADER_HEIGHT,
      color: primary,
    })

    const leftHeaderTitle = companyName ? companyName.toUpperCase() : docLabel
    target.drawText(leftHeaderTitle, {
      x: PAGE.marginX,
      y: PAGE.height - 30,
      size: 12,
      font: fontBold,
      color: white,
    })

    const contactPieces = [sellerName, sanitize(input.company.telefone), sanitize(input.company.email), sanitize(input.company.site)].filter(Boolean)
    if (contactPieces.length > 0) {
      target.drawText(truncate(contactPieces.join('  |  '), font, 8, CONTENT_WIDTH - 120), {
        x: PAGE.marginX,
        y: PAGE.height - 44,
        size: 8,
        font,
        color: white,
      })
    }

    if (logoImage && input.company.logoPosicao !== 'rodape') {
      const dims = logoImage.size()
      const maxH = 34
      const maxW = 88
      const scale = Math.min(maxW / dims.width, maxH / dims.height)
      const logoW = dims.width * scale
      const logoH = dims.height * scale
      target.drawImage(logoImage, {
        x: PAGE.width - PAGE.marginX - logoW,
        y: PAGE.height - HEADER_HEIGHT + (HEADER_HEIGHT - logoH) / 2,
        width: logoW,
        height: logoH,
      })
    }

    const rightTitle = continuation ? `${docLabel} (CONT.)` : docLabel
    const rightMeta = `${rightTitle} N. ${input.docNumber}`
    const rightW = fontBold.widthOfTextAtSize(rightMeta, 11)
    target.drawText(rightMeta, {
      x: PAGE.width - PAGE.marginX - rightW,
      y: PAGE.height - 30,
      size: 11,
      font: fontBold,
      color: white,
    })

    return PAGE.height - HEADER_HEIGHT - 12
  }

  const drawFooter = (target: typeof page, index: number, total: number) => {
    target.drawLine({
      start: { x: PAGE.marginX, y: PAGE.marginBottom + FOOTER_HEIGHT },
      end: { x: PAGE.width - PAGE.marginX, y: PAGE.marginBottom + FOOTER_HEIGHT },
      thickness: 0.6,
      color: line,
    })

    let footerX = PAGE.marginX
    let footerMaxW = CONTENT_WIDTH - 42

    if (logoImage && input.company.logoPosicao === 'rodape') {
      const dims = logoImage.size()
      const maxH = 12
      const maxW = 56
      const scale = Math.min(maxW / dims.width, maxH / dims.height)
      const logoW = dims.width * scale
      const logoH = dims.height * scale

      target.drawImage(logoImage, {
        x: PAGE.marginX,
        y: PAGE.marginBottom + (FOOTER_HEIGHT - logoH) / 2,
        width: logoW,
        height: logoH,
      })

      footerX = PAGE.marginX + logoW + 6
      footerMaxW = PAGE.width - footerX - PAGE.marginX - 42
    }

    const footerText = truncate(
      sanitize(input.company.rodape) || `${docLabel} gerado em ${issueDateLabel}`,
      font,
      7,
      Math.max(90, footerMaxW),
    )
    target.drawText(footerText, {
      x: footerX,
      y: PAGE.marginBottom + 8,
      size: 7,
      font,
      color: textMuted,
    })

    const pageLabel = `Pag. ${index}/${total}`
    const pageWidth = fontBold.widthOfTextAtSize(pageLabel, 7)
    target.drawText(pageLabel, {
      x: PAGE.width - PAGE.marginX - pageWidth,
      y: PAGE.marginBottom + 8,
      size: 7,
      font: fontBold,
      color: textMuted,
    })
  }

  const newPage = (continuation = true) => {
    page = pdfDoc.addPage([PAGE.width, PAGE.height])
    pages.push(page)
    y = drawHeader(page, continuation)
  }

  const ensureSpace = (heightNeeded: number) => {
    if (y - heightNeeded < BODY_MIN_Y) newPage(true)
  }

  const drawTableHeader = () => {
    const h = 20
    ensureSpace(h + 2)
    page.drawRectangle({
      x: PAGE.marginX,
      y: y - h,
      width: CONTENT_WIDTH,
      height: h,
      color: primary,
    })

    const headers: Array<{ text: string; x: number; w: number; right?: boolean }> = [
      { text: '#', x: TABLE_X.idx, w: TABLE_COL.idx },
      { text: 'DESCRICAO', x: TABLE_X.desc, w: TABLE_COL.desc },
      { text: 'QTD', x: TABLE_X.qty, w: TABLE_COL.qty, right: true },
      { text: 'UNIT', x: TABLE_X.unit, w: TABLE_COL.unit, right: true },
      { text: 'DESC', x: TABLE_X.discount, w: TABLE_COL.discount, right: true },
      { text: 'SUBTOTAL', x: TABLE_X.subtotal, w: TABLE_COL.subtotal, right: true },
    ]

    for (const header of headers) {
      const labelWidth = fontBold.widthOfTextAtSize(header.text, 8)
      const tx = header.right ? header.x + header.w - 5 - labelWidth : header.x + 4
      page.drawText(header.text, { x: tx, y: y - 13, size: 8, font: fontBold, color: white })
    }
    y -= h
  }

  y = drawHeader(page, false)

  const clientLines = [
    `Cliente: ${sanitize(input.customer.nome) || '-'}`,
    [sanitize(input.customer.empresa), sanitize(input.customer.documento)].filter(Boolean).join(' | '),
    [sanitize(input.customer.email), sanitize(input.customer.telefone)].filter(Boolean).join(' | '),
    [sanitize(input.customer.endereco), sanitize(input.customer.cidade), sanitize(input.customer.estado)].filter(Boolean).join(', '),
  ].filter(Boolean)

  const metaLines = [
    `Documento: ${docLabel} ${input.docNumber}`,
    `Emissao: ${issueDateLabel}`,
    `${secondaryLabelTitle}: ${secondaryLabelValue}`,
    `Pagamento: ${paymentLabel}`,
    `Status: ${statusLabel}`,
  ]

  const infoBoxH = 74
  ensureSpace(infoBoxH + 10)
  page.drawRectangle({ x: PAGE.marginX, y: y - infoBoxH, width: CONTENT_WIDTH, height: infoBoxH, color: bgSoft, borderColor: line, borderWidth: 0.6 })
  page.drawLine({
    start: { x: PAGE.marginX + CONTENT_WIDTH * 0.58, y: y - infoBoxH },
    end: { x: PAGE.marginX + CONTENT_WIDTH * 0.58, y },
    thickness: 0.6,
    color: line,
  })

  let clientY = y - 13
  for (const lineText of clientLines.slice(0, 4)) {
    page.drawText(truncate(lineText, font, 8.4, CONTENT_WIDTH * 0.58 - 14), { x: PAGE.marginX + 8, y: clientY, size: 8.4, font, color: dark })
    clientY -= 14
  }

  let metaY = y - 13
  for (const lineText of metaLines.slice(0, 5)) {
    page.drawText(truncate(lineText, font, 8, CONTENT_WIDTH * 0.42 - 14), {
      x: PAGE.marginX + CONTENT_WIDTH * 0.58 + 8,
      y: metaY,
      size: 8,
      font,
      color: dark,
    })
    metaY -= 12
  }

  y -= infoBoxH + 10

  const titleLines = wrap(docTitle, fontBold, 10.5, CONTENT_WIDTH - 12).slice(0, 2)
  if (titleLines.length > 0) {
    ensureSpace(30)
    page.drawRectangle({ x: PAGE.marginX, y: y - 26, width: CONTENT_WIDTH, height: 26, color: bgSoft, borderColor: line, borderWidth: 0.5 })
    page.drawText(truncate(titleLines[0], fontBold, 10.5, CONTENT_WIDTH - 10), { x: PAGE.marginX + 6, y: y - 16, size: 10.5, font: fontBold, color: dark })
    y -= 30
  }

  drawTableHeader()

  const rowHeight = 18
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    ensureSpace(rowHeight + 2)
    if (i > 0 && y - rowHeight < BODY_MIN_Y) {
      newPage(true)
      drawTableHeader()
    }

    page.drawRectangle({
      x: PAGE.marginX,
      y: y - rowHeight,
      width: CONTENT_WIDTH,
      height: rowHeight,
      color: i % 2 === 0 ? white : bgSoft,
      borderColor: line,
      borderWidth: 0.35,
    })

    const qty = formatQuantity(item.quantidade)
    const unit = currency(item.precoUnitario)
    const discount = item.desconto > 0 ? currency(item.desconto) : '-'
    const subtotal = currency(item.subtotal)

    page.drawText(String(i + 1), { x: TABLE_X.idx + 4, y: y - 12, size: 8, font, color: textMuted })
    page.drawText(truncate(sanitize(item.descricao) || '-', font, 8, TABLE_COL.desc - 8), {
      x: TABLE_X.desc + 4,
      y: y - 12,
      size: 8,
      font,
      color: dark,
    })

    const qtyW = font.widthOfTextAtSize(qty, 8)
    page.drawText(qty, { x: TABLE_X.qty + TABLE_COL.qty - 5 - qtyW, y: y - 12, size: 8, font, color: dark })
    const unitW = font.widthOfTextAtSize(unit, 8)
    page.drawText(unit, { x: TABLE_X.unit + TABLE_COL.unit - 5 - unitW, y: y - 12, size: 8, font, color: dark })
    const discountW = font.widthOfTextAtSize(discount, 8)
    page.drawText(discount, { x: TABLE_X.discount + TABLE_COL.discount - 5 - discountW, y: y - 12, size: 8, font, color: dark })
    const subtotalW = fontBold.widthOfTextAtSize(subtotal, 8)
    page.drawText(subtotal, { x: TABLE_X.subtotal + TABLE_COL.subtotal - 5 - subtotalW, y: y - 12, size: 8, font: fontBold, color: dark })

    y -= rowHeight
  }

  y -= 8
  ensureSpace(82)

  const totalsW = 220
  const totalsX = PAGE.width - PAGE.marginX - totalsW
  const totalsH = 74
  page.drawRectangle({ x: totalsX, y: y - totalsH, width: totalsW, height: totalsH, color: bgSoft, borderColor: line, borderWidth: 0.7 })

  const drawTotal = (label: string, value: string, yOffset: number, strong = false) => {
    const usedFont = strong ? fontBold : font
    const usedSize = strong ? 10 : 9
    page.drawText(label, { x: totalsX + 10, y: y - yOffset, size: usedSize, font: usedFont, color: dark })
    const valueWidth = usedFont.widthOfTextAtSize(value, usedSize)
    page.drawText(value, { x: totalsX + totalsW - 10 - valueWidth, y: y - yOffset, size: usedSize, font: usedFont, color: dark })
  }

  drawTotal('Total bruto:', currency(input.totals.bruto), 16)
  drawTotal('Desconto:', currency(input.totals.desconto), 34)
  page.drawLine({
    start: { x: totalsX + 8, y: y - 43 },
    end: { x: totalsX + totalsW - 8, y: y - 43 },
    thickness: 0.5,
    color: line,
  })
  drawTotal('Total liquido:', currency(input.totals.liquido), 60, true)
  y -= totalsH + 10

  const notes = sanitize(input.notes)
  if (notes) {
    const notesLines = wrap(notes, font, 8, CONTENT_WIDTH - 12).slice(0, 4)
    if (notesLines.length > 0) {
      ensureSpace(18 + notesLines.length * 11)
      page.drawText('Observacoes:', { x: PAGE.marginX, y, size: 8, font: fontBold, color: textMuted })
      y -= 11
      for (const notesLine of notesLines) {
        page.drawText(truncate(notesLine, font, 8, CONTENT_WIDTH - 12), { x: PAGE.marginX, y, size: 8, font, color: dark })
        y -= 10
      }
    }
  }

  pages.forEach((target, index) => drawFooter(target, index + 1, pages.length))
  return pdfDoc.save()
}
