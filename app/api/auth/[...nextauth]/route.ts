import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Usuario ou email", type: "text" },
                password: { label: "Senha", type: "password" }
            },
            async authorize(credentials) {
                const identifier = credentials?.username?.trim().toLowerCase()
                const password = credentials?.password

                if (!identifier || !password) {
                    return null
                }

                const user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { username: identifier },
                            { email: identifier },
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
    secret: process.env.NEXTAUTH_SECRET,
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
    debug: process.env.NODE_ENV === 'development',
})

export { handler as GET, handler as POST }
