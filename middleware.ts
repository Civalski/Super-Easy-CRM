import { withAuth } from "next-auth/middleware"

export default withAuth({
    pages: {
        signIn: "/login",
    },
})

export const config = {
    // Proteger todas as rotas exceto api/auth, login, e arquivos estáticos
    matcher: [
        "/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)",
    ],
}
