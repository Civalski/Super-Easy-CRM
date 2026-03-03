import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { extractClientIpFromHeaders } from "@/lib/security/client-ip"
import {
    consumeRateLimit,
    loginRateLimitConfig,
    resetRateLimit,
} from "@/lib/security/rate-limit"
import { verifyTurnstileToken } from "@/lib/security/turnstile"
import { getNextAuthSecret } from "@/lib/nextauth-secret"

export const dynamic = 'force-dynamic'

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Usuario ou email", type: "text" },
                password: { label: "Senha", type: "password" },
                turnstileToken: { label: "Turnstile Token", type: "text" },
                website: { label: "Website", type: "text" },
            },
            async authorize(credentials, req) {
                const identifier = credentials?.username?.trim().toLowerCase()
                const password = credentials?.password
                const turnstileToken =
                    typeof credentials?.turnstileToken === "string"
                        ? credentials.turnstileToken.trim()
                        : ""
                const honeypot =
                    typeof credentials?.website === "string"
                        ? credentials.website.trim()
                        : ""
                const clientIp = extractClientIpFromHeaders(
                    (req as { headers?: Headers | Record<string, string | string[] | undefined> })?.headers
                )
                const byIpKey = `auth:login:ip:${clientIp}`
                const byIdentifierKey = `auth:login:id:${clientIp}:${identifier || "unknown"}`

                const byIpLimit = consumeRateLimit(byIpKey, loginRateLimitConfig)
                const byIdentifierLimit = consumeRateLimit(byIdentifierKey, loginRateLimitConfig)

                if (!byIpLimit.allowed || !byIdentifierLimit.allowed) {
                    console.warn("Login bloqueado por rate limit", { clientIp, identifier })
                    return null
                }

                if (honeypot.length > 0) {
                    console.warn("Login rejeitado por honeypot", { clientIp })
                    return null
                }

                if (!identifier || !password) {
                    console.warn("Login rejeitado por payload incompleto", { clientIp, identifier })
                    return null
                }

                const turnstileResult = await verifyTurnstileToken({
                    token: turnstileToken,
                    remoteIp: clientIp,
                })
                if (!turnstileResult.success) {
                    console.warn("Login rejeitado por Turnstile", {
                        clientIp,
                        identifier,
                        errors: turnstileResult.errorCodes,
                    })
                    return null
                }

                const user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { username: { equals: identifier, mode: 'insensitive' } },
                            { email: { equals: identifier, mode: 'insensitive' } },
                        ],
                    },
                })

                if (!user) {
                    return null
                }

                const valid = await bcrypt.compare(password, user.passwordHash)

                if (!valid) {
                    return null
                }

                resetRateLimit(byIpKey)
                resetRateLimit(byIdentifierKey)

                return {
                    id: user.id,
                    name: user.name ?? user.username,
                    email: user.email,
                    role: user.role,
                    username: user.username,
                }
            }
        })
    ],
    secret: getNextAuthSecret(),
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.userId = user.id
                token.role = user.role
                token.username = user.username
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.userId as string
                session.user.role = token.role as string
                session.user.username = (token.username as string) || null
            }
            return session
        }
    },
    session: {
        strategy: "jwt",
    },
    debug: process.env.NEXTAUTH_DEBUG === 'true',
})

export async function GET(
  req: Request,
  context: { params: Promise<{ nextauth?: string[] }> }
) {
  return handler(req, context)
}
export async function POST(
  req: Request,
  context: { params: Promise<{ nextauth?: string[] }> }
) {
  return handler(req, context)
}
