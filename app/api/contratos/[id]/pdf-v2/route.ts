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
import { renderContractPdfV2 } from '@/lib/pdf/contratos-v2/renderer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PDF_RENDER_VERSION = 'contract-v2-react-pdf-v3'

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
        'contrato-pdf-v2',
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

      const { blob, downloadFileName } = await renderContractPdfV2({
        contrato: {
          id: contrato.id,
          numero: contrato.numero,
          titulo: contrato.titulo,
          tipo: contrato.tipo,
          preambulo: contrato.preambulo,
          clausulas: (contrato.clausulas as Array<{ titulo: string; conteudo: string }>) ?? [],
          dadosPartes: (contrato.dadosPartes as Record<string, Record<string, string>>) ?? {},
          dataAssinatura: contrato.dataAssinatura,
          localAssinatura: contrato.localAssinatura,
          observacoes: contrato.observacoes,
          createdAt: contrato.createdAt,
          updatedAt: contrato.updatedAt,
          cliente: contrato.cliente,
        },
        user: user ?? {},
        pdfConfig,
      })

      const encodedFileName = encodeURIComponent(downloadFileName)
      setCachedPdfBuffer(cacheKey, blob, etag)

      return new NextResponse(blob, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `${disposition}; filename="${documentLabel} ${docNum}.pdf"; filename*=UTF-8''${encodedFileName}`,
          'Cache-Control': cacheControl,
          ETag: etag,
        },
      })
    } catch (error) {
      console.error('Erro ao gerar PDF v2 do contrato:', error)
      return NextResponse.json({ error: 'Erro ao gerar PDF do contrato' }, { status: 500 })
    }
  })
}
