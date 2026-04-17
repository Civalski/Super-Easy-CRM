import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { isOssEdition } from '@/lib/crmEdition'
import { getNextAuthSecret } from '@/lib/nextauth-secret'

/* ------------------------------------------------------------------ */
/*  Paths that never require a session (login, register, OAuth, etc.) */
/* ------------------------------------------------------------------ */

const PUBLIC_PAGE_BASES = [
  '/login',
  '/register',
  '/auth',
] as const

function isPublicPage(pathname: string): boolean {
  return PUBLIC_PAGE_BASES.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`)
  )
}

/* ------------------------------------------------------------------ */
/*  OSS-edition allow / deny lists                                    */
/* ------------------------------------------------------------------ */

function matchesBasePath(pathname: string, base: string): boolean {
  if (pathname === base) return true
  return pathname.startsWith(`${base}/`)
}

const OSS_PAGE_BASES = [
  '/',
  '/login',
  '/register',
  '/auth',
  '/grupos',
  '/oportunidades',
  '/clientes',
  '/tarefas',
  '/configuracoes',
  '/onboarding',
  '/alterar-senha',
  '/suporte',
] as const

function isOssPageAllowed(pathname: string): boolean {
  return OSS_PAGE_BASES.some((base) => matchesBasePath(pathname, base))
}

const OSS_API_ALLOW_PREFIXES = [
  '/api/auth',
  '/api/clientes',
  '/api/grupos',
  '/api/oportunidades',
  '/api/tarefas',
  '/api/motivos-perda',
  '/api/pessoas',
  '/api/notificacoes',
  '/api/busca',
  '/api/configuracoes/pdf',
  '/api/users/me/account',
  '/api/users/me/password',
  '/api/users/me/onboarding',
] as const

const OSS_API_DENIED_PREFIXES = ['/api/users/me/export', '/api/users/me/import'] as const

function isOssApiAllowed(pathname: string): boolean {
  for (const denied of OSS_API_DENIED_PREFIXES) {
    if (pathname === denied || pathname.startsWith(`${denied}/`)) return false
  }
  return OSS_API_ALLOW_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

/* ------------------------------------------------------------------ */
/*  OSS page/API guard                                                */
/* ------------------------------------------------------------------ */

function applyOssGuard(request: NextRequest, pathname: string): NextResponse | null {
  if (!isOssEdition()) return null

  if (pathname.startsWith('/api/')) {
    if (isOssApiAllowed(pathname)) return null
    return NextResponse.json(
      { error: 'Recurso não disponível nesta edição do CRM.' },
      { status: 403 }
    )
  }

  if (isOssPageAllowed(pathname)) return null

  const url = request.nextUrl.clone()
  url.pathname = '/grupos'
  url.search = ''
  return NextResponse.redirect(url)
}

/* ------------------------------------------------------------------ */
/*  Middleware                                                         */
/* ------------------------------------------------------------------ */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API routes handle their own auth via withAuth — skip JWT check here.
  // Sentry tunnel (/monitoring) is also excluded.
  if (pathname.startsWith('/api/') || pathname === '/monitoring') {
    const ossResponse = applyOssGuard(request, pathname)
    return ossResponse ?? NextResponse.next()
  }

  // Public pages (login, register, OAuth callback) — no session required.
  if (isPublicPage(pathname)) {
    return NextResponse.next()
  }

  // All other pages require a valid NextAuth JWT.
  const token = await getToken({ req: request, secret: getNextAuthSecret() })

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set(
      'callbackUrl',
      `${pathname}${request.nextUrl.search}`
    )
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated — apply OSS restriction if applicable.
  const ossResponse = applyOssGuard(request, pathname)
  return ossResponse ?? NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3)$).*)',
  ],
}
