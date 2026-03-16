import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Obtem o origin da aplicacao a partir do request, considerando headers de proxy (Vercel, etc).
 */
export function getRequestOrigin(request: Request): string | null {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  if (forwardedHost && forwardedProto) {
    const host = forwardedHost.split(',')[0]?.trim()
    const proto = forwardedProto.split(',')[0]?.trim()
    if (host && proto) {
      return `${proto}://${host}`.replace(/\/$/, '')
    }
  }
  try {
    const url = new URL(request.url)
    return url.origin
  } catch {
    return null
  }
}

function readEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria nao configurada: ${name}`)
  }
  return value
}

function readFirstEnv(names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim()
    if (value) {
      return value
    }
  }

  throw new Error(
    `Variavel de ambiente obrigatoria nao configurada: ${names.join(' ou ')}`
  )
}

function normalizeOrigin(origin?: string) {
  if (!origin) return null
  return origin.trim().replace(/\/$/, '')
}

export function getSupabaseEmailRedirectTo(origin?: string) {
  const explicitRedirect = process.env.SUPABASE_AUTH_EMAIL_REDIRECT_URL?.trim()
  if (explicitRedirect) {
    try {
      const url = new URL(explicitRedirect)
      const path = url.pathname.replace(/\/$/, '')
      if (!path || path === '/') {
        return `${url.origin}/auth/confirm`
      }
    } catch {
      // URL invalida, usa fallback
    }
    return explicitRedirect
  }

  const fallbackOrigin =
    normalizeOrigin(origin) ?? normalizeOrigin(process.env.NEXTAUTH_URL) ?? null

  if (!fallbackOrigin) {
    throw new Error(
      'Configure SUPABASE_AUTH_EMAIL_REDIRECT_URL ou NEXTAUTH_URL para confirmar emails.'
    )
  }

  return `${fallbackOrigin}/auth/confirm`
}

export function getSupabaseResetPasswordRedirectTo(origin?: string) {
  const explicitRedirect = process.env.SUPABASE_AUTH_EMAIL_REDIRECT_URL?.trim()
  if (explicitRedirect) {
    try {
      const url = new URL(explicitRedirect)
      return `${url.origin}/auth/reset-password`
    } catch {
      // URL invalida, usa fallback
    }
  }
  const fallbackOrigin =
    normalizeOrigin(origin) ?? normalizeOrigin(process.env.NEXTAUTH_URL) ?? null
  if (!fallbackOrigin) {
    throw new Error(
      'Configure SUPABASE_AUTH_EMAIL_REDIRECT_URL ou NEXTAUTH_URL para redefinir senha.'
    )
  }
  return `${fallbackOrigin}/auth/reset-password`
}

export function getSupabaseOAuthCallbackUrl(origin?: string) {
  const explicitRedirect = process.env.SUPABASE_AUTH_EMAIL_REDIRECT_URL?.trim()
  if (explicitRedirect) {
    try {
      const url = new URL(explicitRedirect)
      return `${url.origin}/auth/callback`
    } catch {
      // fallback abaixo
    }
  }

  const fallbackOrigin =
    normalizeOrigin(origin) ?? normalizeOrigin(process.env.NEXTAUTH_URL) ?? null

  if (!fallbackOrigin) {
    throw new Error(
      'Configure SUPABASE_AUTH_EMAIL_REDIRECT_URL ou NEXTAUTH_URL para login com Google.'
    )
  }

  return `${fallbackOrigin}/auth/callback`
}

export function createSupabaseServerClient() {
  const url = readEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = readFirstEnv([
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
  ])

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Cliente Admin (service_role) para operacoes que precisam de privilegios elevados.
 * Usado para generateLink (criar usuario + obter link sem enviar email pelo Supabase).
 * NUNCA expor a service_role key no cliente.
 * Retorna null se SUPABASE_SERVICE_ROLE_KEY nao estiver configurada.
 */
export function createSupabaseAdminClient(): ReturnType<typeof createClient> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !serviceRoleKey) return null
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
