/**
 * URL absoluta para o logo nos e-mails transacionais.
 * - EMAIL_LOGO_URL: substitui a URL padrao (white-label, CDN, etc.)
 * - Padrao: logo hospedado no site Arkersoft (fundo escuro no template).
 */
const DEFAULT_EMAIL_LOGO_URL = 'https://www.arkersoft.com.br/arkerlogo1.png'

export function resolveEmailLogoUrl(): string {
  const explicit = process.env.EMAIL_LOGO_URL?.trim()
  if (explicit) return explicit
  return DEFAULT_EMAIL_LOGO_URL
}
