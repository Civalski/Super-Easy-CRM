/**
 * Secret usado pelo NextAuth para assinar/verificar JWT.
 * Em desenvolvimento, usa fallback se NEXTAUTH_SECRET nao estiver definido (evita CLIENT_FETCH_ERROR).
 * Em producao, NEXTAUTH_SECRET DEVE estar definido no ambiente.
 */
export function getNextAuthSecret(): string | undefined {
  if (process.env.NEXTAUTH_SECRET) return process.env.NEXTAUTH_SECRET
  if (process.env.NODE_ENV === 'development') return 'dev-secret-change-in-production'
  if (process.env.NODE_ENV === 'production') {
    console.error(
      '[NextAuth] NEXTAUTH_SECRET nao definido em producao. Configure a variavel de ambiente.'
    )
  }
  return undefined
}
