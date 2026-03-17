export const UI_PREFS_COOKIE = 'arker_ui_prefs'
export const AUTH_FLOW_COOKIE = 'arker_auth_flow'
export const UX_FLAGS_COOKIE = 'arker_ux_flags'

/** Tema padrão quando o usuário ainda não escolheu preferência */
export const DEFAULT_THEME = 'dark'

/** TTL do auth_flow em segundos (12 minutos) */
export const AUTH_FLOW_TTL_SECONDS = 12 * 60

/** Opções padrão para cookies */
export const COOKIE_OPTIONS = {
  path: '/' as const,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
}
