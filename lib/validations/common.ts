import { z } from 'zod'

/** Schema para parâmetros de paginação em query strings */
export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return 1
      const n = Number(v)
      return Number.isInteger(n) && n >= 1 ? n : 1
    }),
  limit: z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v) return 20
      const n = Number(v)
      if (!Number.isInteger(n)) return 20
      return Math.min(50, Math.max(1, n))
    }),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>

/** Extrai e valida limit de searchParams (fallback, max) */
export function parseLimit(
  value: string | null,
  fallback = 20,
  max = 50
): number {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) return fallback
  return Math.min(max, Math.max(1, parsed))
}

/** Extrai e valida page de searchParams */
export function parsePage(value: string | null, fallback = 1): number {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) return fallback
  return Math.max(1, parsed)
}
