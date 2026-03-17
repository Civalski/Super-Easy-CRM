import 'server-only'
import { prisma } from '@/lib/prisma'

const GOOGLE_DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
const GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo'
const GOOGLE_TOKEN_REFRESH_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_DRIVE_UPLOAD_URL =
  'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink'

export type GoogleDriveIntegrationErrorCode =
  | 'GOOGLE_DRIVE_NOT_CONNECTED'
  | 'GOOGLE_DRIVE_OAUTH_MISCONFIGURED'
  | 'GOOGLE_DRIVE_TOKEN_REFRESH_FAILED'
  | 'GOOGLE_DRIVE_UPLOAD_FAILED'

export class GoogleDriveIntegrationError extends Error {
  readonly code: GoogleDriveIntegrationErrorCode

  constructor(code: GoogleDriveIntegrationErrorCode, message: string) {
    super(message)
    this.name = 'GoogleDriveIntegrationError'
    this.code = code
  }
}

export type UpsertGoogleOAuthTokensForUserInput = {
  userId: string
  supabaseUserId?: string | null
  accessToken?: string | null
  refreshToken?: string | null
  tokenType?: string | null
  scope?: string | null
  expiresAtIso?: string | null
}

export type UploadPdfToGoogleDriveInput = {
  userId: string
  fileName: string
  pdfBytes: Uint8Array
  parentFolderId?: string | null
}

export type GoogleDriveUploadResult = {
  fileId: string
  webViewLink: string
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function parseOptionalIsoDate(value: string | null | undefined) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function resolveGoogleOAuthClientCredentials() {
  const clientId = normalizeOptionalString(process.env.GOOGLE_OAUTH_CLIENT_ID)
  const clientSecret = normalizeOptionalString(process.env.GOOGLE_OAUTH_CLIENT_SECRET)

  if (!clientId || !clientSecret) {
    throw new GoogleDriveIntegrationError(
      'GOOGLE_DRIVE_OAUTH_MISCONFIGURED',
      'GOOGLE_OAUTH_CLIENT_ID e GOOGLE_OAUTH_CLIENT_SECRET sao obrigatorios.'
    )
  }

  return { clientId, clientSecret }
}

async function isGoogleDriveAccessTokenValid(accessToken: string) {
  try {
    const response = await fetch(
      `${GOOGLE_TOKEN_INFO_URL}?access_token=${encodeURIComponent(accessToken)}`,
      { method: 'GET', cache: 'no-store' }
    )

    if (!response.ok) {
      return false
    }

    const payload = (await response.json()) as {
      expires_in?: unknown
      scope?: unknown
    }

    const expiresIn =
      typeof payload.expires_in === 'string'
        ? Number.parseInt(payload.expires_in, 10)
        : typeof payload.expires_in === 'number'
          ? payload.expires_in
          : null

    if (typeof expiresIn === 'number' && Number.isFinite(expiresIn) && expiresIn <= 60) {
      return false
    }

    const scopesRaw = normalizeOptionalString(payload.scope)
    if (!scopesRaw) {
      return true
    }

    const scopes = new Set(scopesRaw.split(/\s+/).filter(Boolean))
    return scopes.has(GOOGLE_DRIVE_FILE_SCOPE)
  } catch {
    return false
  }
}

type GoogleRefreshTokenResponse = {
  access_token: string
  expires_in?: number
  token_type?: string
  scope?: string
  refresh_token?: string
}

async function refreshGoogleAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = resolveGoogleOAuthClientCredentials()

  const formData = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })

  const response = await fetch(GOOGLE_TOKEN_REFRESH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
    cache: 'no-store',
  })

  if (!response.ok) {
    const reason = await response.text().catch(() => '')
    throw new GoogleDriveIntegrationError(
      'GOOGLE_DRIVE_TOKEN_REFRESH_FAILED',
      `Falha ao atualizar token de acesso do Google: ${reason || response.status}`
    )
  }

  const payload = (await response.json()) as GoogleRefreshTokenResponse
  const refreshedAccessToken = normalizeOptionalString(payload.access_token)

  if (!refreshedAccessToken) {
    throw new GoogleDriveIntegrationError(
      'GOOGLE_DRIVE_TOKEN_REFRESH_FAILED',
      'Google nao retornou access_token no refresh.'
    )
  }

  const refreshedRefreshToken = normalizeOptionalString(payload.refresh_token)
  const refreshedScope = normalizeOptionalString(payload.scope)
  const refreshedTokenType = normalizeOptionalString(payload.token_type)
  const expiresAt =
    typeof payload.expires_in === 'number' && Number.isFinite(payload.expires_in)
      ? new Date(Date.now() + payload.expires_in * 1000)
      : null

  return {
    accessToken: refreshedAccessToken,
    refreshToken: refreshedRefreshToken,
    scope: refreshedScope,
    tokenType: refreshedTokenType,
    expiresAt,
  }
}

