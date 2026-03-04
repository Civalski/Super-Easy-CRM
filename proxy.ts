import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { getNextAuthSecret } from "@/lib/nextauth-secret"

const adminApiPrefixes = [
    '/api/seed',
    '/api/prospectos/bulk',
    '/api/prospectos/importar',
]

const publicApiPrefixes = [
    '/api/auth',
    '/api/billing/mercado-pago/webhook',
]

function isAdminOnly(pathname: string) {
    return adminApiPrefixes.some((prefix) => pathname.startsWith(prefix))
}

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl

    // Allow public static files (e.g. /arker10.png) without auth.
    if (/\.[^/]+$/.test(pathname)) {
        return NextResponse.next()
    }

    if (publicApiPrefixes.some((prefix) => pathname.startsWith(prefix))) {
        return NextResponse.next()
    }

    if (pathname === '/login' || pathname === '/register') {
        return NextResponse.next()
    }

    if (
        pathname.startsWith('/_next/static') ||
        pathname.startsWith('/_next/image') ||
        pathname === '/favicon.ico'
    ) {
        return NextResponse.next()
    }

    const token = await getToken({ req, secret: getNextAuthSecret() })

    if (!token) {
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
    }

    if (pathname.startsWith('/api') && isAdminOnly(pathname)) {
        if (token.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
    }

    if ((pathname === '/login' || pathname === '/register') && token) {
        return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
    ],
}
