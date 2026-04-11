import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isOssEdition } from '@/lib/crmEdition'

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

export function middleware(request: NextRequest) {
  if (!isOssEdition()) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/')) {
    if (isOssApiAllowed(pathname)) {
      return NextResponse.next()
    }
    return NextResponse.json(
      { error: 'Recurso não disponível nesta edição do CRM.' },
      { status: 403 }
    )
  }

  if (isOssPageAllowed(pathname)) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = '/grupos'
  url.search = ''
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3)$).*)',
  ],
}