async function refreshGoogleAccessTokenForUser(userId: string, refreshToken: string) {
  const refreshed = await refreshGoogleAccessToken(refreshToken)

  await prisma.googleOAuthToken.update({
    where: { userId },
    data: {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken ?? undefined,
      scope: refreshed.scope ?? undefined,
      tokenType: refreshed.tokenType ?? undefined,
      expiresAt: refreshed.expiresAt,
      lastRefreshedAt: new Date(),
    },
  })

  return refreshed.accessToken
}

async function getValidGoogleDriveAccessToken(userId: string, forceRefresh = false) {
  const tokenRecord = await prisma.googleOAuthToken.findUnique({
    where: { userId },
  })

  if (!tokenRecord) {
    throw new GoogleDriveIntegrationError(
      'GOOGLE_DRIVE_NOT_CONNECTED',
      'Integracao com Google Drive nao encontrada para este usuario.'
    )
  }

  if (!forceRefresh && tokenRecord.accessToken) {
    const isValid = await isGoogleDriveAccessTokenValid(tokenRecord.accessToken)
    if (isValid) {
      return tokenRecord.accessToken
    }
  }

  if (!tokenRecord.refreshToken) {
    throw new GoogleDriveIntegrationError(
      'GOOGLE_DRIVE_NOT_CONNECTED',
      'Refresh token do Google Drive nao encontrado.'
    )
  }

  return refreshGoogleAccessTokenForUser(tokenRecord.userId, tokenRecord.refreshToken)
}

export async function upsertGoogleOAuthTokensForUser(
  input: UpsertGoogleOAuthTokensForUserInput
) {
  const accessToken = normalizeOptionalString(input.accessToken)
  const refreshToken = normalizeOptionalString(input.refreshToken)
  const tokenType = normalizeOptionalString(input.tokenType)
  const scope = normalizeOptionalString(input.scope)
  const supabaseUserId = normalizeOptionalString(input.supabaseUserId)
  const expiresAt = parseOptionalIsoDate(input.expiresAtIso ?? null)

  if (!accessToken && !refreshToken) {
    return false
  }

  await prisma.googleOAuthToken.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      supabaseUserId: supabaseUserId ?? null,
      accessToken: accessToken ?? null,
      refreshToken: refreshToken ?? null,
      tokenType: tokenType ?? null,
      scope: scope ?? null,
      expiresAt,
      connectedAt: new Date(),
    },
    update: {
      supabaseUserId: supabaseUserId ?? undefined,
      accessToken: accessToken ?? undefined,
      refreshToken: refreshToken ?? undefined,
      tokenType: tokenType ?? undefined,
      scope: scope ?? undefined,
      expiresAt: expiresAt ?? undefined,
      connectedAt: refreshToken ? new Date() : undefined,
    },
  })

  return true
}

export async function uploadPdfToGoogleDrive(
  input: UploadPdfToGoogleDriveInput
): Promise<GoogleDriveUploadResult> {
  const pdfArrayBuffer = input.pdfBytes.buffer.slice(
    input.pdfBytes.byteOffset,
    input.pdfBytes.byteOffset + input.pdfBytes.byteLength
  ) as ArrayBuffer

  const uploadOnce = async (accessToken: string) => {
    const metadata: {
      name: string
      mimeType: string
      parents?: string[]
    } = {
      name: input.fileName,
      mimeType: 'application/pdf',
    }

    const folderId = normalizeOptionalString(input.parentFolderId)
    if (folderId) {
      metadata.parents = [folderId]
    }

    const formData = new FormData()
    formData.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    )
    formData.append(
      'file',
      new Blob([pdfArrayBuffer], { type: 'application/pdf' }),
      input.fileName
    )

    return fetch(GOOGLE_DRIVE_UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
      cache: 'no-store',
    })
  }

  let accessToken = await getValidGoogleDriveAccessToken(input.userId)
  let response = await uploadOnce(accessToken)

  if (response.status === 401) {
    accessToken = await getValidGoogleDriveAccessToken(input.userId, true)
    response = await uploadOnce(accessToken)
  }

  if (!response.ok) {
    const reason = await response.text().catch(() => '')
    throw new GoogleDriveIntegrationError(
      'GOOGLE_DRIVE_UPLOAD_FAILED',
      `Falha no upload do Google Drive: ${reason || response.status}`
    )
  }

  const payload = (await response.json()) as {
    id?: unknown
    webViewLink?: unknown
  }
  const fileId = normalizeOptionalString(payload.id)
  const webViewLink = normalizeOptionalString(payload.webViewLink)

  if (!fileId || !webViewLink) {
    throw new GoogleDriveIntegrationError(
      'GOOGLE_DRIVE_UPLOAD_FAILED',
      'Google Drive nao retornou id ou webViewLink.'
    )
  }

  return {
    fileId,
    webViewLink,
  }
}
