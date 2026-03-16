import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { getNextAuthSecret } from "@/lib/nextauth-secret"

function isPublicAuthPath(pathname: string) {
    return (
        pathname === '/login' ||
        pathname === '/register' ||
        pathname.startsWith('/register/') ||
        pathname === '/auth' ||
        pathname.startsWith('/auth/')
    )
}

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl

    // Allow public static files (e.g. /arker10.png) without auth.
    if (/\.[^/]+$/.test(pathname)) {
        return NextResponse.next()
    }

    const token = await getToken({ req, secret: getNextAuthSecret() })
    const isAuthPage = isPublicAuthPath(pathname)

    if (isAuthPage) {
        return NextResponse.next()
    }

    if (!token) {
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('callbackUrl', `${pathname}${req.nextUrl.search}`)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
    ],
}
