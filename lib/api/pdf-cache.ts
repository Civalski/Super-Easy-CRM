import { createHash } from 'node:crypto'

const PDF_CACHE_TTL_MS = 10 * 60 * 1000
const PDF_CACHE_MAX_ENTRIES = 300
const PDF_CACHE_MAX_TOTAL_BYTES = 120 * 1024 * 1024

type PdfCacheEntry = {
  blob: Blob
  etag: string
  expiresAt: number
  sizeBytes: number
  lastAccessAt: number
}

const pdfCache = new Map<string, PdfCacheEntry>()
let pdfCacheTotalBytes = 0

function removePdfCacheEntry(key: string) {
  const existing = pdfCache.get(key)
  if (!existing) return
  pdfCache.delete(key)
  pdfCacheTotalBytes = Math.max(0, pdfCacheTotalBytes - existing.sizeBytes)
}

function prunePdfCache(now: number) {
  pdfCache.forEach((entry, key) => {
    if (entry.expiresAt <= now) removePdfCacheEntry(key)
  })

  if (pdfCache.size <= PDF_CACHE_MAX_ENTRIES && pdfCacheTotalBytes <= PDF_CACHE_MAX_TOTAL_BYTES) {
    return
  }

  const entriesByLeastRecent = Array.from(pdfCache.entries()).sort(
    (a, b) => a[1].lastAccessAt - b[1].lastAccessAt
  )

  for (const [key] of entriesByLeastRecent) {
    if (pdfCache.size <= PDF_CACHE_MAX_ENTRIES && pdfCacheTotalBytes <= PDF_CACHE_MAX_TOTAL_BYTES) {
      break
    }
    removePdfCacheEntry(key)
  }
}

export function buildPdfCacheKey(parts: Array<string | number | null | undefined>): string {
  return parts.map((part) => String(part ?? '')).join(':')
}

export function createPdfEtag(cacheKey: string): string {
  const hash = createHash('sha1').update(cacheKey).digest('hex')
  return `"${hash}"`
}

export function getCachedPdfBuffer(cacheKey: string): PdfCacheEntry | null {
  const now = Date.now()
  const entry = pdfCache.get(cacheKey)
  if (!entry) return null

  if (entry.expiresAt <= now) {
    removePdfCacheEntry(cacheKey)
    return null
  }

  entry.lastAccessAt = now
  return entry
}

export function setCachedPdfBuffer(cacheKey: string, blob: Blob, etag: string) {
  const now = Date.now()
  const existing = pdfCache.get(cacheKey)
  if (existing) {
    pdfCacheTotalBytes = Math.max(0, pdfCacheTotalBytes - existing.sizeBytes)
  }

  const entry: PdfCacheEntry = {
    blob,
    etag,
    expiresAt: now + PDF_CACHE_TTL_MS,
    sizeBytes: blob.size,
    lastAccessAt: now,
  }

  pdfCache.set(cacheKey, entry)
  pdfCacheTotalBytes += entry.sizeBytes
  prunePdfCache(now)
}

export function buildPdfCacheControl() {
  return 'private, max-age=300, stale-while-revalidate=60'
}
