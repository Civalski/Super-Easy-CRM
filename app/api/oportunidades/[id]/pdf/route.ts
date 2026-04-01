import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensureDatabaseInitialized } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import {
  buildPdfCacheControl,
  buildPdfCacheKey,
  createPdfEtag,
  getCachedPdfBuffer,
  setCachedPdfBuffer,
} from '@/lib/api/pdf-cache'
import { buildItemizedCommercialPdf, type ItemizedLineItem } from '@/lib/pdf/itemized-commercial'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  sem_contato: 'Sem contato',
  em_potencial: 'Em potencial',
  orcamento: 'Orcamento',
  fechada: 'Fechada',
  perdida: 'Perdida',
}

function dateBr(value: Date | string | null | undefined) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR')
}

function paymentLabel(formaPagamento: string | null | undefined, parcelas: number | null | undefined) {
  if (formaPagamento === 'pix') return 'Pix'
  if (formaPagamento === 'dinheiro') return 'Dinheiro'
  if (formaPagamento === 'cartao') return 'Cartao'
  if (formaPagamento === 'parcelado') {
    if (parcelas && parcelas > 1) return `Parcelado em ${parcelas}x`
    return 'Parcelado'
  }
  if (parcelas && parcelas > 1) return `Parcelado em ${parcelas}x`
  return '-'
}

function normalizeText(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

function validadeLabel(
  dataFechamento: Date | string | null | undefined,
  validadeDias: number | null | undefined,
) {
  if (dataFechamento) return dateBr(dataFechamento)
  if (validadeDias && validadeDias > 0) return `${validadeDias} dias`
  return '-'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: oportunidadeId } = await params

  return withAuth(request, async (userId) => {
    try {
      await ensureDatabaseInitialized()

      const [oportunidade, pdfConfig] = await Promise.all([
        prisma.oportunidade.findFirst({
          where: { id: oportunidadeId, userId },
          include: {
            cliente: {
              select: {
                nome: true,
                email: true,
                telefone: true,
                empresa: true,
                endereco: true,
                cidade: true,
                estado: true,
                documento: true,
              },
            },
            pedido: {
              include: {
                itens: { orderBy: { createdAt: 'asc' } },
              },
            },
          },
        }),
        prisma.pdfConfig.findUnique({ where: { userId } }),
      ])

      if (!oportunidade) {
        return NextResponse.json({ error: 'Orcamento nao encontrado' }, { status: 404 })
      }

      const today = new Date()
      const docNumber = String(oportunidade.numero).padStart(5, '0')
      const dayKey = today.toISOString().slice(0, 10)

      const cacheKey = buildPdfCacheKey([
        'oportunidade-pdf',
        'itemized-v2',
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
            'Content-Disposition': `attachment; filename="Orcamento ${docNumber}.pdf"`,
            'Cache-Control': cacheControl,
            ETag: cached.etag,
          },
        })
      }

      const totalLiquidoBase = Number(oportunidade.valor || 0)
      const totalDescontoBase = Number(oportunidade.desconto || 0)
      const totalBrutoBase = Math.max(0, totalLiquidoBase + totalDescontoBase)

      const totalBruto = Number(oportunidade.pedido?.totalBruto ?? totalBrutoBase)
      const totalDesconto = Number(oportunidade.pedido?.totalDesconto ?? totalDescontoBase)
      const totalLiquido = Number(oportunidade.pedido?.totalLiquido ?? totalLiquidoBase)

      const itemsFromPedido: ItemizedLineItem[] = (oportunidade.pedido?.itens ?? []).map((item) => ({
        descricao: normalizeText(item.descricao) || 'Item',
        quantidade: Number(item.quantidade || 0),
        precoUnitario: Number(item.precoUnitario || 0),
        desconto: Number(item.desconto || 0),
        subtotal: Number(item.subtotal || 0),
      }))

      const items: ItemizedLineItem[] = itemsFromPedido.length > 0
        ? itemsFromPedido
        : [
            {
              descricao: normalizeText(oportunidade.titulo) || 'Item comercial',
              quantidade: 1,
              precoUnitario: totalBruto,
              desconto: totalDesconto,
              subtotal: totalLiquido,
            },
          ]

      const pdfBytes = await buildItemizedCommercialPdf({
        docType: 'orcamento',
        docNumber,
        issueDate: today,
        secondaryLabelTitle: 'Validade',
        secondaryLabelValue: validadeLabel(oportunidade.dataFechamento, pdfConfig?.validadeDias),
        paymentLabel: paymentLabel(oportunidade.formaPagamento, oportunidade.parcelas),
        statusLabel: STATUS_LABEL[oportunidade.status] ?? oportunidade.status,
        title: oportunidade.titulo,
        notes: oportunidade.descricao || oportunidade.pedido?.observacoes,
        items,
        totals: {
          bruto: totalBruto,
          desconto: totalDesconto,
          liquido: totalLiquido,
        },
        customer: {
          nome: oportunidade.cliente.nome,
          documento: oportunidade.cliente.documento,
          empresa: oportunidade.cliente.empresa,
          email: oportunidade.cliente.email,
          telefone: oportunidade.cliente.telefone,
          endereco: oportunidade.cliente.endereco,
          cidade: oportunidade.cliente.cidade,
          estado: oportunidade.cliente.estado,
        },
        company: {
          nomeEmpresa: pdfConfig?.nomeEmpresa,
          nomeVendedor: pdfConfig?.nomeVendedor,
          telefone: pdfConfig?.telefone,
          email: pdfConfig?.email,
          site: pdfConfig?.site,
          rodape: pdfConfig?.rodape,
          corPrimaria: pdfConfig?.corPrimaria,
          logoBase64: pdfConfig?.logoBase64,
          logoPosicao: pdfConfig?.logoPosicao,
        },
      })

      const emissaoFilePart = today.toLocaleDateString('pt-BR').replace(/\//g, '.')
      const fileName = `Orcamento ${docNumber} - ${emissaoFilePart}.pdf`
      const encodedFileName = encodeURIComponent(fileName)

      const pdfArrayBuffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength,
      ) as ArrayBuffer
      const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' })

      setCachedPdfBuffer(cacheKey, pdfBlob, etag)

      return new NextResponse(pdfBlob, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"; filename*=UTF-8''${encodedFileName}`,
          'Cache-Control': cacheControl,
          ETag: etag,
        },
      })
    } catch (error) {
      console.error('Erro ao gerar PDF do orcamento:', error)
      return NextResponse.json({ error: 'Erro ao gerar PDF do orcamento' }, { status: 500 })
    }
  })
}
