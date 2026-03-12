import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { getNextAuthSecret } from "@/lib/nextauth-secret"
import { isActiveUserSession } from "@/lib/auth-session"

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl

    // Allow public static files (e.g. /arker10.png) without auth.
    if (/\.[^/]+$/.test(pathname)) {
        return NextResponse.next()
    }

    const token = await getToken({ req, secret: getNextAuthSecret() })

    if (pathname === '/login' || pathname === '/register') {
        return token ? NextResponse.redirect(new URL('/', req.url)) : NextResponse.next()
    }

    if (!token) {
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
    }

    const hasActiveSession = await isActiveUserSession({
        userId: typeof token.userId === 'string' ? token.userId : token.sub,
        sessionId: typeof token.sessionId === 'string' ? token.sessionId : undefined,
    })

    if (!hasActiveSession) {
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
    ],
}
