'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
    const router = useRouter()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const result = await signIn('credentials', {
                username,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError('Usuário ou senha inválidos')
                setLoading(false)
            } else {
                router.push('/')
                router.refresh()
            }
        } catch (err) {
            setError('Ocorreu um erro ao tentar fazer login')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#030014] relative overflow-hidden">
            {/* Geometric Grid Background */}
            <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            {/* Ambient Glow Effects (Fixed for visibility) */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[120px] animate-blob"></div>
                <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/30 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
            </div>

            {/* Radial Vignette to focus center */}
            <div className="absolute inset-0 bg-transparent bg-[radial-gradient(circle_at_center,transparent_10%,#030014_90%)]"></div>

            <div className="max-w-md w-full space-y-8 bg-gray-900/40 backdrop-blur-xl p-8 rounded-2xl border border-gray-800/50 shadow-2xl relative z-10 transition-all duration-300 hover:border-purple-500/30">
                <div className="text-center flex flex-col items-center">
                    <div className="mb-6 relative">
                        <Image
                            src="/arkerlogo1.png"
                            alt="Arker CRM"
                            width={220}
                            height={80}
                            className="object-contain"
                            priority
                        />
                    </div>

                    <p className="mt-2 text-sm text-gray-400">
                        Entre com suas credenciais para acessar sua conta
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="group">
                            <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-1 transition-colors group-focus-within:text-purple-400">
                                Usuário ou email
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-700 placeholder-gray-600 text-white bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200"
                                placeholder="Digite seu usuário"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="group">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1 transition-colors group-focus-within:text-purple-400">
                                Senha
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-700 placeholder-gray-600 text-white bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200"
                                placeholder="Digite sua senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm text-center bg-red-500/10 py-3 rounded-xl border border-red-500/20 animate-pulse">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 transform hover:-translate-y-0.5"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Autenticando...
                                </span>
                            ) : (
                                'Acessar Plataforma'
                            )}
                        </button>
                    </div>

                    <div className="text-center text-sm text-gray-500">
                        Não tem conta?{' '}
                        <Link className="text-purple-400 hover:text-purple-300 font-medium transition-colors hover:underline" href="/register">
                            Criar nova conta
                        </Link>
                    </div>
                </form>
            </div>

            <div className="absolute bottom-4 text-xs text-gray-600 z-10">
                &copy; {new Date().getFullYear()} Arker CRM. Todos os direitos reservados.
            </div>
        </div>
    )
}
