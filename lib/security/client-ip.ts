type HeaderValue = string | string[] | null | undefined

type HeadersLike = Headers | Record<string, HeaderValue> | null | undefined

function normalizeCandidate(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const withoutQuotes = trimmed.replace(/^"+|"+$/g, '')
  const withoutIpv6Brackets = withoutQuotes.replace(/^\[|\]$/g, '')
  const withoutPort = withoutIpv6Brackets.replace(/:\d+$/, '')
  return withoutPort || undefined
}

function extractForwardedFor(forwarded: string): string | undefined {
  const match = forwarded.match(/for=([^;,\s]+)/i)
  if (!match) return undefined
  return normalizeCandidate(match[1] ?? '')
}

function getHeaderValue(headers: HeadersLike, headerName: string): string | undefined {
  if (!headers) return undefined

  if (headers instanceof Headers) {
    const value = headers.get(headerName)
    return value ?? undefined
  }

  const directValue = headers[headerName] ?? headers[headerName.toLowerCase()]
  if (Array.isArray(directValue)) {
    return directValue.join(',')
  }
  return typeof directValue === 'string' ? directValue : undefined
}

export function extractClientIpFromHeaders(headers: HeadersLike): string {
  const cfConnectingIp = getHeaderValue(headers, 'cf-connecting-ip')
  if (cfConnectingIp) {
    return normalizeCandidate(cfConnectingIp) ?? 'unknown'
  }

  const xRealIp = getHeaderValue(headers, 'x-real-ip')
  if (xRealIp) {
    return normalizeCandidate(xRealIp) ?? 'unknown'
  }

  const xForwardedFor = getHeaderValue(headers, 'x-forwarded-for')
  if (xForwardedFor) {
    const firstHop = xForwardedFor.split(',')[0] ?? ''
    return normalizeCandidate(firstHop) ?? 'unknown'
  }

  const forwarded = getHeaderValue(headers, 'forwarded')
  if (forwarded) {
    return extractForwardedFor(forwarded) ?? 'unknown'
  }

  return 'unknown'
}

export function extractClientIpFromRequest(request: Request): string {
  return extractClientIpFromHeaders(request.headers)
}
