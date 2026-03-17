import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib'
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
  marginX: 50,
  marginTop: 50,
  marginBottom: 60,
}

const CONTENT_WIDTH = PAGE.width - PAGE.marginX * 2

const FS = {
  title: 14,
  section: 10,
  label: 9,
  text: 9,
  small: 8,
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

function dateBr(v?: Date | string | null) {
  if (!v) return '-'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
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
        return NextResponse.json({ error: 'Contrato nÃ£o encontrado' }, { status: 404 })
      }

      const docNum = String(contrato.numero).padStart(5, '0')
      const dayKey = new Date().toISOString().slice(0, 10)
      const cacheKey = buildPdfCacheKey([
        'contrato-pdf',
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
            'Content-Disposition': `${disposition}; filename="Contrato ${docNum}.pdf"`,
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
        textDark: rgb(0.1, 0.1, 0.15),
        textMuted: rgb(0.4, 0.4, 0.5),
        border: rgb(0.75, 0.78, 0.85),
        footerBg: rgb(0.94, 0.95, 0.97),
      }

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

      const companyName = pdfConfig?.nomeEmpresa || 'CONTRATO'
      page.drawText(companyName.toUpperCase(), {
        x: PAGE.marginX,
        y,
        size: FS.title + 2,
        font: fontBold,
        color: C.primary,
      })
      y -= 14

      page.drawText('CONTRATO', {
        x: PAGE.marginX,
        y,
        size: FS.title,
        font: fontBold,
        color: C.textDark,
      })
      y -= 18

      page.drawText(`NÂº ${docNum}`, {
        x: PAGE.width - PAGE.marginX - fontBold.widthOfTextAtSize(`NÂº ${docNum}`, FS.label),
        y: y + 18,
        size: FS.label,
        font: fontBold,
        color: C.textMuted,
      })

      page.drawLine({
        start: { x: PAGE.marginX, y },
        end: { x: PAGE.width - PAGE.marginX, y },
        thickness: 0.5,
        color: C.border,
      })
      y -= 20

      page.drawText(contrato.titulo.toUpperCase(), {
        x: PAGE.marginX,
        y,
        size: FS.section,
        font: fontBold,
        color: C.textDark,
      })
      y -= 16

      if (contrato.preambulo) {
        const preambLines = wrapText(contrato.preambulo, font, FS.text, CONTENT_WIDTH)
        ensure(20 + preambLines.length * 12)
        for (const line of preambLines) {
          if (y < PAGE.marginBottom + 14) {
            newPage()
          }
          page.drawText(line, { x: PAGE.marginX, y, size: FS.text, font, color: C.textDark })
          y -= 12
        }
        y -= 8
      }

      const partesKeys = Object.keys(dadosPartes).filter((k) => dadosPartes[k]?.nome)
      if (partesKeys.length > 0) {
        ensure(60)
        page.drawText('DADOS DAS PARTES', {
          x: PAGE.marginX,
          y,
          size: FS.label,
          font: fontBold,
          color: C.primary,
        })
        y -= 14

        for (const key of partesKeys) {
          const parte = dadosPartes[key] as DadosParte
          const label = key === 'contratante' ? 'CONTRATANTE' : key === 'contratado' ? 'CONTRATADO' : key.toUpperCase()
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
            { label: 'EndereÃ§o', value: parte.endereco },
            { label: 'Cidade/UF', value: [parte.cidade, parte.estado].filter(Boolean).join(' / ') },
            { label: 'CEP', value: parte.cep },
            { label: 'E-mail', value: parte.email },
            { label: 'Telefone', value: parte.telefone },
          ]

          for (const [k, v] of Object.entries(parte)) {
            if (FIXED_FIELDS.includes(k) || !v || typeof v !== 'string') continue
            fields.push({ label: k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '), value: v })
          }

          for (const { label: l, value } of fields) {
            if (!value) continue
            const line = `${l}: ${value}`
            const lines = wrapText(line, font, FS.small, CONTENT_WIDTH - 10)
            for (const ln of lines) {
              page.drawText(ln, { x: PAGE.marginX + 8, y, size: FS.small, font, color: C.textDark })
              y -= 10
            }
          }
          y -= 6
        }
        y -= 10
      }

      if (clausulas.length > 0) {
        page.drawText('CLÃUSULAS', {
          x: PAGE.marginX,
          y,
          size: FS.label,
          font: fontBold,
          color: C.primary,
        })
        y -= 16

        for (let i = 0; i < clausulas.length; i++) {
          const c = clausulas[i]
          const tituloClausula = `${i + 1}. ${c.titulo}`
          const tituloLines = wrapText(tituloClausula, fontBold, FS.text, CONTENT_WIDTH)
          const conteudoLines = wrapText(c.conteudo, font, FS.text, CONTENT_WIDTH)

          ensure(20 + (tituloLines.length + conteudoLines.length) * 12)
          for (const line of tituloLines) {
            if (y < PAGE.marginBottom + 14) newPage()
            page.drawText(line, { x: PAGE.marginX, y, size: FS.text, font: fontBold, color: C.textDark })
            y -= 12
          }
          for (const line of conteudoLines) {
            if (y < PAGE.marginBottom + 14) newPage()
            page.drawText(line, { x: PAGE.marginX, y, size: FS.text, font, color: C.textDark })
            y -= 12
          }
          y -= 8
        }
      }

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

      const localStr = contrato.localAssinatura || 'Local e data a definir'
      const dataStr = contrato.dataAssinatura ? dateBr(contrato.dataAssinatura) : dateBr(new Date())

      page.drawText('Assinaturas:', {
        x: PAGE.marginX + 8,
        y: y - 14,
        size: FS.label,
        font: fontBold,
        color: C.textMuted,
      })
      page.drawText(`${localStr}, ${dataStr}.`, {
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

        const footerText = pdfConfig?.rodape || `EmissÃ£o: ${dateBr(new Date())}`
        const footerW = font.widthOfTextAtSize(footerText, FS.small)
        pg.drawText(footerText, {
          x: PAGE.marginX,
          y: PAGE.marginBottom - 32,
          size: FS.small,
          font,
          color: C.textMuted,
        })
        const pgLabel = `PÃ¡g. ${i + 1} / ${totalPages}`
        pg.drawText(pgLabel, {
          x: PAGE.width - PAGE.marginX - font.widthOfTextAtSize(pgLabel, FS.small),
          y: PAGE.marginBottom - 32,
          size: FS.small,
          font,
          color: C.textMuted,
        })
      }

      const pdfBytes = await pdfDoc.save()
      const emissaoDate = new Date().toLocaleDateString('pt-BR').replace(/\//g, '.')
      const fileName = `Contrato ${docNum} - ${contrato.titulo.slice(0, 30)} - ${emissaoDate}.pdf`
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
          'Content-Disposition': `${disposition}; filename="Contrato ${docNum}.pdf"; filename*=UTF-8''${encodedFileName}`,
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
