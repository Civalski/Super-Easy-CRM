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

const STATUS_ENTREGA_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  em_preparacao: 'Em preparacao',
  enviado: 'Enviado',
  entregue: 'Entregue',
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

function normalizeItemDescription(description: string | null | undefined) {
  return (description ?? '').replace(/\s+/g, ' ').trim()
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: pedidoId } = await params
  return withAuth(request, async (userId) => {
    try {
      await ensureDatabaseInitialized()

      const [pedido, pdfConfig] = await Promise.all([
        prisma.pedido.findFirst({
          where: { id: pedidoId, userId },
          include: {
            oportunidade: {
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
              },
            },
            itens: { orderBy: { createdAt: 'asc' } },
          },
        }),
        prisma.pdfConfig.findUnique({ where: { userId } }),
      ])

      if (!pedido) {
        return NextResponse.json({ error: 'Pedido nao encontrado' }, { status: 404 })
      }

      const today = new Date()
      const docNum = String(pedido.numero).padStart(5, '0')
      const dayKey = today.toISOString().slice(0, 10)
      const cacheKey = buildPdfCacheKey([
        'pedido-pdf',
        'itemized-v2',
        userId,
        pedido.id,
        pedido.updatedAt?.getTime(),
        pedido.oportunidade?.updatedAt?.getTime(),
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
            'Content-Disposition': `attachment; filename="Pedido ${docNum}.pdf"`,
            'Cache-Control': cacheControl,
            ETag: cached.etag,
          },
        })
      }

      const totalBruto = Number(pedido.totalBruto || 0)
      const totalDesconto = Number(pedido.totalDesconto || 0)
      const totalLiquido = Number(pedido.totalLiquido || 0)

      const items: ItemizedLineItem[] = pedido.itens.length > 0
        ? pedido.itens.map((item) => ({
            descricao: normalizeItemDescription(item.descricao) || 'Item',
            quantidade: Number(item.quantidade || 0),
            precoUnitario: Number(item.precoUnitario || 0),
            desconto: Number(item.desconto || 0),
            subtotal: Number(item.subtotal || 0),
          }))
        : [
            {
              descricao: normalizeItemDescription(pedido.oportunidade.titulo) || 'Item comercial',
              quantidade: 1,
              precoUnitario: totalBruto,
              desconto: totalDesconto,
              subtotal: totalLiquido,
            },
          ]

      const statusEntrega = STATUS_ENTREGA_LABEL[pedido.statusEntrega] ?? pedido.statusEntrega
      const statusPagamento = pedido.pagamentoConfirmado ? 'Pagamento confirmado' : 'Pagamento pendente'

      const pdfBytes = await buildItemizedCommercialPdf({
        docType: 'pedido',
        docNumber: docNum,
        issueDate: today,
        secondaryLabelTitle: 'Entrega',
        secondaryLabelValue: dateBr(pedido.dataEntrega),
        paymentLabel: paymentLabel(pedido.formaPagamento || pedido.oportunidade.formaPagamento, pedido.oportunidade.parcelas),
        statusLabel: `${statusEntrega} | ${statusPagamento}`,
        title: pedido.oportunidade.titulo,
        notes: pedido.observacoes || pedido.oportunidade.descricao,
        items,
        totals: {
          bruto: totalBruto,
          desconto: totalDesconto,
          liquido: totalLiquido,
        },
        customer: {
          nome: pedido.oportunidade.cliente.nome,
          documento: pedido.oportunidade.cliente.documento,
          empresa: pedido.oportunidade.cliente.empresa,
          email: pedido.oportunidade.cliente.email,
          telefone: pedido.oportunidade.cliente.telefone,
          endereco: pedido.oportunidade.cliente.endereco,
          cidade: pedido.oportunidade.cliente.cidade,
          estado: pedido.oportunidade.cliente.estado,
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

      const emissaoDateForFile = today.toLocaleDateString('pt-BR').replace(/\//g, '.')
      const fileName = `Pedido ${docNum} - ${emissaoDateForFile}.pdf`
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
      console.error('Erro ao gerar PDF do pedido:', error)
      return NextResponse.json({ error: 'Erro ao gerar PDF do pedido' }, { status: 500 })
    }
  })
}
