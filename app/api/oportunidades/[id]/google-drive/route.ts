import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/route-helpers'
import {
  GoogleDriveIntegrationError,
  uploadPdfToGoogleDrive,
} from '@/lib/google-drive/service'

export const dynamic = 'force-dynamic'

function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function extractPdfFileName(contentDisposition: string | null, fallbackName: string) {
  if (!contentDisposition) return fallbackName

  const utf8FileNameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8FileNameMatch?.[1]) {
    try {
      const decoded = decodeURIComponent(utf8FileNameMatch[1]).trim()
      if (decoded.length > 0) return decoded
    } catch {
      // fallback para regex simples abaixo
    }
  }

  const plainFileNameMatch = contentDisposition.match(/filename=\"?([^\";]+)\"?/i)
  if (plainFileNameMatch?.[1]) {
    const plain = plainFileNameMatch[1].trim()
    if (plain.length > 0) return plain
  }

  return fallbackName
}

function mapGoogleDriveError(error: GoogleDriveIntegrationError) {
  if (error.code === 'GOOGLE_DRIVE_NOT_CONNECTED') {
    return {
      status: 400,
      payload: { error: 'google_drive_not_connected' },
    }
  }

  if (error.code === 'GOOGLE_DRIVE_OAUTH_MISCONFIGURED') {
    return {
      status: 500,
      payload: { error: 'google_drive_oauth_misconfigured' },
    }
  }

  if (error.code === 'GOOGLE_DRIVE_TOKEN_REFRESH_FAILED') {
    return {
      status: 502,
      payload: { error: 'google_drive_token_refresh_failed' },
    }
  }

  return {
    status: 502,
    payload: { error: 'google_drive_upload_failed' },
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: oportunidadeId } = await params

  return withAuth(request, async (userId) => {
    try {
      const body = (await request.json().catch(() => null)) as { folderId?: unknown } | null
      const folderId = normalizeOptionalString(body?.folderId)
      const origin = new URL(request.url).origin

      const pdfResponse = await fetch(
        `${origin}/api/oportunidades/${encodeURIComponent(oportunidadeId)}/pdf`,
        {
          method: 'GET',
          headers: {
            cookie: request.headers.get('cookie') ?? '',
          },
          cache: 'no-store',
        }
      )

      if (!pdfResponse.ok) {
        const pdfErrorPayload = (await pdfResponse.json().catch(() => null)) as
          | { error?: string }
          | null

        if (pdfResponse.status === 404) {
          return NextResponse.json(
            { error: pdfErrorPayload?.error ?? 'orcamento_not_found' },
            { status: 404 }
          )
        }

        return NextResponse.json(
          { error: 'google_drive_pdf_generation_failed' },
          { status: 502 }
        )
      }

      const pdfBuffer = await pdfResponse.arrayBuffer()
      const fallbackFileName = `orcamento-${oportunidadeId}.pdf`
      const fileName = extractPdfFileName(
        pdfResponse.headers.get('content-disposition'),
        fallbackFileName
      )

      const result = await uploadPdfToGoogleDrive({
        userId,
        fileName,
        pdfBytes: new Uint8Array(pdfBuffer),
        parentFolderId: folderId,
      })

      return NextResponse.json(result)
    } catch (error) {
      if (error instanceof GoogleDriveIntegrationError) {
        const mapped = mapGoogleDriveError(error)
        return NextResponse.json(mapped.payload, { status: mapped.status })
      }

      console.error('Erro ao enviar orcamento para Google Drive:', error)
      return NextResponse.json(
        { error: 'google_drive_upload_error' },
        { status: 500 }
      )
    }
  })
}
