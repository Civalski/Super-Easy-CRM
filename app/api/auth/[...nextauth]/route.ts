import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Usuário", type: "text" },
                password: { label: "Senha", type: "password" }
            },
            async authorize(credentials, req) {
                // Credenciais fixas conforme solicitado
                // "crie uma tela de login e senha, usuario admin, senha admin2000"

                if (
                    credentials?.username === "admin" &&
                    credentials?.password === "admin2000"
                ) {
                    return {
                        id: "1",
                        name: "Administrador",
                        email: "admin@arker.com.br"
                    }
                }

                return null
            }
        })
    ],
    pages: {
        signIn: '/login', // Página customizada de login
    },
    callbacks: {
        async jwt({ token, user }) {
            return token
        },
        async session({ session, token }) {
            return session
        }
    },
    session: {
        strategy: "jwt",
    },
    debug: process.env.NODE_ENV === 'development',
})

export { handler as GET, handler as POST }
