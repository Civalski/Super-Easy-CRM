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

const PAGE = {
  width: 595.28,
  height: 841.89,
  marginX: 40,
  marginTop: 40,
  marginBottom: 54,
}

const CONTENT_WIDTH = PAGE.width - PAGE.marginX * 2 // 515.28

// Table column widths (sum = 515)
const COL = { num: 22, desc: 200, qty: 48, unit: 80, disc: 70, sub: 95 }
const COL_X = {
  num:  PAGE.marginX,
  desc: PAGE.marginX + COL.num,
  qty:  PAGE.marginX + COL.num + COL.desc,
  unit: PAGE.marginX + COL.num + COL.desc + COL.qty,
  disc: PAGE.marginX + COL.num + COL.desc + COL.qty + COL.unit,
  sub:  PAGE.marginX + COL.num + COL.desc + COL.qty + COL.unit + COL.disc,
}

const STATUS_LABEL: Record<string, string> = {
  sem_contato:  'Sem Contato',
  em_potencial: 'Em Potencial',
  orcamento:    'Orçamento',
  fechada:      'Fechada',
  perdida:      'Perdida',
}

const FS = {
  hero:    18,
  section: 9.5,
  label:   8,
  text:    9,
  tableMd: 8.5,
  total:   11,
  small:   7.5,
}

// ── Helpers ────────────────────────────────────────────────────────────────────

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
  t: number,
): ReturnType<typeof rgb> {
  return rgb(
    Math.min(1, Math.max(0, c1.red   + (c2.red   - c1.red)   * t)),
    Math.min(1, Math.max(0, c1.green + (c2.green - c1.green) * t)),
    Math.min(1, Math.max(0, c1.blue  + (c2.blue  - c1.blue)  * t)),
  )
}

function lightenColor(c: ReturnType<typeof rgb>, amount: number) {
  return rgb(
    Math.min(1, c.red   + amount),
    Math.min(1, c.green + amount),
    Math.min(1, c.blue  + amount),
  )
}

function currency(v: number | null | undefined) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function dateBr(v?: Date | string | null) {
  if (!v) return '-'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('pt-BR')
}

function sanitizeFileName(v: string) {
  return v
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
}

function truncateToWidth(text: string, f: PDFFont, size: number, maxW: number): string {
  if (f.widthOfTextAtSize(text, size) <= maxW) return text
  let t = text
  while (t.length > 0 && f.widthOfTextAtSize(t + '…', size) > maxW) t = t.slice(0, -1)
  return t + '…'
}

