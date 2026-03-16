import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"
import { prisma } from "@/lib/prisma"
import { withRouteContext } from "@/lib/api/route-helpers"
import { extractClientIpFromHeaders } from "@/lib/security/client-ip"
import {
    consumeRateLimit,
    loginRateLimitConfig,
    resetRateLimit,
} from "@/lib/security/rate-limit"
import { verifyTurnstileToken } from "@/lib/security/turnstile"
import { verifyRegisterCompletionToken } from "@/lib/auth/register-completion-token"
import { syncUserSubscriptionFromCheckoutSession } from "@/lib/billing/stripe-subscription-sync"
import { getNextAuthSecret } from "@/lib/nextauth-secret"
import { syncActiveUserSessionCache } from "@/lib/auth-session"

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
                registerToken: { label: "Register Token", type: "text" },
                stripeSessionId: { label: "Stripe Session ID", type: "text" },
            },
            async authorize(credentials, req) {
                const identifier = credentials?.username?.trim().toLowerCase()
                const password = credentials?.password
                const registerToken =
                    typeof credentials?.registerToken === "string"
                        ? credentials.registerToken.trim()
                        : ""
                const stripeSessionId =
                    typeof credentials?.stripeSessionId === "string"
                        ? credentials.stripeSessionId.trim()
                        : ""
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

                if (registerToken && stripeSessionId) {
                    const payload = verifyRegisterCompletionToken(registerToken)
                    if (!payload) {
                        console.warn("Auto login do checkout rejeitado por token invalido", { clientIp })
                        return null
                    }

                    try {
                        const { stripe } = await import("@/lib/billing/stripe")
                        const checkoutSession = await stripe.checkout.sessions.retrieve(
                            stripeSessionId,
                            { expand: ["subscription"] }
                        )

                        if (
                            checkoutSession.status !== "complete" ||
                            checkoutSession.client_reference_id !== payload.userId
                        ) {
                            console.warn("Auto login do checkout rejeitado por sessao inconsistente", {
                                clientIp,
                                stripeSessionId,
                                payloadUserId: payload.userId,
                                sessionUserId: checkoutSession.client_reference_id,
                                sessionStatus: checkoutSession.status,
                            })
                            return null
                        }

                        await syncUserSubscriptionFromCheckoutSession(checkoutSession)

                        const user = await prisma.user.findUnique({
                            where: { id: payload.userId },
                        })

                        if (!user) {
                            return null
                        }

                        const sessionId = randomUUID()

                        await prisma.user.update({
                            where: { id: user.id },
                            data: { activeSessionId: sessionId },
                        })
                        syncActiveUserSessionCache({ userId: user.id, sessionId })

                        resetRateLimit(byIpKey)
                        resetRateLimit(byIdentifierKey)

                        return {
                            id: user.id,
                            name: user.name ?? user.username,
                            email: user.email,
                            role: user.role,
                            username: user.username,
                            sessionId,
                        }
                    } catch (error) {
                        console.error("Falha ao autenticar retorno do checkout Stripe:", error)
                        return null
                    }
                }

                if (registerToken && !stripeSessionId) {
                    const payload = verifyRegisterCompletionToken(registerToken)
                    if (!payload) {
                        console.warn("Auto login do registro rejeitado por token invalido", { clientIp })
                        return null
                    }

                    try {
                        const user = await prisma.user.findUnique({
                            where: { id: payload.userId },
                        })

                        if (!user) {
                            return null
                        }

                        const sessionId = randomUUID()

                        await prisma.user.update({
                            where: { id: user.id },
                            data: { activeSessionId: sessionId },
                        })
                        syncActiveUserSessionCache({ userId: user.id, sessionId })

                        resetRateLimit(byIpKey)
                        resetRateLimit(byIdentifierKey)

                        return {
                            id: user.id,
                            name: user.name ?? user.username,
                            email: user.email,
                            role: user.role,
                            username: user.username,
                            sessionId,
                        }
                    } catch (error) {
                        console.error("Falha ao autenticar conclusao do registro:", error)
                        return null
                    }
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
                    expectedAction: "login",
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

                if (
                    user.subscriptionProvider === "supabase" &&
                    user.subscriptionStatus === "pending"
                ) {
                    console.warn("Login bloqueado ate confirmacao do email", {
                        clientIp,
                        identifier,
                        userId: user.id,
                    })
                    throw new Error(
                        `email_not_confirmed:${(user.email ?? identifier).trim().toLowerCase()}`
                    )
                }

                const sessionId = randomUUID()

                await prisma.user.update({
                    where: { id: user.id },
                    data: { activeSessionId: sessionId },
                })
                syncActiveUserSessionCache({ userId: user.id, sessionId })

                resetRateLimit(byIpKey)
                resetRateLimit(byIdentifierKey)

                return {
                    id: user.id,
                    name: user.name ?? user.username,
                    email: user.email,
                    role: user.role,
                    username: user.username,
                    sessionId,
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
                token.sessionId = user.sessionId
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
  return withRouteContext(req, async () => {
    const response = await handler(req, context)
    return response as Response
  })
}
export async function POST(
  req: Request,
  context: { params: Promise<{ nextauth?: string[] }> }
) {
  return withRouteContext(req, async () => {
    const response = await handler(req, context)
    return response as Response
  })
}
