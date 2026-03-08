/**
 * Configuração de plataforma de e-mail para o botão "Enviar e-mail" no funil.
 * O usuário escolhe em Configurações qual cliente de e-mail usar.
 */

export const PLATAFORMA_EMAIL_STORAGE_KEY = 'arker:config:plataforma-email-v1'

export type PlataformaEmail = 'gmail' | 'outlook' | 'outlook365' | 'yahoo' | 'mailto'

export const PLATAFORMAS_EMAIL: { value: PlataformaEmail; label: string }[] = [
  { value: 'gmail', label: 'Gmail' },
  { value: 'outlook', label: 'Outlook (Live)' },
  { value: 'outlook365', label: 'Outlook (Office 365)' },
  { value: 'yahoo', label: 'Yahoo Mail' },
  { value: 'mailto', label: 'Cliente de e-mail padrão' },
]

const DEFAULT_PLATAFORMA: PlataformaEmail = 'mailto'

function normalizePlataforma(value: string | null | undefined): PlataformaEmail {
  const valid = PLATAFORMAS_EMAIL.map((p) => p.value)
  return valid.includes(value as PlataformaEmail) ? (value as PlataformaEmail) : DEFAULT_PLATAFORMA
}

export function getPlataformaEmailPreference(): PlataformaEmail {
  if (typeof window === 'undefined') return DEFAULT_PLATAFORMA
  const stored = window.localStorage.getItem(PLATAFORMA_EMAIL_STORAGE_KEY)
  return normalizePlataforma(stored)
}

export function setPlataformaEmailPreference(plataforma: PlataformaEmail): void {
  if (typeof window === 'undefined') return
  const normalized = normalizePlataforma(plataforma)
  window.localStorage.setItem(PLATAFORMA_EMAIL_STORAGE_KEY, normalized)
}

/**
 * Retorna a URL para abrir o cliente de e-mail com o destinatário pré-preenchido.
 */
export function getEmailComposeUrl(email: string, plataforma?: PlataformaEmail): string {
  const platform = plataforma ?? getPlataformaEmailPreference()
  const encoded = encodeURIComponent(email)

  switch (platform) {
    case 'gmail':
      return `https://mail.google.com/mail/?view=cm&to=${encoded}`
    case 'outlook':
      return `https://outlook.live.com/mail/0/deeplink/compose?to=${encoded}`
    case 'outlook365':
      return `https://outlook.office.com/mail/deeplink/compose?to=${encoded}`
    case 'yahoo':
      return `https://compose.mail.yahoo.com/?to=${encoded}`
    case 'mailto':
    default:
      return `mailto:${email}`
  }
}