function wrapText(text: string, f: PDFFont, size: number, maxW: number): string[] {
  if (!text) return []
  const words = text.split(/\s+/).filter(Boolean)
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

async function embedFonts(pdfDoc: PDFDocument) {
  return {
    font:     await pdfDoc.embedFont(StandardFonts.Helvetica),
    fontBold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  }
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

// ── Route Handler ──────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: oportunidadeId } = await params
  return withAuth(request, async (userId) => {
    try {
      await ensureDatabaseInitialized()

      const [oportunidade, user, pdfConfig] = await Promise.all([
        prisma.oportunidade.findFirst({
          where: { id: oportunidadeId, userId },
          include: {
            cliente: {
              select: {
                nome: true, email: true, telefone: true,
                empresa: true, endereco: true, cidade: true,
                estado: true, documento: true,
              },
            },
            pedido: { include: { itens: { orderBy: { createdAt: 'asc' } } } },
          },
        }),
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, username: true } }),
      prisma.pdfConfig.findUnique({ where: { userId } }),
    ])

    if (!oportunidade) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 })
    }

    const today = new Date()
    const emissaoStr = dateBr(today)
    const docNum = String(oportunidade.numero).padStart(5, '0')
    const dayKey = today.toISOString().slice(0, 10)
    const cacheKey = buildPdfCacheKey([
      'oportunidade-pdf',
      userId,
      oportunidade.id,
      oportunidade.updatedAt?.getTime(),
      oportunidade.pedido?.updatedAt?.getTime(),
      pdfConfig?.updatedAt?.getTime(),
      dayKey,
    ])
    const etag = createPdfEtag(cacheKey)
    const cacheControl = buildPdfCacheControl()
    const ifNoneMatch = request.headers.get('if-none-match')

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
          'Content-Disposition': `attachment; filename="Orcamento ${docNum}.pdf"`,
          'Cache-Control': cacheControl,
          ETag: cached.etag,
        },
      })
    }

    // ── Setup ────────────────────────────────────────────────────────────────
    const pdfDoc = await PDFDocument.create()
    const { font, fontBold } = await embedFonts(pdfDoc)

    // ── Color palette ────────────────────────────────────────────────────────
    const PRIMARY_DEFAULT = rgb(0.07, 0.20, 0.55)
    const primary  = hexToRgb(pdfConfig?.corPrimaria, PRIMARY_DEFAULT)
    const gradEnd  = lightenColor(primary, 0.22)

    const C = {
      primary,
      gradEnd,
      sectionBg:  lerpColor(primary, rgb(1, 1, 1), 0.92),
      tableAlt:   lerpColor(primary, rgb(1, 1, 1), 0.96),
      border:     rgb(0.82, 0.84, 0.90),
      textDark:   rgb(0.10, 0.11, 0.18),
      textMuted:  rgb(0.45, 0.47, 0.57),
      textLight:  rgb(0.72, 0.76, 0.92),
      discGreen:  rgb(0.08, 0.50, 0.20),
      accent:     rgb(0.08, 0.48, 0.20),
      footerBg:   rgb(0.93, 0.94, 0.97),
      white:      rgb(1, 1, 1),
    }

    // Validity date
    let validadeStr = '-'
    if (oportunidade.dataFechamento) {
      validadeStr = dateBr(oportunidade.dataFechamento)
    } else if (pdfConfig?.validadeDias) {
      const d = new Date(today)
      d.setDate(d.getDate() + pdfConfig.validadeDias)
      validadeStr = dateBr(d)
    }

    // Logo
    const logoImage = pdfConfig?.logoBase64 ? await embedLogo(pdfDoc, pdfConfig.logoBase64) : null
    const logoPosicao = pdfConfig?.logoPosicao === 'rodape' ? 'rodape' : 'topo'
    const isLogoNoTopo = Boolean(logoImage && logoPosicao === 'topo')

    const allPages: ReturnType<typeof pdfDoc.addPage>[] = []
    let page = pdfDoc.addPage([PAGE.width, PAGE.height])
    allPages.push(page)
    let y = PAGE.height - PAGE.marginTop

    const newPage = () => {
      page = pdfDoc.addPage([PAGE.width, PAGE.height])
      allPages.push(page)
      y = PAGE.height - PAGE.marginTop
    }
    const ensure = (h: number) => { if (y - h < PAGE.marginBottom) newPage() }

    // ── HEADER with horizontal gradient ──────────────────────────────────────
    const HEADER_H = 80
    const GRAD_STEPS = 50

    for (let i = 0; i < GRAD_STEPS; i++) {
      const t = i / (GRAD_STEPS - 1)
      const stepColor = lerpColor(C.primary, C.gradEnd, t)
      page.drawRectangle({
        x: (i / GRAD_STEPS) * PAGE.width,
        y: PAGE.height - HEADER_H,
        width: PAGE.width / GRAD_STEPS + 1,
        height: HEADER_H,
        color: stepColor,
      })
    }

    // Logo (right side of header, vertically centered)
    let docRightX = PAGE.width - PAGE.marginX
    if (isLogoNoTopo && logoImage) {
      const MAX_LOGO_H = HEADER_H - 18
      const MAX_LOGO_W = 110
      const dims = logoImage.size()
      const scale = Math.min(MAX_LOGO_H / dims.height, MAX_LOGO_W / dims.width)
      const logoW = dims.width * scale
      const logoH = dims.height * scale
      const logoX = PAGE.width - PAGE.marginX - logoW
      const logoY = PAGE.height - HEADER_H + (HEADER_H - logoH) / 2
      page.drawImage(logoImage, { x: logoX, y: logoY, width: logoW, height: logoH })
      docRightX = logoX - 10
    }

    // Company name (left, bold)
    const companyName = pdfConfig?.nomeEmpresa || 'ORÇAMENTO COMERCIAL'
    page.drawText(companyName.toUpperCase(), {
      x: PAGE.marginX, y: PAGE.height - 30,
      size: FS.hero, font: fontBold, color: C.white,
    })
    if (pdfConfig?.nomeEmpresa) {
      page.drawText('ORÇAMENTO COMERCIAL', {
        x: PAGE.marginX, y: PAGE.height - 50,
        size: FS.small + 0.5, font, color: C.textLight,
      })
    }

    // Doc number + date (right of logo or right margin)
    const docLabel = `Nº ${docNum}`
    const docLW = fontBold.widthOfTextAtSize(docLabel, 13)
    page.drawText(docLabel, {
      x: docRightX - docLW, y: PAGE.height - 28,
      size: 13, font: fontBold, color: C.white,
    })
    const emissaoLabel = `Emissão: ${emissaoStr}`
    const emissaoLW = font.widthOfTextAtSize(emissaoLabel, FS.small)
    page.drawText(emissaoLabel, {
      x: docRightX - emissaoLW, y: PAGE.height - 44,
      size: FS.small, font, color: C.textLight,
    })
    if (validadeStr !== '-') {
      const valLabel = `Validade: ${validadeStr}`
      const valLW = font.widthOfTextAtSize(valLabel, FS.small)
      page.drawText(valLabel, {
        x: docRightX - valLW, y: PAGE.height - 57,
        size: FS.small, font, color: C.textLight,
      })
    }

    y = PAGE.height - HEADER_H - 14

    // ── META STRIP ────────────────────────────────────────────────────────────
    const emitente = pdfConfig?.nomeVendedor || user?.name || user?.username || ''
    const metaParts: string[] = []
    if (emitente) metaParts.push(`Emitido por: ${emitente}`)
    if (pdfConfig?.telefone) metaParts.push(pdfConfig.telefone)
    if (pdfConfig?.email) metaParts.push(pdfConfig.email)
    if (pdfConfig?.site) metaParts.push(pdfConfig.site)

    if (metaParts.length > 0) {
      page.drawText(truncateToWidth(metaParts.join('   •   '), font, FS.label, CONTENT_WIDTH - 10), {
        x: PAGE.marginX, y, size: FS.label, font, color: C.textMuted,
      })
    }
    y -= 10
    page.drawLine({
      start: { x: PAGE.marginX, y }, end: { x: PAGE.width - PAGE.marginX, y },
      thickness: 0.5, color: C.border,
    })
    y -= 14

    // ── TITLE BAND ────────────────────────────────────────────────────────────
    const TITLE_H = 36
    ensure(TITLE_H + 4)

    page.drawRectangle({
      x: PAGE.marginX, y: y - TITLE_H, width: CONTENT_WIDTH, height: TITLE_H,
      color: C.sectionBg, borderColor: C.border, borderWidth: 0.5,
    })
    page.drawText('TÍTULO DO ORÇAMENTO', {
      x: PAGE.marginX + 10, y: y - 11,
      size: FS.label, font: fontBold, color: C.textMuted,
    })
    page.drawText(truncateToWidth(oportunidade.titulo, fontBold, 11, CONTENT_WIDTH - 24), {
      x: PAGE.marginX + 10, y: y - 26,
      size: 11, font: fontBold, color: C.textDark,
    })
    y -= TITLE_H + 10

    // ── CLIENT BOX ────────────────────────────────────────────────────────────
    const cliente = oportunidade.cliente
    const clientFields: { label: string; value: string }[] = [
      { label: 'Nome', value: cliente.nome },
      { label: 'CNPJ/CPF', value: cliente.documento || '' },
    ]
    if (cliente.empresa)   clientFields.push({ label: 'Empresa',  value: cliente.empresa })
    if (cliente.email)     clientFields.push({ label: 'E-mail',   value: cliente.email })
    if (cliente.telefone)  clientFields.push({ label: 'Telefone', value: cliente.telefone })
    const addrParts = [cliente.endereco, cliente.cidade, cliente.estado].filter(Boolean)
    if (addrParts.length)  clientFields.push({ label: 'Endereço', value: addrParts.join(', ') })

    const CLABEL_W  = 60
    const COL2_X    = PAGE.marginX + CONTENT_WIDTH / 2
    const COL1_VAL_W = CONTENT_WIDTH / 2 - CLABEL_W - 22
    const COL2_VAL_W = CONTENT_WIDTH / 2 - CLABEL_W - 18

    const halfLen = Math.ceil(clientFields.length / 2)
    const CBOX_H  = 16 + 10 + halfLen * 15 + 10

    ensure(CBOX_H + 4)

    page.drawRectangle({
      x: PAGE.marginX, y: y - CBOX_H, width: CONTENT_WIDTH, height: CBOX_H,
      color: C.sectionBg, borderColor: C.border, borderWidth: 0.5,
    })
    page.drawRectangle({ x: PAGE.marginX, y: y - 16, width: CONTENT_WIDTH, height: 16, color: C.primary })
    page.drawText('DADOS DO CLIENTE', {
      x: PAGE.marginX + 8, y: y - 12,
      size: FS.section, font: fontBold, color: C.white,
    })

    const clientRowTop = y - 16 - 10 - 2
    for (let i = 0; i < clientFields.length; i++) {
      const isCol2 = i >= halfLen
      const rowIdx = isCol2 ? i - halfLen : i
      const cx = isCol2 ? COL2_X : PAGE.marginX + 8
      const rowY = clientRowTop - rowIdx * 15
      const maxW = isCol2 ? COL2_VAL_W : COL1_VAL_W
      const { label, value } = clientFields[i]

      page.drawText(`${label}:`, { x: cx, y: rowY, size: FS.label, font: fontBold, color: C.textMuted })
      page.drawText(truncateToWidth(value, font, FS.label, maxW), {
        x: cx + CLABEL_W, y: rowY, size: FS.label, font, color: C.textDark,
      })
    }

    y = y - CBOX_H - 10

    // ── SUMMARY CARDS ─────────────────────────────────────────────────────────
    const summaryCards = [
      { label: 'STATUS',       value: STATUS_LABEL[oportunidade.status] ?? oportunidade.status },
      { label: 'FORMA PGTO.',  value: oportunidade.formaPagamento || '-' },
      { label: 'PARCELAS',     value: oportunidade.parcelas ? `${oportunidade.parcelas}x` : '-' },
      { label: 'VALIDADE',     value: validadeStr },
    ]

    const CARD_W = CONTENT_WIDTH / summaryCards.length
    const CARD_H = 40
    ensure(CARD_H + 4)

    for (let i = 0; i < summaryCards.length; i++) {
      const { label, value } = summaryCards[i]
      const sx = PAGE.marginX + i * CARD_W
      page.drawRectangle({
        x: sx, y: y - CARD_H, width: CARD_W - 1, height: CARD_H,
        color: i % 2 === 0 ? C.sectionBg : C.white,
        borderColor: C.border, borderWidth: 0.5,
      })
      page.drawText(label, { x: sx + 7, y: y - 11, size: FS.label, font: fontBold, color: C.textMuted })
      page.drawText(truncateToWidth(value, fontBold, FS.text, CARD_W - 14), {
        x: sx + 7, y: y - 26, size: FS.text, font: fontBold, color: C.textDark,
      })
    }
    y -= CARD_H + 12

    // ── DESCRIPTION ───────────────────────────────────────────────────────────
    if (oportunidade.descricao) {
      const descLines = wrapText(oportunidade.descricao, font, FS.text, CONTENT_WIDTH - 16)
      const DESC_H = 16 + 8 + descLines.length * 13 + 8
      ensure(DESC_H + 4)

      page.drawRectangle({
        x: PAGE.marginX, y: y - DESC_H, width: CONTENT_WIDTH, height: DESC_H,
        color: C.sectionBg, borderColor: C.border, borderWidth: 0.5,
      })
      page.drawRectangle({ x: PAGE.marginX, y: y - 16, width: CONTENT_WIDTH, height: 16, color: C.primary })
      page.drawText('DESCRIÇÃO / OBSERVAÇÕES', {
        x: PAGE.marginX + 8, y: y - 12, size: FS.section, font: fontBold, color: C.white,
      })

      let dy = y - 16 - 8 - 2
      for (const line of descLines) {
        if (dy < PAGE.marginBottom + 14) { newPage(); dy = y }
        page.drawText(line, { x: PAGE.marginX + 8, y: dy, size: FS.text, font, color: C.textDark })
        dy -= 13
      }
      y = dy - 6
      y -= 10
    }

    // ── ITEMS TABLE ───────────────────────────────────────────────────────────
    const itens = oportunidade.pedido?.itens || []
    const ROW_H   = 20
    const THEAD_H = 22

    ensure(16 + THEAD_H + ROW_H)

    // Section title
    page.drawRectangle({ x: PAGE.marginX, y: y - 16, width: CONTENT_WIDTH, height: 16, color: C.primary })
    page.drawText('ITENS DO ORÇAMENTO', {
      x: PAGE.marginX + 8, y: y - 12, size: FS.section, font: fontBold, color: C.white,
    })
    y -= 16

    // Column header row (slightly darker than primary for contrast)
    ensure(THEAD_H)
    const tableHeaderColor = lerpColor(C.primary, rgb(0, 0, 0), 0.15)
    page.drawRectangle({
      x: PAGE.marginX, y: y - THEAD_H, width: CONTENT_WIDTH, height: THEAD_H,
      color: tableHeaderColor,
    })

    const colHeaders: { label: string; x: number; w: number; align: 'left' | 'right' }[] = [
      { label: '#',         x: COL_X.num,  w: COL.num,  align: 'left'  },
      { label: 'DESCRIÇÃO', x: COL_X.desc, w: COL.desc, align: 'left'  },
      { label: 'QTD',       x: COL_X.qty,  w: COL.qty,  align: 'right' },
      { label: 'UNIT.',     x: COL_X.unit, w: COL.unit, align: 'right' },
      { label: 'DESC.',     x: COL_X.disc, w: COL.disc, align: 'right' },
      { label: 'SUBTOTAL',  x: COL_X.sub,  w: COL.sub,  align: 'right' },
    ]

    for (const { label, x, w, align } of colHeaders) {
      const lw = fontBold.widthOfTextAtSize(label, FS.label)
      const tx = align === 'right' ? x + w - 6 - lw : x + 4
      page.drawText(label, { x: tx, y: y - 15, size: FS.label, font: fontBold, color: C.white })
    }
    y -= THEAD_H

    if (itens.length === 0) {
      ensure(ROW_H)
      page.drawRectangle({
        x: PAGE.marginX, y: y - ROW_H, width: CONTENT_WIDTH, height: ROW_H,
        color: C.tableAlt, borderColor: C.border, borderWidth: 0.4,
      })
      page.drawText('Nenhum item detalhado.', {
        x: PAGE.marginX + 8, y: y - 13, size: FS.text, font, color: C.textMuted,
      })
      y -= ROW_H
    } else {
      for (let idx = 0; idx < itens.length; idx++) {
        const item = itens[idx]
        ensure(ROW_H + 2)
        page.drawRectangle({
          x: PAGE.marginX, y: y - ROW_H, width: CONTENT_WIDTH, height: ROW_H,
          color: idx % 2 === 0 ? C.white : C.tableAlt,
          borderColor: C.border, borderWidth: 0.3,
        })

        page.drawText(String(idx + 1), { x: COL_X.num + 4, y: y - 13, size: FS.tableMd, font, color: C.textMuted })
        page.drawText(truncateToWidth(item.descricao, font, FS.tableMd, COL.desc - 8), {
          x: COL_X.desc + 4, y: y - 13, size: FS.tableMd, font, color: C.textDark,
        })

        const qtyStr = item.quantidade % 1 === 0 ? String(Math.round(item.quantidade)) : item.quantidade.toFixed(2)
        const qtyW = font.widthOfTextAtSize(qtyStr, FS.tableMd)
        page.drawText(qtyStr, { x: COL_X.qty + COL.qty - 6 - qtyW, y: y - 13, size: FS.tableMd, font, color: C.textDark })

        const unitStr = currency(item.precoUnitario)
        const unitW = font.widthOfTextAtSize(unitStr, FS.tableMd)
        page.drawText(unitStr, { x: COL_X.unit + COL.unit - 6 - unitW, y: y - 13, size: FS.tableMd, font, color: C.textDark })

        const discStr = item.desconto > 0 ? currency(item.desconto) : '-'
        const discW   = font.widthOfTextAtSize(discStr, FS.tableMd)
        page.drawText(discStr, {
          x: COL_X.disc + COL.disc - 6 - discW, y: y - 13, size: FS.tableMd, font,
          color: item.desconto > 0 ? C.discGreen : C.textMuted,
        })

        const subStr = currency(item.subtotal)
        const subW   = fontBold.widthOfTextAtSize(subStr, FS.tableMd)
        page.drawText(subStr, { x: COL_X.sub + COL.sub - 6 - subW, y: y - 13, size: FS.tableMd, font: fontBold, color: C.textDark })

        y -= ROW_H
      }
    }

    page.drawLine({
      start: { x: PAGE.marginX, y }, end: { x: PAGE.width - PAGE.marginX, y },
      thickness: 0.8, color: C.border,
    })
    y -= 14

    // ── TOTALS ────────────────────────────────────────────────────────────────
    const totalBruto    = oportunidade.pedido?.totalBruto    ?? oportunidade.valor   ?? 0
    const totalDesconto = oportunidade.pedido?.totalDesconto ?? oportunidade.desconto ?? 0
    const totalLiquido  = oportunidade.pedido?.totalLiquido  ?? oportunidade.valor   ?? 0

    const TBOX_W = 215
    const TBOX_X = PAGE.width - PAGE.marginX - TBOX_W
    const TBOX_H = 66
    ensure(TBOX_H + 4)

    page.drawRectangle({
      x: TBOX_X, y: y - TBOX_H, width: TBOX_W, height: TBOX_H,
      color: C.sectionBg, borderColor: C.border, borderWidth: 0.5,
    })

    const drawTotalRow = (label: string, value: string, bold: boolean, accent: boolean, offsetY: number) => {
      const f     = bold ? fontBold : font
      const fs    = accent ? FS.total : FS.text
      const color = accent ? C.accent : C.textDark
      page.drawText(label, { x: TBOX_X + 10, y: y - offsetY, size: fs, font: f, color })
      const vw = f.widthOfTextAtSize(value, fs)
      page.drawText(value, { x: TBOX_X + TBOX_W - 10 - vw, y: y - offsetY, size: fs, font: f, color })
    }

    drawTotalRow('Total bruto:',  currency(totalBruto),    false, false, 14)
    drawTotalRow('(-) Desconto:', currency(totalDesconto), false, false, 30)
    page.drawLine({
      start: { x: TBOX_X + 8, y: y - 38 }, end: { x: TBOX_X + TBOX_W - 8, y: y - 38 },
      thickness: 0.5, color: C.border,
    })
    drawTotalRow('Total líquido:', currency(totalLiquido), true, true, 56)

    y -= TBOX_H + 14

    // Pedido observations
    if (oportunidade.pedido?.observacoes) {
      const noteLines = wrapText(oportunidade.pedido.observacoes, font, FS.text, CONTENT_WIDTH - 16)
      ensure(20 + noteLines.length * 13)
      page.drawText('Observações:', { x: PAGE.marginX, y, size: FS.label, font: fontBold, color: C.textMuted })
      y -= 13
      for (const line of noteLines) {
        ensure(14)
        page.drawText(line, { x: PAGE.marginX, y, size: FS.text, font, color: C.textDark })
        y -= 13
      }
    }

    // ── FOOTER ────────────────────────────────────────────────────────────────
    const totalPages = allPages.length
    for (let i = 0; i < totalPages; i++) {
      const pg = allPages[i]
      pg.drawRectangle({ x: 0, y: 0, width: PAGE.width, height: PAGE.marginBottom - 16, color: C.footerBg })
      pg.drawLine({
        start: { x: 0, y: PAGE.marginBottom - 16 }, end: { x: PAGE.width, y: PAGE.marginBottom - 16 },
        thickness: 0.5, color: C.border,
      })

      const logoRodape = Boolean(logoImage && logoPosicao === 'rodape')
      let footerTextX = PAGE.marginX
      let footerMaxW = PAGE.width - PAGE.marginX * 2 - 60

      if (logoRodape && logoImage) {
        const maxLogoH = PAGE.marginBottom - 24
        const maxLogoW = 80
        const dims = logoImage.size()
        const scale = Math.min(maxLogoH / dims.height, maxLogoW / dims.width)
        const logoW = dims.width * scale
        const logoH = dims.height * scale
        const logoX = PAGE.marginX
        const logoY = 8
        pg.drawImage(logoImage, { x: logoX, y: logoY, width: logoW, height: logoH })
        footerTextX = logoX + logoW + 10
        footerMaxW = PAGE.width - footerTextX - PAGE.marginX - 60
      }

      const leftFooter = pdfConfig?.rodape
        ? truncateToWidth(pdfConfig.rodape, font, FS.small, footerMaxW)
        : truncateToWidth(
            `Emissão: ${emissaoStr}${validadeStr !== '-' ? `   •   Válido até: ${validadeStr}` : ''}`,
            font,
            FS.small,
            footerMaxW,
          )

      pg.drawText(leftFooter, { x: footerTextX, y: PAGE.marginBottom - 32, size: FS.small, font, color: C.textMuted })

      const pgLabel = `Pág. ${i + 1} / ${totalPages}`
      const pgW = font.widthOfTextAtSize(pgLabel, FS.small)
      pg.drawText(pgLabel, { x: PAGE.width - PAGE.marginX - pgW, y: PAGE.marginBottom - 32, size: FS.small, font, color: C.textMuted })
    }

    const pdfBytes = await pdfDoc.save()
    const emissaoDateForFile = today.toLocaleDateString('pt-BR').replace(/\//g, '.')
    const fileName = `Orçamento ${docNum} - ${emissaoDateForFile}.pdf`

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
          'Content-Disposition': `attachment; filename="Orcamento ${docNum} - ${emissaoDateForFile}.pdf"; filename*=UTF-8''${encodedFileName}`,
          'Cache-Control': cacheControl,
          ETag: etag,
        },
      })
    } catch (error) {
      console.error('Erro ao gerar PDF do orçamento:', error)
      return NextResponse.json({ error: 'Erro ao gerar PDF do orçamento' }, { status: 500 })
    }
  })
}
